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
import { Resend } from "resend";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

const createUserSchema = z.object({
  username: z.string().max(32),
  email: z.string().max(256),
  password: z.string().max(128),
});

const updateCurrentPlanSchema = z.object({
  currentPlan: z.number(),
});

const updatePasswordSchema = z.object({
  password: z.string().max(128),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const resend = new Resend(process.env.RESEND_API_KEY);

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
        cause: userInsertError,
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
  )
  .post(
    "/update/password",
    zValidator("json", updatePasswordSchema),
    async (c) => {
      const decodedUser = requireUser(c);
      const updateValues = c.req.valid("json");
      const encrypted = await hashPassword(updateValues.password);
      const { error: updateError, result: updateResult } = await mightFail(
        db
          .update(usersTable)
          .set({ password: encrypted })
          .where(eq(usersTable.userId, decodedUser.id))
          .returning(),
      );
      if (updateError) {
        throw new HTTPException(500, {
          message: "Error while updating password",
          cause: updateError,
        });
      }
      return c.json({ user: updateResult[0] }, 200);
    },
  )
  .post(
    "/passwordreset",
    zValidator("json", resetPasswordSchema),
    async (c) => {
      const resetValues = c.req.valid("json");
      const code = randomBytes(32).toString("hex");
      const hashedCode = await hashPassword(code);
      const { error: userQueryError, result: userQueryResult } =
        await mightFail(
          db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, resetValues.email)),
        );
      if (userQueryError) {
        throw new HTTPException(500, {
          message: "Error fetching user",
          cause: userQueryError,
        });
      }
      if (!userQueryResult[0]) return c.json({ success: true }); // silent — don't leak existence
      const originalPassword = userQueryResult[0].password;
      const { error: updateError, result: updateResult } = await mightFail(
        db
          .update(usersTable)
          .set({ password: hashedCode })
          .where(eq(usersTable.email, resetValues.email))
          .returning(),
      );
      if (updateError) {
        throw new HTTPException(500, {
          message: "Error while updating current plan",
          cause: updateError,
        });
      }
      if (updateResult.length > 0) {
        const { data, error: sendError } = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: resetValues.email,
          subject: "CapyPlan Password Reset Request",
          html: `
    <p>A password reset request was submitted for this email address.</p>
    <p>Your temporary password is:</p>
    <pre>${code}</pre>
    <p>Please login and change your password immediately in your settings menu.</p>
    <p>Best regards,</p>
    <p>The CapyPlan Team</p>
  `,
        });
        if (sendError) {
          console.error("[resend] Failed:", sendError);
          await db
            .update(usersTable)
            .set({ password: originalPassword })
            .where(eq(usersTable.email, resetValues.email));
          return c.json({ success: false }, 500);
        }
      }
      return c.json({ success: true });
    },
  );
