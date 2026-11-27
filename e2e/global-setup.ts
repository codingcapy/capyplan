import { cleanupTestData } from "./db-cleanup";

// Sweeps leftovers from a previous run that crashed or was killed.
export default async function globalSetup() {
  await cleanupTestData();
}
