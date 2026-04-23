import { Hono } from "hono";
import { db } from "../db";
import { promisify } from "util";
import { randomUUIDv7 } from "bun";
import { scrypt, randomBytes, createHash } from "crypto";
import z from "zod";
import { zValidator } from "@hono/zod-validator";
import { mightFail } from "might-fail";
import { users as usersTable } from "../schemas/users";
import { and, eq, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { requireUser } from "./plans";
import { plans as plansTable } from "../schemas/plans";
import { Resend } from "resend";
import { passwordResetTokens as passwordResetTokensTable } from "../schemas/passwordResetTokens";

const scryptAsync = promisify(scrypt);

function toSafeUser(user: typeof usersTable.$inferSelect) {
  const { password, ...safeUser } = user;
  return safeUser;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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

const confirmPasswordResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
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
    return c.json({ user: toSafeUser(newUser) }, 200);
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
      return c.json(
        { user: updateResult[0] ? toSafeUser(updateResult[0]) : null },
        200,
      );
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
      return c.json(
        { user: updateResult[0] ? toSafeUser(updateResult[0]) : null },
        200,
      );
    },
  )
  .post(
    "/passwordreset",
    zValidator("json", resetPasswordSchema),
    async (c) => {
      const resetValues = c.req.valid("json");
      const code = randomBytes(32).toString("hex");
      const hashedCode = hashResetToken(code);
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
      const user = userQueryResult[0];
      const { error: cleanupError } = await mightFail(
        db
          .delete(passwordResetTokensTable)
          .where(eq(passwordResetTokensTable.userId, user.userId)),
      );
      if (cleanupError) {
        throw new HTTPException(500, {
          message: "Error preparing password reset",
          cause: cleanupError,
        });
      }
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
      const { error: tokenInsertError } = await mightFail(
        db.insert(passwordResetTokensTable).values({
          userId: user.userId,
          tokenHash: hashedCode,
          expiresAt,
        }),
      );
      if (tokenInsertError) {
        throw new HTTPException(500, {
          message: "Error creating password reset token",
          cause: tokenInsertError,
        });
      }
      const { error: sendError } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: resetValues.email,
        subject: "CapyPlan Password Reset Request",
        html: `
  <p>A password reset request was submitted for this email address.</p>
  <p>Your one-time recovery code is:</p>
  <pre>${code}</pre>
  <p>This code expires in 30 minutes and can only be used once.</p>
  <p>Return to the password recovery page and enter this code with your new password.</p>
  <p>Best regards,</p>
  <p>The CapyPlan Team</p>
`,
      });
      if (sendError) {
        console.error("[resend] Failed:", sendError);
        await db
          .delete(passwordResetTokensTable)
          .where(eq(passwordResetTokensTable.userId, user.userId));
        return c.json({ success: false }, 500);
      }
      return c.json({ success: true });
    },
  )
  .post(
    "/passwordreset/confirm",
    zValidator("json", confirmPasswordResetSchema),
    async (c) => {
      const confirmValues = c.req.valid("json");
      const tokenHash = hashResetToken(confirmValues.token);
      const now = new Date();
      const { error: expiredTokenCleanupError } = await mightFail(
        db
          .delete(passwordResetTokensTable)
          .where(lt(passwordResetTokensTable.expiresAt, now)),
      );
      if (expiredTokenCleanupError) {
        throw new HTTPException(500, {
          message: "Error preparing password reset confirmation",
          cause: expiredTokenCleanupError,
        });
      }
      const { error: tokenQueryError, result: tokenQueryResult } =
        await mightFail(
          db
            .select()
            .from(passwordResetTokensTable)
            .where(eq(passwordResetTokensTable.tokenHash, tokenHash)),
        );
      if (tokenQueryError) {
        throw new HTTPException(500, {
          message: "Error validating reset token",
          cause: tokenQueryError,
        });
      }
      const resetToken = tokenQueryResult[0];
      if (!resetToken || resetToken.expiresAt < now) {
        throw new HTTPException(400, {
          message: "Recovery code is invalid or expired",
        });
      }
      const encryptedPassword = await hashPassword(confirmValues.password);
      const { error: passwordUpdateError, result: passwordUpdateResult } =
        await mightFail(
          db
            .update(usersTable)
            .set({ password: encryptedPassword })
            .where(eq(usersTable.userId, resetToken.userId))
            .returning(),
        );
      if (passwordUpdateError) {
        throw new HTTPException(500, {
          message: "Error updating password",
          cause: passwordUpdateError,
        });
      }
      const { error: tokenDeleteError } = await mightFail(
        db
          .delete(passwordResetTokensTable)
          .where(
            and(
              eq(passwordResetTokensTable.userId, resetToken.userId),
              eq(passwordResetTokensTable.tokenHash, tokenHash),
            ),
          ),
      );
      if (tokenDeleteError) {
        throw new HTTPException(500, {
          message: "Error finalizing password reset",
          cause: tokenDeleteError,
        });
      }
      return c.json(
        {
          success: true,
          user: passwordUpdateResult[0]
            ? toSafeUser(passwordUpdateResult[0])
            : null,
        },
        200,
      );
    },
  );
