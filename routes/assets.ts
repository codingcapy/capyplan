import { zValidator } from "@hono/zod-validator";
import { createInsertSchema } from "drizzle-zod";
import { Hono } from "hono";
import { assets as assetsTable } from "../schemas/assets";
import { assertIsParsableInt, requireUser } from "./plans";
import { mightFail } from "might-fail";
import { db } from "../db";
import { plans as plansTable } from "../schemas/plans";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import z from "zod";

const deleteAssetSchema = z.object({
  assetId: z.number(),
});

export const assetsRouter = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      createInsertSchema(assetsTable).omit({
        assetId: true,
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
      const { error: assetInsertError, result: assetInsertResult } =
        await mightFail(
          db.insert(assetsTable).values(insertValues).returning(),
        );
      if (assetInsertError) {
        console.log("Error while creating asset");
        throw new HTTPException(500, {
          message: "Error while creating asset",
          cause: assetInsertError,
        });
      }
      return c.json({ asset: assetInsertResult[0] }, 200);
    },
  )
  .get("/", async (c) => {
    const { result: assetsQueryResult, error: assetsQueryError } =
      await mightFail(
        db.select().from(assetsTable).where(eq(assetsTable.planId, 5)),
      );
    if (assetsQueryError)
      throw new HTTPException(500, {
        message: "error querying assets",
        cause: assetsQueryError,
      });
    return c.json({ assets: assetsQueryResult });
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
    const { result: assetsQueryResult, error: assetsQueryError } =
      await mightFail(
        db.select().from(assetsTable).where(eq(assetsTable.planId, planId)),
      );
    if (assetsQueryError)
      throw new HTTPException(500, {
        message: "error querying assets",
        cause: assetsQueryError,
      });
    return c.json({ assets: assetsQueryResult });
  })
  .post("/delete", zValidator("json", deleteAssetSchema), async (c) => {
    const decodedUser = requireUser(c);
    const deleteValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(assetsTable)
          .innerJoin(plansTable, eq(assetsTable.planId, plansTable.planId))
          .where(
            and(
              eq(assetsTable.assetId, deleteValues.assetId),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const { error: assetDeleteError, result: assetDeleteResult } =
      await mightFail(
        db
          .delete(assetsTable)
          .where(eq(assetsTable.assetId, deleteValues.assetId))
          .returning(),
      );
    if (assetDeleteError) {
      console.log("Error while deleting asset");
      throw new HTTPException(500, {
        message: "Error while deleting asset",
        cause: assetDeleteError,
      });
    }
    return c.json({ asset: assetDeleteResult[0] }, 200);
  });
