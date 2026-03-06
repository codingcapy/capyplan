import { zValidator } from "@hono/zod-validator";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { expenditures as expendituresTable } from "../schemas/expenditures";
import { assertIsParsableInt, requireUser } from "./plans";
import { mightFail } from "might-fail";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { plans as plansTable } from "../schemas/plans";
import { HTTPException } from "hono/http-exception";

export const incomesRouter = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      createInsertSchema(expendituresTable).omit({
        expenditureId: true,
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
          .from(expendituresTable)
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
      const { error: expenditureInsertError, result: expenditureInsertResult } =
        await mightFail(
          db.insert(expendituresTable).values(insertValues).returning(),
        );
      if (expenditureInsertError) {
        console.log("Error while creating expenditure");
        throw new HTTPException(500, {
          message: "Error while creating expenditure",
          cause: expenditureInsertError,
        });
      }
      return c.json({ plan: expenditureInsertResult[0] }, 200);
    },
  )
  .get("/", async (c) => {
    const { result: expendituresQueryResult, error: expendituresQueryError } =
      await mightFail(
        db
          .select()
          .from(expendituresTable)
          .where(eq(expendituresTable.planId, 5)),
      );
    if (expendituresQueryError)
      throw new HTTPException(500, {
        message: "error querying expenditures",
        cause: expendituresQueryError,
      });
    return c.json({ expenditures: expendituresQueryResult });
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
    const { result: expendituresQueryResult, error: expendituresQueryError } =
      await mightFail(
        db
          .select()
          .from(expendituresTable)
          .where(eq(expendituresTable.planId, planId)),
      );
    if (expendituresQueryError)
      throw new HTTPException(500, {
        message: "error querying expenditures",
        cause: expendituresQueryError,
      });
    return c.json({ expenditures: expendituresQueryResult });
  });
