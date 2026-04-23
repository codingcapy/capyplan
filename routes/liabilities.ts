import { zValidator } from "@hono/zod-validator";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { Hono } from "hono";
import { liabilities as liabilitiesTable } from "../schemas/liabilities";
import { assertIsParsableInt, requireUser } from "./plans";
import { mightFail } from "might-fail";
import { db } from "../db";
import { plans as plansTable } from "../schemas/plans";
import { and, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import z from "zod";

const deleteLiabilitySchema = z.object({
  liabilityId: z.number(),
});

export const liabilitiesRouter = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      createInsertSchema(liabilitiesTable).omit({
        liabilityId: true,
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
      if (!plan || plan.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      const { result: liabilityCountResult, error: liabilityCountError } =
        await mightFail(
          db
            .select({ count: count() })
            .from(liabilitiesTable)
            .where(eq(liabilitiesTable.planId, insertValues.planId)),
        );
      if (liabilityCountError)
        throw new HTTPException(500, {
          message: "Liability count lookup failed",
        });
      if ((liabilityCountResult[0]?.count ?? 0) >= 20)
        throw new HTTPException(400, {
          message: "Liability limit of 20 reached for this plan",
        });
      const { error: liabilityInsertError, result: liabilityInsertResult } =
        await mightFail(
          db.insert(liabilitiesTable).values(insertValues).returning(),
        );
      if (liabilityInsertError) {
        console.log("Error while creating liability");
        throw new HTTPException(500, {
          message: "Error while creating liability",
          cause: liabilityInsertError,
        });
      }
      return c.json({ liability: liabilityInsertResult[0] }, 200);
    },
  )
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
    const { result: liabilitiesQueryResult, error: liabilitiesQueryError } =
      await mightFail(
        db
          .select()
          .from(liabilitiesTable)
          .where(eq(liabilitiesTable.planId, planId)),
      );
    if (liabilitiesQueryError)
      throw new HTTPException(500, {
        message: "error querying liabilities",
        cause: liabilitiesQueryError,
      });
    return c.json({ liabilities: liabilitiesQueryResult });
  })
  .post("/delete", zValidator("json", deleteLiabilitySchema), async (c) => {
    const decodedUser = requireUser(c);
    const deleteValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(liabilitiesTable)
          .innerJoin(plansTable, eq(liabilitiesTable.planId, plansTable.planId))
          .where(
            and(
              eq(liabilitiesTable.liabilityId, deleteValues.liabilityId),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const { error: liabilityDeleteError, result: liabilityDeleteResult } =
      await mightFail(
        db
          .delete(liabilitiesTable)
          .where(eq(liabilitiesTable.liabilityId, deleteValues.liabilityId))
          .returning(),
      );
    if (liabilityDeleteError) {
      console.log("Error while deleting liability");
      throw new HTTPException(500, {
        message: "Error while deleting liability",
        cause: liabilityDeleteError,
      });
    }
    return c.json({ liability: liabilityDeleteResult[0] }, 200);
  })
  .post(
    "/update",
    zValidator(
      "json",
      createUpdateSchema(liabilitiesTable).omit({ liabilityId: true }).extend({
        liabilityId: z.number(),
      }),
    ),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const { result: ownershipCheck, error: ownershipCheckError } =
        await mightFail(
          db
            .select()
            .from(liabilitiesTable)
            .innerJoin(
              plansTable,
              eq(liabilitiesTable.planId, plansTable.planId),
            )
            .where(
              and(
                eq(liabilitiesTable.liabilityId, updateValues.liabilityId),
                eq(plansTable.userId, decodedUser.id),
              ),
            ),
        );
      if (ownershipCheckError)
        throw new HTTPException(500, { message: "Ownership check failed" });
      if (ownershipCheck.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      const { error: liabilityUpdateError, result: liabilityUpdateResult } =
        await mightFail(
          db
            .update(liabilitiesTable)
            .set({
              name: updateValues.name,
              amount: updateValues.amount,
              interest: updateValues.interest,
            })
            .where(eq(liabilitiesTable.liabilityId, updateValues.liabilityId))
            .returning(),
        );
      if (liabilityUpdateError) {
        console.log("Error while updating liability");
        throw new HTTPException(500, {
          message: "Error while updating liability",
          cause: liabilityUpdateError,
        });
      }
      return c.json({ liability: liabilityUpdateResult[0] }, 200);
    },
  );
