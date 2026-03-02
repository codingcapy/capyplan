import { Hono } from "hono";
import { assertIsParsableInt, requireUser } from "./plans";
import { zValidator } from "@hono/zod-validator";
import { createInsertSchema } from "drizzle-zod";
import { incomes as incomesTable } from "../schemas/incomes";
import { mightFail } from "might-fail";
import { db } from "../db";
import { HTTPException } from "hono/http-exception";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { plans as plansTable } from "../schemas/plans";

const deleteIncomeSchema = z.object({
  incomeId: z.number(),
});

export const incomesRouter = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      createInsertSchema(incomesTable).omit({
        incomeId: true,
        status: true,
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
      if (!plan) throw new HTTPException(401, { message: "Unauthorized" });
      const { error: incomeInsertError, result: incomeInsertResult } =
        await mightFail(
          db.insert(incomesTable).values(insertValues).returning(),
        );
      if (incomeInsertError) {
        console.log("Error while creating income");
        throw new HTTPException(500, {
          message: "Error while creating income",
          cause: incomeInsertError,
        });
      }
      return c.json({ user: incomeInsertResult[0] }, 200);
    },
  )
  .get("/", async (c) => {
    const { result: incomesQueryResult, error: incomesQueryError } =
      await mightFail(
        db.select().from(incomesTable).where(eq(incomesTable.planId, 5)),
      );
    if (incomesQueryError)
      throw new HTTPException(500, {
        message: "error querying incomes",
        cause: incomesQueryError,
      });
    return c.json({ incomes: incomesQueryResult });
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
    const { result: incomesQueryResult, error: incomesQueryError } =
      await mightFail(
        db.select().from(incomesTable).where(eq(incomesTable.planId, planId)),
      );
    if (incomesQueryError)
      throw new HTTPException(500, {
        message: "error querying incomes",
        cause: incomesQueryError,
      });
    return c.json({ incomes: incomesQueryResult });
  })
  .post("/delete", zValidator("json", deleteIncomeSchema), async (c) => {
    const decodedUser = requireUser(c);
    const deleteValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(incomesTable)
          .innerJoin(plansTable, eq(incomesTable.planId, plansTable.planId))
          .where(
            and(
              eq(incomesTable.incomeId, deleteValues.incomeId),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const { error: incomeDeleteError, result: incomeDeleteResult } =
      await mightFail(
        db
          .delete(incomesTable)
          .where(eq(incomesTable.incomeId, deleteValues.incomeId))
          .returning(),
      );
    if (incomeDeleteError) {
      console.log("Error while deleting income");
      throw new HTTPException(500, {
        message: "Error while deleting income",
        cause: incomeDeleteError,
      });
    }
    return c.json({ user: incomeDeleteResult[0] }, 200);
  });
