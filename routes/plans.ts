import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import jwt from "jsonwebtoken";
import { mightFail, mightFailSync } from "might-fail";
import { db } from "../db";
import { plans as plansTable } from "../schemas/plans";
import { and, eq } from "drizzle-orm";
import { users as usersTable } from "../schemas/users";
import { createUpdateSchema } from "drizzle-zod";

const createPlanSchema = z.object({
  title: z.string(),
});

const deletePlanSchema = z.object({
  planId: z.number(),
});

const updateTitleSchema = z.object({
  planId: z.number(),
  title: z.string(),
});

const updateCurrencySchema = z.object({
  planId: z.number(),
  currency: z.string(),
});

const updateYearOfBirthSchema = z.object({
  planId: z.number(),
  yearOfBirth: z.string(),
});

const updateLocationSchema = z.object({
  planId: z.number(),
  location: z.string(),
});

export function requireUser(c: Context) {
  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  try {
    return jwt.verify(authHeader.split(" ")[1]!, process.env.JWT_SECRET!) as {
      id: string;
    };
  } catch {
    throw new HTTPException(401, { message: "Invalid token" });
  }
}

export function assertIsParsableInt(id: string): number {
  const { result: parsedId, error: parseIdError } = mightFailSync(() =>
    z.coerce.number().int().parse(id),
  );
  if (parseIdError) {
    throw new HTTPException(400, {
      message: `Id ${id} cannot be parsed into a number.`,
      cause: parseIdError,
    });
  }
  return parsedId;
}

