import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { like } from "drizzle-orm";
import { users } from "../schemas/users";

// Every user created by the e2e suite uses this email domain.
export const TEST_EMAIL_DOMAIN = "e2e.test";

export async function cleanupTestData() {
  const db = drizzle(process.env.CONNECTIONSTRING!);
  try {
    const deleted = await db
      .delete(users)
      .where(like(users.email, `%@${TEST_EMAIL_DOMAIN}`))
      .returning({ id: users.userId });
    console.log(`[e2e] cleaned up ${deleted.length} test user(s)`);
  } finally {
    await db.$client.end();
  }
}
