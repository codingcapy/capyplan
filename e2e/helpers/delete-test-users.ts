import { db } from "../../db";
import { users } from "../../schemas/users";
import { plans } from "../../schemas/plans";
import { passwordResetTokens } from "../../schemas/passwordResetTokens";
import { eq } from "drizzle-orm";

const emails = process.argv.slice(2);

for (const email of emails) {
  // Safety: never touch real accounts.
  if (!email.endsWith("@example.test")) {
    console.error(`Refusing to delete non-test email: ${email}`);
    continue;
  }
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) continue;

  // users.currentPlan points at plans, so clear it before deleting the plan
  await db
    .update(users)
    .set({ currentPlan: 0 })
    .where(eq(users.userId, user.userId));
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.userId));
  await db.delete(plans).where(eq(plans.userId, user.userId));
  await db.delete(users).where(eq(users.userId, user.userId));
}

// The pg pool keeps the process alive otherwise
process.exit(0);
