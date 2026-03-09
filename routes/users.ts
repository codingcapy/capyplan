import { Hono } from "hono";
import { db } from "../db";
import { promisify } from "util";
import { randomUUIDv7 } from "bun";
import { scrypt, randomBytes } from "crypto";
import z from "zod";
import { zValidator } from "@hono/zod-validator";
import { mightFail } from "might-fail";
import { users as usersTable } from "../schemas/users";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { requireUser } from "./plans";
import { plans as plansTable } from "../schemas/plans";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

const createUserSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});

const updateCurrentPlanSchema = z.object({
  currentPlan: z.number(),
});

export const usersRouter = new Hono()
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const insertValues = c.req.valid("json");
    const { error: emailQueryError, result: emailQueryResult } =
      await mightFail(
        db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, insertValues.email)),
      );
    if (emailQueryError) {
      throw new HTTPException(500, {
        message: "Error while fetching user",
        cause: emailQueryError,
      });
    }
    if (emailQueryResult.length > 0) {
      return c.json(
        { message: "An account with this email already exists" },
        409,
      );
    }
    const { error: usernameQueryError, result: usernameQueryResult } =
      await mightFail(
        db
          .select()
          .from(usersTable)
          .where(eq(usersTable.username, insertValues.username)),
      );
    if (usernameQueryError) {
      throw new HTTPException(500, {
        message: "Error while fetching user",
        cause: usernameQueryError,
      });
    }
    if (usernameQueryResult.length > 0) {
      return c.json(
        { message: "An account with this username already exists" },
        409,
      );
    }
    const encrypted = await hashPassword(insertValues.password);
    const userId = randomUUIDv7();
    const { error: userInsertError, result: userInsertResult } =
      await mightFail(
        db
          .insert(usersTable)
          .values({
            userId: userId,
            username: insertValues.username,
            email: insertValues.email,
            password: encrypted,
          })
          .returning(),
      );
    if (userInsertError) {
      console.log("Error while creating user");
      throw new HTTPException(500, {
        message: "Error while creating user",
        cause: userInsertResult,
      });
    }
    const newUser = userInsertResult[0];
    if (!newUser) {
      throw new HTTPException(500, { message: "User insert returned no rows" });
    }
    const { error: planInsertError, result: planInsertResult } =
      await mightFail(
        db
          .insert(plansTable)
          .values({
            userId: newUser.userId,
            title: `${newUser.username}'s plan`,
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
    return c.json({ user: userInsertResult[0] }, 200);
  })
  .post(
    "/update/currentplan",
    zValidator("json", updateCurrentPlanSchema),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const { error: updateError, result: updateResult } = await mightFail(
        db
          .update(usersTable)
          .set({ currentPlan: updateValues.currentPlan })
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
    },
  );
