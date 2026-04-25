import { Hono } from "hono";
import OpenAI from "openai";
import { requireUser } from "./plans";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { mightFail } from "might-fail";
import { db } from "../db";
import { plans as plansTable } from "../schemas/plans";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { incomes as incomesTable } from "../schemas/incomes";
import { expenditures as expendituresTable } from "../schemas/expenditures";
import { assets as assetsTable } from "../schemas/assets";
import { liabilities as liabilitiesTable } from "../schemas/liabilities";
import { financialGoals as financialGoalsTable } from "../schemas/financialGoals";
import { generations as generationsTable } from "../schemas/generations";
import { enforceRateLimit } from "./rateLimit";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const aiRouter = new Hono().post(
  "/generate",
  zValidator("json", z.object({ planId: z.number() })),
  async (c) => {
    enforceRateLimit(c, "ai-generate", 3, 60_000);
    const decodedUser = requireUser(c);
    const generationValues = c.req.valid("json");
    const { result: plan, error: planError } = await mightFail(
      db
        .select()
        .from(plansTable)
        .where(
          and(
            eq(plansTable.planId, generationValues.planId),
            eq(plansTable.userId, decodedUser.id),
          ),
        ),
    );
    if (planError || !plan[0])
      throw new HTTPException(500, { message: "Plan lookup failed" });
    if (!plan || plan.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const [
      { result: incomesQueryResult, error: incomesQueryError },
      { result: expendituresQueryResult, error: expendituresQueryError },
      { result: assetsQueryResult, error: assetsQueryError },
      { result: liabilitiesQueryResult, error: liabilitiesQueryError },
      { result: financialGoalsQueryResult, error: financialGoalsQueryError },
    ] = await Promise.all([
      mightFail(
        db
          .select()
          .from(incomesTable)
          .where(eq(incomesTable.planId, generationValues.planId)),
      ),
      mightFail(
        db
          .select()
          .from(expendituresTable)
          .where(eq(expendituresTable.planId, generationValues.planId)),
      ),
      mightFail(
        db
          .select()
          .from(assetsTable)
          .where(eq(assetsTable.planId, generationValues.planId)),
      ),
      mightFail(
        db
          .select()
          .from(liabilitiesTable)
          .where(eq(liabilitiesTable.planId, generationValues.planId)),
      ),
      mightFail(
        db
          .select()
          .from(financialGoalsTable)
          .where(eq(financialGoalsTable.planId, generationValues.planId)),
      ),
    ]);
    if (incomesQueryError)
      throw new HTTPException(500, {
        message: "error querying incomes",
        cause: incomesQueryError,
      });
    if (expendituresQueryError)
      throw new HTTPException(500, {
        message: "error querying expenditures",
        cause: expendituresQueryError,
      });
    if (assetsQueryError)
      throw new HTTPException(500, {
        message: "error querying assets",
        cause: assetsQueryError,
      });
    if (liabilitiesQueryError)
      throw new HTTPException(500, {
        message: "error querying liabilities",
        cause: liabilitiesQueryError,
      });
    if (financialGoalsQueryError)
      throw new HTTPException(500, {
        message: "error querying financial goals",
        cause: financialGoalsQueryError,
      });

    const totalIncome =
      Math.round(
        incomesQueryResult.reduce(
          (sum, income) =>
            sum + ((income.amount / 100) * (100 - income.tax / 100)) / 100,
          0,
        ) * 100,
      ) / 100;
    const totalExpenditure =
      Math.round(
        expendituresQueryResult.reduce(
          (sum, expenditure) => sum + expenditure.amount / 100,
          0,
        ) * 100,
      ) / 100;
    const cashflow = totalIncome - totalExpenditure;
    const totalAssets =
      Math.round(
        assetsQueryResult.reduce((sum, asset) => sum + asset.value / 100, 0) *
          100,
      ) / 100;
    const totalLiabilities =
      Math.round(
        liabilitiesQueryResult.reduce(
          (sum, liability) => sum + liability.amount / 100,
          0,
        ) * 100,
      ) / 100;
    const netWorth = totalAssets - totalLiabilities;
    const incomesText = incomesQueryResult
      .map(
        (i) =>
          `${i.position}${i.company && ` at ${i.company}`}: ${plan[0]!.currency}${(i.amount / 100).toFixed(2)} with tax %${(i.tax / 100).toFixed(2)} therefore net ${(((i.amount / 100) * (100 - i.tax / 100)) / 100).toFixed(2)}`,
      )
      .join("\n");
    const expendituresText = expendituresQueryResult
      .map((e) => `${e.name}: $${(e.amount / 100).toFixed(2)}`)
      .join("\n");

    const assetsText = assetsQueryResult
      .map(
        (a) =>
          `${a.name}: $${(a.value / 100).toFixed(2)} with ROI %${(a.roi / 100).toFixed(2)}`,
      )
      .join("\n");

    const liabilitiesText = liabilitiesQueryResult
      .map(
        (l) =>
          `${l.name}: $${(l.amount / 100).toFixed(2)} with interest %${(l.interest / 100).toFixed(2)}`,
      )
      .join("\n");

    const financialGoalsText = financialGoalsQueryResult
      .map(
        (e) =>
          `${e.name}: $${(e.amount / 100).toFixed(2)} with target date ${e.targetDate}`,
      )
      .join("\n");

    const completion = await openai.responses.create({
      model: "gpt-5.4",
      temperature: 0.4,
      input: [
        {
          role: "system",
          content:
            "You are a certified financial planner providing clear financial advice.",
        },
        {
          role: "user",
          content: `
          Provide financial advice for the following client data

          Year of birth: ${plan[0].yearOfBirth}
          Country of residence: ${plan[0].location}
          Currency: ${plan[0].currency}
          Total income: ${totalIncome}
          Total expenditure: ${totalExpenditure}
          Cashflow: ${cashflow}
          Total assets: ${totalAssets}
          Total liabilities: ${totalLiabilities}
          Net worth: ${netWorth}

          Here is the raw data for your reference. DO NOT try to derive values from these as I already provided you with the correct values above. Only use this data to potentially reference specific items if you deem necessary to do so, such as glaring loan item that requires urgent treatment or significant income source or asset or financial goal.

          INCOME SOURCES (monthly):
          ${incomesText}

          EXPENDITURES (monthly):
          ${expendituresText}

          ASSETS:
          ${assetsText}

          LIABILITIES:
          ${liabilitiesText}

          FINANCIAL GOALS:
          ${financialGoalsText}

          Limit your advice to no more than 1500 characters
          ALWAYS take into consideration the client's age and country of residence and whether this means they are willing to take more risks or retired and comfortable or trying to raise a family
          ALWAYS start with "Based on the provided financial data, here's a comprehensive analysis of your"`,
        },
      ],
    });

    const content = completion.output_text || "error generating recommendation";
    const { error: generationInsertError, result: generationInsertResult } =
      await mightFail(
        db
          .insert(generationsTable)
          .values({ planId: plan[0]!.planId, content })
          .returning(),
      );
    if (generationInsertError) {
      console.log("Error while creating generation");
      throw new HTTPException(500, {
        message: "Error while creating generation",
        cause: generationInsertError,
      });
    }
    return c.json({ generation: generationInsertResult[0] });
  },
);
