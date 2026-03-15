import { zValidator } from "@hono/zod-validator";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { financialGoals as financialGoalsTable } from "../schemas/financialGoals";
import { requireUser } from "./plans";
import { mightFail } from "might-fail";
import { db } from "../db";
import { plans as plansTable } from "../schemas/plans";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export const financialGoalsRouter = new Hono().post(
  "/",
  zValidator(
    "json",
    createInsertSchema(financialGoalsTable).omit({
      financialGoalId: true,
      createdAt: true,
    }),
  ),
  async (c) => {
    const decodedUser = requireUser(c);
    const insertValues = c.req.valid("json");
    const { result: plan, error: planError } = await mightFail(
      db
        .select()
        .from(plansTable)
        .where(
          and(
            eq(plansTable.planId, insertValues.planId),
            eq(plansTable.userId, decodedUser.id),
          ),
        ),
    );
    if (planError)
      throw new HTTPException(500, { message: "Plan lookup failed" });
    if (!plan || plan.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const {
      error: financialGoalInsertError,
      result: financialGoalInsertResult,
    } = await mightFail(
      db.insert(financialGoalsTable).values(insertValues).returning(),
    );
    if (financialGoalInsertError) {
      console.log("Error while creating financial goal");
      throw new HTTPException(500, {
        message: "Error while creating financial goal",
        cause: financialGoalInsertError,
      });
    }
    return c.json({ financialGoal: financialGoalInsertResult[0] }, 200);
  },
);
