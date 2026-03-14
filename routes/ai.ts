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
    const incomesText = incomesQueryResult
      .map(
        (i) =>
          `${i.position}${i.company ? ` at ${i.company}` : ""}: $${i.amount}`,
      )
      .join("\n");
    const expendituresText = expendituresQueryResult
      .map((e) => `${e.name}: $${e.amount}`)
      .join("\n");
    const assetsText = assetsQueryResult
      .map((a) => `${a.name}: value $${a.value}, annual ROI ${a.roi}%`)
      .join("\n");
    const liabilitiesText = liabilitiesQueryResult
      .map(
        (l) => `${l.name}: balance $${l.amount}, interest rate ${l.interest}%`,
      )
      .join("\n");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a certified financial planner providing clear financial advice.",
        },
        {
          role: "user",
          content: `
I am providing my monthly financial data.

INCOME SOURCES:
${incomesText}

MONTHLY EXPENSES:
${expendituresText}

ASSETS:
${assetsText}

LIABILITIES:
${liabilitiesText}

Please analyze my financial situation and provide professional financial planning advice.

Consider the following areas:

- cash flow sustainability
- expense optimization
- asset allocation
- investment performance
- debt management
- financial risks
- opportunities to improve long-term financial health

Reference specific income sources, expenses, assets, or liabilities when giving advice.
`,
        },
      ],
    });

    const content =
      (completion.choices[0] && completion.choices[0].message.content) ||
      "error generating recommendation";

    return c.json({ recommendation: content });
  },
);
