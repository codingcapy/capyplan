import { zValidator } from "@hono/zod-validator";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { Hono } from "hono";
import { expenditures as expendituresTable } from "../schemas/expenditures";
import { assertIsParsableInt, requireUser } from "./plans";
import { mightFail } from "might-fail";
import { db } from "../db";
import { and, count, eq, getTableColumns } from "drizzle-orm";
import { plans as plansTable } from "../schemas/plans";
import { HTTPException } from "hono/http-exception";
import z from "zod";

const deleteExpenditureSchema = z.object({
  expenditureId: z.number(),
});

export const expendituresRouter = new Hono()
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
      const { result: planCheck, error: planCheckError } = await mightFail(
        db
          .select({ expenditureCount: count(expendituresTable.expenditureId) })
          .from(plansTable)
          .leftJoin(
            expendituresTable,
            eq(expendituresTable.planId, plansTable.planId),
          )
          .where(
            and(
              eq(plansTable.planId, insertValues.planId),
              eq(plansTable.userId, decodedUser.id),
            ),
          )
          .groupBy(plansTable.planId),
      );
      if (planCheckError)
        throw new HTTPException(500, { message: "Plan lookup failed" });
      if (planCheck.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      if ((planCheck[0]?.expenditureCount ?? 0) >= 20)
        throw new HTTPException(400, {
          message: "Expenditure limit of 20 reached for this plan",
        });
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
      return c.json({ expenditure: expenditureInsertResult[0] }, 200);
    },
  )
  .get("/:planId", async (c) => {
    const { planId: planIdString } = c.req.param();
    const planId = assertIsParsableInt(planIdString);
    const decodedUser = requireUser(c);
    const { result: expendituresQueryResult, error: expendituresQueryError } =
      await mightFail(
        db
          .select(getTableColumns(expendituresTable))
          .from(expendituresTable)
          .innerJoin(
            plansTable,
            and(
              eq(expendituresTable.planId, plansTable.planId),
              eq(plansTable.userId, decodedUser.id),
            ),
          )
          .where(eq(expendituresTable.planId, planId)),
      );
    if (expendituresQueryError)
      throw new HTTPException(500, {
        message: "error querying expenditures",
        cause: expendituresQueryError,
      });
    return c.json({ expenditures: expendituresQueryResult });
  })
  .post("/delete", zValidator("json", deleteExpenditureSchema), async (c) => {
    const decodedUser = requireUser(c);
    const deleteValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(expendituresTable)
          .innerJoin(
            plansTable,
            eq(expendituresTable.planId, plansTable.planId),
          )
          .where(
            and(
              eq(expendituresTable.expenditureId, deleteValues.expenditureId),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const { error: expenditureDeleteError, result: expenditureDeleteResult } =
      await mightFail(
        db
          .delete(expendituresTable)
          .where(
            eq(expendituresTable.expenditureId, deleteValues.expenditureId),
          )
          .returning(),
      );
    if (expenditureDeleteError) {
      console.log("Error while deleting expenditure");
      throw new HTTPException(500, {
        message: "Error while deleting expenditure",
        cause: expenditureDeleteError,
      });
    }
    return c.json({ expenditure: expenditureDeleteResult[0] }, 200);
  })
  .post(
    "/update",
    zValidator(
      "json",
      createUpdateSchema(expendituresTable)
        .omit({ expenditureId: true })
        .extend({
          expenditureId: z.number(),
        }),
    ),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const { result: ownershipCheck, error: ownershipCheckError } =
        await mightFail(
          db
            .select()
            .from(expendituresTable)
            .innerJoin(
              plansTable,
              eq(expendituresTable.planId, plansTable.planId),
            )
            .where(
              and(
                eq(expendituresTable.expenditureId, updateValues.expenditureId),
                eq(plansTable.userId, decodedUser.id),
              ),
            ),
        );
      if (ownershipCheckError)
        throw new HTTPException(500, { message: "Ownership check failed" });
      if (ownershipCheck.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      const { error: expenditureUpdateError, result: expenditureUpdateResult } =
        await mightFail(
          db
            .update(expendituresTable)
            .set({
              name: updateValues.name,
              amount: updateValues.amount,
            })
            .where(
              eq(expendituresTable.expenditureId, updateValues.expenditureId),
            )
            .returning(),
        );
      if (expenditureUpdateError) {
        console.log("Error while updating expenditure");
        throw new HTTPException(500, {
          message: "Error while updating expenditure",
          cause: expenditureUpdateError,
        });
      }
      return c.json({ expenditure: expenditureUpdateResult[0] }, 200);
    },
  );
