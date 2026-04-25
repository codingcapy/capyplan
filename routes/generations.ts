import { Hono } from "hono";
import { mightFail } from "might-fail";
import { db } from "../db";
import { generations as generationsTable } from "../schemas/generations";
import { and, desc, eq, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { assertIsParsableInt, requireUser } from "./plans";
import { plans as plansTable } from "../schemas/plans";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

const deleteGenerationSchema = z.object({
  generationId: z.number(),
});

const getGenerationsSchema = z.object({
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const generationsRouter = new Hono()
  .get("/:planId", zValidator("query", getGenerationsSchema), async (c) => {
    const { planId: planIdString } = c.req.param();
    const planId = assertIsParsableInt(planIdString);
    const { cursor, limit } = c.req.valid("query");
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
    const whereClause = cursor
      ? and(
          eq(generationsTable.planId, planId),
          lt(generationsTable.generationId, cursor),
        )
      : eq(generationsTable.planId, planId);
    const { result: generationsQueryResult, error: generationsQueryError } =
      await mightFail(
        db
          .select()
          .from(generationsTable)
          .where(whereClause)
          .orderBy(desc(generationsTable.generationId))
          .limit(limit + 1),
      );
    if (generationsQueryError)
      throw new HTTPException(500, {
        message: "error querying generations",
        cause: generationsQueryError,
      });
    const hasMore = generationsQueryResult.length > limit;
    const generations = hasMore
      ? generationsQueryResult.slice(0, limit)
      : generationsQueryResult;
    const lastGeneration = generations[generations.length - 1];
    const nextCursor =
      hasMore && lastGeneration ? lastGeneration.generationId : null;
    return c.json({ generations, nextCursor });
  })
  .post("/delete", zValidator("json", deleteGenerationSchema), async (c) => {
    const decodedUser = requireUser(c);
    const deleteValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(generationsTable)
          .innerJoin(plansTable, eq(generationsTable.planId, plansTable.planId))
          .where(
            and(
              eq(generationsTable.generationId, deleteValues.generationId),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const { error: generationDeleteError, result: generationDeleteResult } =
      await mightFail(
        db
          .delete(generationsTable)
          .where(eq(generationsTable.generationId, deleteValues.generationId))
          .returning(),
      );
    if (generationDeleteError) {
      console.log("Error while deleting generation");
      throw new HTTPException(500, {
        message: "Error while deleting generation",
        cause: generationDeleteError,
      });
    }
    return c.json({ generation: generationDeleteResult[0] }, 200);
  });
