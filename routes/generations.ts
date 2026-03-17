import { Hono } from "hono";
import { mightFail } from "might-fail";
import { db } from "../db";
import { generations as generationsTable } from "../schemas/generations";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { assertIsParsableInt, requireUser } from "./plans";
import { plans as plansTable } from "../schemas/plans";

export const generationsRouter = new Hono()
  .get("/", async (c) => {
    const { result: generationsQueryResult, error: generationsQueryError } =
      await mightFail(
        db
          .select()
          .from(generationsTable)
          .where(eq(generationsTable.planId, 5)),
      );
    if (generationsQueryError)
      throw new HTTPException(500, {
        message: "error querying generations",
        cause: generationsQueryError,
      });
    return c.json({ generations: generationsQueryResult });
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
    const { result: generationsQueryResult, error: generationsQueryError } =
      await mightFail(
        db
          .select()
          .from(generationsTable)
          .where(eq(generationsTable.planId, planId)),
      );
    if (generationsQueryError)
      throw new HTTPException(500, {
        message: "error querying generations",
        cause: generationsQueryError,
      });
    return c.json({ generations: generationsQueryResult });
  });
