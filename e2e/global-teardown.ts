import { cleanupTestData } from "./db-cleanup";

export default async function globalTeardown() {
  // Set E2E_KEEP_DATA=1 to inspect the data a failed run left behind.
  // The next run's global setup will still clear it.
  if (process.env.E2E_KEEP_DATA) return;
  await cleanupTestData();
}
