import { zValidator } from "@hono/zod-validator";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { Hono } from "hono";
import { financialGoals as financialGoalsTable } from "../schemas/financialGoals";
import { assertIsParsableInt, requireUser } from "./plans";
import { mightFail } from "might-fail";
import { db } from "../db";
import { plans as plansTable } from "../schemas/plans";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import z from "zod";

const createFinancialGoalSchema = createInsertSchema(financialGoalsTable, {
  targetDate: z.coerce.date(), // accepts ISO strings and coerces to Date
}).omit({
  financialGoalId: true,
  createdAt: true,
});

const deleteFinancialGoalSchema = z.object({
  financialGoalId: z.number(),
});

export const financialGoalsRouter = new Hono()
  .post("/", zValidator("json", createFinancialGoalSchema), async (c) => {
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
  })
  .get("/", async (c) => {
    const {
      result: financialGoalsQueryResult,
      error: financialGoalsQueryError,
    } = await mightFail(
      db
        .select()
        .from(financialGoalsTable)
        .where(eq(financialGoalsTable.planId, 5)),
    );
    if (financialGoalsQueryError)
      throw new HTTPException(500, {
        message: "error querying financial goals",
        cause: financialGoalsQueryError,
      });
    return c.json({ financialGoals: financialGoalsQueryResult });
  })
  .get("/:planId", async (c) => {
    const { planId: planIdString } = c.req.param();
    const planId = assertIsParsableInt(planIdString);
    const decodedUser = requireUser(c);
    const { result: plan, error: planError } = await mightFail(
      db
        .select()
        .from(plansTable)
        .where(
          and(
            eq(plansTable.planId, planId),
            eq(plansTable.userId, decodedUser.id),
          ),
        ),
    );
    if (planError)
      throw new HTTPException(500, { message: "Plan lookup failed" });
    if (!plan) throw new HTTPException(401, { message: "Unauthorized" });
    const {
      result: financialGoalsQueryResult,
      error: financialGoalsQueryError,
    } = await mightFail(
      db
        .select()
        .from(financialGoalsTable)
        .where(eq(financialGoalsTable.planId, planId)),
    );
    if (financialGoalsQueryError)
      throw new HTTPException(500, {
        message: "error querying financial goals",
        cause: financialGoalsQueryError,
      });
    return c.json({ financialGoals: financialGoalsQueryResult });
  })
  .post("/delete", zValidator("json", deleteFinancialGoalSchema), async (c) => {
    const decodedUser = requireUser(c);
    const deleteValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(financialGoalsTable)
          .innerJoin(
            plansTable,
            eq(financialGoalsTable.planId, plansTable.planId),
          )
          .where(
            and(
              eq(
                financialGoalsTable.financialGoalId,
                deleteValues.financialGoalId,
              ),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const {
      error: financialGoalDeleteError,
      result: financialGoalDeleteResult,
    } = await mightFail(
      db
        .delete(financialGoalsTable)
        .where(
          eq(financialGoalsTable.financialGoalId, deleteValues.financialGoalId),
        )
        .returning(),
    );
    if (financialGoalDeleteError) {
      console.log("Error while deleting financial goal");
      throw new HTTPException(500, {
        message: "Error while deleting financial goal",
        cause: financialGoalDeleteError,
      });
    }
    return c.json({ financialGoal: financialGoalDeleteResult[0] }, 200);
  })
  .post(
    "/update",
    zValidator(
      "json",
      createUpdateSchema(financialGoalsTable)
        .omit({ financialGoalId: true })
        .extend({
          financialGoalId: z.number(),
        }),
    ),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const { result: ownershipCheck, error: ownershipCheckError } =
        await mightFail(
          db
            .select()
            .from(financialGoalsTable)
            .innerJoin(
              plansTable,
              eq(financialGoalsTable.planId, plansTable.planId),
            )
            .where(
              and(
                eq(
                  financialGoalsTable.financialGoalId,
                  updateValues.financialGoalId,
                ),
                eq(plansTable.userId, decodedUser.id),
              ),
            ),
        );
      if (ownershipCheckError)
        throw new HTTPException(500, { message: "Ownership check failed" });
      if (ownershipCheck.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      const {
        error: financialGoalUpdateError,
        result: financialGoalUpdateResult,
      } = await mightFail(
        db
          .update(financialGoalsTable)
          .set({
            name: updateValues.name,
            amount: updateValues.amount,
            targetDate: updateValues.targetDate,
          })
          .where(
            eq(
              financialGoalsTable.financialGoalId,
              updateValues.financialGoalId,
            ),
          )
          .returning(),
      );
      if (financialGoalUpdateError) {
        console.log("Error while updating financial goal");
        throw new HTTPException(500, {
          message: "Error while updating financial goal",
          cause: financialGoalUpdateError,
        });
      }
      return c.json({ financialGoal: financialGoalUpdateResult[0] }, 200);
    },
  );