export const plansRouter = new Hono()
  .post("/", zValidator("json", createPlanSchema), async (c) => {
    const decodedUser = requireUser(c);
    const insertValues = c.req.valid("json");
    if (insertValues.title && insertValues.title.length > 400)
      throw new HTTPException(400, {
        message: "Plan title length exceeds max char limit",
        cause: Error(),
      });
    const { error: planInsertError, result: planInsertResult } =
      await mightFail(
        db
          .insert(plansTable)
          .values({ ...insertValues, userId: decodedUser.id })
          .returning(),
      );
    if (planInsertError || !planInsertResult[0]) {
      console.log("Error while creating plan");
      console.log(planInsertError);
      throw new HTTPException(500, {
        message: "Error while creating plan",
        cause: planInsertError,
      });
    }
    const { error: updateError, result: updateResult } = await mightFail(
      db
        .update(usersTable)
        .set({ currentPlan: planInsertResult[0].planId })
        .where(eq(usersTable.userId, decodedUser.id))
        .returning(),
    );
    if (updateError) {
      throw new HTTPException(500, {
        message: "Error while updating current plan",
        cause: updateError,
      });
    }
    return c.json({ user: updateResult[0] }, 200);
  })
  .get("/", async (c) => {
    const decodedUser = requireUser(c);
    const { error: plansQueryError, result: plansQueryResult } =
      await mightFail(
        db
          .select()
          .from(plansTable)
          .where(eq(plansTable.userId, decodedUser.id)),
      );
    if (plansQueryError)
      throw new HTTPException(500, {
        message: "Error occurred when fetching plans",
        cause: plansQueryError,
      });
    return c.json({ plans: plansQueryResult });
  })
  .get("/:planId", async (c) => {
    const decodedUser = requireUser(c);
    const { planId: planIdString } = c.req.param();
    const planId = assertIsParsableInt(planIdString);
    const { error: planQueryError, result: planQueryResult } = await mightFail(
      db
        .select()
        .from(plansTable)
        .where(
          and(
            eq(plansTable.userId, decodedUser.id),
            eq(plansTable.planId, planId),
          ),
        ),
    );
    if (planQueryError)
      throw new HTTPException(500, {
        message: "Error occurred when fetching plan",
        cause: planQueryError,
      });
    return c.json({ plan: planQueryResult[0] });
  })
  .post("/delete", zValidator("json", deletePlanSchema), async (c) => {
    const decodedUser = requireUser(c);
    const deleteValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(plansTable)
          .where(
            and(
              eq(plansTable.planId, deleteValues.planId),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const { error: planDeleteError, result: planDeleteResult } =
      await mightFail(
        db
          .delete(plansTable)
          .where(eq(plansTable.planId, deleteValues.planId))
          .returning(),
      );
    if (planDeleteError) {
      console.log("Error while deleting plan");
      throw new HTTPException(500, {
        message: "Error while deleting plan",
        cause: planDeleteError,
      });
    }
    const { result: userQueryResult, error: userQueryError } = await mightFail(
      db.select().from(usersTable).where(eq(usersTable.userId, decodedUser.id)),
    );
    if (userQueryError)
      throw new HTTPException(500, { message: "user query failed" });
    if (!userQueryResult[0])
      throw new HTTPException(500, { message: "user query failed" });
    const { result: plansCheck, error: plansCheckError } = await mightFail(
      db.select().from(plansTable).where(eq(plansTable.userId, decodedUser.id)),
    );
    if (plansCheckError)
      throw new HTTPException(500, { message: "plans check failed" });
    if (plansCheck.length === 0) {
      const { error: planInsertError, result: planInsertResult } =
        await mightFail(
          db
            .insert(plansTable)
            .values({
              userId: decodedUser.id,
              title: `${userQueryResult[0].username}'s plan`,
            })
            .returning(),
        );
      if (planInsertError) {
        console.log("Error while creating plan");
        console.log(planInsertError);
        throw new HTTPException(500, {
          message: "Error while creating plan",
          cause: planInsertError,
        });
      }
      if (!planInsertResult[0])
        throw new HTTPException(500, {
          message: "Error while creating plan",
          cause: planInsertError,
        });
      const { error: updateError, result: updateResult } = await mightFail(
        db
          .update(usersTable)
          .set({ currentPlan: planInsertResult[0].planId })
          .where(eq(usersTable.userId, decodedUser.id))
          .returning(),
      );
      if (updateError) {
        throw new HTTPException(500, {
          message: "Error while updating current plan",
          cause: updateError,
        });
      }
      return c.json({ user: updateResult[0] }, 200);
    } else {
      if (!plansCheck[0])
        throw new HTTPException(500, { message: "plans check failed" });
      const { error: updateError, result: updateResult } = await mightFail(
        db
          .update(usersTable)
          .set({ currentPlan: plansCheck[0].planId })
          .where(eq(usersTable.userId, decodedUser.id))
          .returning(),
      );
      if (updateError || !updateResult[0]) {
        throw new HTTPException(500, {
          message: "Error while updating current plan",
          cause: updateError,
        });
      }
      return c.json({ user: updateResult[0] }, 200);
    }
  })
  .post(
    "/update/currency",
    zValidator("json", updateCurrencySchema),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const { result: ownershipCheck, error: ownershipCheckError } =
        await mightFail(
          db
            .select()
            .from(plansTable)
            .where(
              and(
                eq(plansTable.planId, updateValues.planId),
                eq(plansTable.userId, decodedUser.id),
              ),
            ),
        );
      if (ownershipCheckError)
        throw new HTTPException(500, { message: "Ownership check failed" });
      if (ownershipCheck.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      const { error: planUpdateError, result: planUpdateResult } =
        await mightFail(
          db
            .update(plansTable)
            .set({
              currency: updateValues.currency,
            })
            .where(eq(plansTable.planId, updateValues.planId))
            .returning(),
        );
      if (planUpdateError) {
        console.log("Error while updating currency");
        throw new HTTPException(500, {
          message: "Error while updating currency",
          cause: planUpdateError,
        });
      }
      return c.json({ plan: planUpdateResult[0] }, 200);
    },
  )
  .post(
    "/update/yearofbirth",
    zValidator("json", updateYearOfBirthSchema),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const { result: ownershipCheck, error: ownershipCheckError } =
        await mightFail(
          db
            .select()
            .from(plansTable)
            .where(
              and(
                eq(plansTable.planId, updateValues.planId),
                eq(plansTable.userId, decodedUser.id),
              ),
            ),
        );
      if (ownershipCheckError)
        throw new HTTPException(500, { message: "Ownership check failed" });
      if (ownershipCheck.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      const { error: planUpdateError, result: planUpdateResult } =
        await mightFail(
          db
            .update(plansTable)
            .set({
              yearOfBirth: updateValues.yearOfBirth,
            })
            .where(eq(plansTable.planId, updateValues.planId))
            .returning(),
        );
      if (planUpdateError) {
        console.log("Error while updating year of birth");
        throw new HTTPException(500, {
          message: "Error while updating year of birth",
          cause: planUpdateError,
        });
      }
      return c.json({ plan: planUpdateResult[0] }, 200);
    },
  )
  .post(
    "/update/location",
    zValidator("json", updateLocationSchema),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const { result: ownershipCheck, error: ownershipCheckError } =
        await mightFail(
          db
            .select()
            .from(plansTable)
            .where(
              and(
                eq(plansTable.planId, updateValues.planId),
                eq(plansTable.userId, decodedUser.id),
              ),
            ),
        );
      if (ownershipCheckError)
        throw new HTTPException(500, { message: "Ownership check failed" });
      if (ownershipCheck.length === 0)
        throw new HTTPException(401, { message: "Unauthorized" });
      const { error: planUpdateError, result: planUpdateResult } =
        await mightFail(
          db
            .update(plansTable)
            .set({
              location: updateValues.location,
            })
            .where(eq(plansTable.planId, updateValues.planId))
            .returning(),
        );
      if (planUpdateError) {
        console.log("Error while updating location");
        throw new HTTPException(500, {
          message: "Error while updating location",
          cause: planUpdateError,
        });
      }
      return c.json({ plan: planUpdateResult[0] }, 200);
    },
  )
  .post("/update", zValidator("json", updateTitleSchema), async (c) => {
    const decodedUser = requireUser(c);
    const updateValues = c.req.valid("json");
    const { result: ownershipCheck, error: ownershipCheckError } =
      await mightFail(
        db
          .select()
          .from(plansTable)
          .where(
            and(
              eq(plansTable.planId, updateValues.planId),
              eq(plansTable.userId, decodedUser.id),
            ),
          ),
      );
    if (ownershipCheckError)
      throw new HTTPException(500, { message: "Ownership check failed" });
    if (ownershipCheck.length === 0)
      throw new HTTPException(401, { message: "Unauthorized" });
    const { error: planUpdateError, result: planUpdateResult } =
      await mightFail(
        db
          .update(plansTable)
          .set({
            title: updateValues.title,
          })
          .where(eq(plansTable.planId, updateValues.planId))
          .returning(),
      );
    if (planUpdateError) {
      console.log("Error while updating plan title");
      throw new HTTPException(500, {
        message: "Error while updating plan title",
        cause: planUpdateError,
      });
    }
    return c.json({ plan: planUpdateResult[0] }, 200);
  });
