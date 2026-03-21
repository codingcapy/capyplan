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

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const aiRouter = new Hono().post(
  "/generate",
  zValidator("json", z.object({ planId: z.number() })),
  async (c) => {
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
    if (planError)
      throw new HTTPException(500, { message: "Plan lookup failed" });
    if (!plan || plan.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    // const [incomes, expenditures, assets, liabilities, financialGoals] =
    //   await Promise.all([
    //     db
    //       .select()
    //       .from(incomesTable)
    //       .where(eq(incomesTable.planId, generationValues.planId)),
    //     db
    //       .select()
    //       .from(expendituresTable)
    //       .where(eq(expendituresTable.planId, generationValues.planId)),
    //     db
    //       .select()
    //       .from(assetsTable)
    //       .where(eq(assetsTable.planId, generationValues.planId)),
    //     db
    //       .select()
    //       .from(liabilitiesTable)
    //       .where(eq(liabilitiesTable.planId, generationValues.planId)),
    //     db
    //       .select()
    //       .from(financialGoalsTable)
    //       .where(eq(financialGoalsTable.planId, generationValues.planId)),
    //   ]);
    const { result: incomesQueryResult, error: incomesQueryError } =
      await mightFail(
        db
          .select()
          .from(incomesTable)
          .where(eq(incomesTable.planId, generationValues.planId)),
      );
    if (incomesQueryError)
      throw new HTTPException(500, {
        message: "error querying incomes",
        cause: incomesQueryError,
      });
    const { result: expendituresQueryResult, error: expendituresQueryError } =
      await mightFail(
        db
          .select()
          .from(expendituresTable)
          .where(eq(expendituresTable.planId, generationValues.planId)),
      );
    if (expendituresQueryError)
      throw new HTTPException(500, {
        message: "error querying expenditures",
        cause: expendituresQueryError,
      });
    const { result: assetsQueryResult, error: assetsQueryError } =
      await mightFail(
        db
          .select()
          .from(assetsTable)
          .where(eq(assetsTable.planId, generationValues.planId)),
      );
    if (assetsQueryError)
      throw new HTTPException(500, {
        message: "error querying assets",
        cause: assetsQueryError,
      });
    const { result: liabilitiesQueryResult, error: liabilitiesQueryError } =
      await mightFail(
        db
          .select()
          .from(liabilitiesTable)
          .where(eq(liabilitiesTable.planId, generationValues.planId)),
      );
    if (liabilitiesQueryError)
      throw new HTTPException(500, {
        message: "error querying liabilities",
        cause: liabilitiesQueryError,
      });
    const {
      result: financialGoalsQueryResult,
      error: financialGoalsQueryError,
    } = await mightFail(
      db
        .select()
        .from(financialGoalsTable)
        .where(eq(financialGoalsTable.planId, generationValues.planId)),
    );
    if (financialGoalsQueryError)
      throw new HTTPException(500, {
        message: "error querying financial goals",
        cause: financialGoalsQueryError,
      });
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
Here is my financial data in JSON, all monetary amounts, values, taxes, interest and roi must be divided by 100 for their true value, and tax and interest and roi are percentages:

${JSON.stringify(
  {
    incomes: incomesQueryResult,
    expenditures: expendituresQueryResult,
    assets: assetsQueryResult,
    liabilities: liabilitiesQueryResult,
    goals: financialGoalsQueryResult,
  },
  null,
  2,
)}

Calculate cashflow and net worth at least twice and ensure your calculations are accurate. No need to mention that you did this.

Instructions:
1. Summarize financial health
2. Identify risks
3. Analyze cash flow
4. Provide debt strategy
5. Suggest investment approach
6. Give prioritized action plan

Only use provided data.
Don't bother regurgitating or listing out all the details in the JSON again, only mention items when needed to explain something.
Only output titles, paragraphs and maybe some lists.
ALWAYS start with "Based on the provided financial data, here's a comprehensive analysis of your"
`,
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
