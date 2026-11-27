import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { TEST_EMAIL_DOMAIN } from "./db-cleanup";

export type TestUser = { username: string; email: string; password: string };

function randomIp() {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  return `10.${octet()}.${octet()}.${octet()}`;
}

export function uniqueUser(): TestUser {
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  return {
    username: `user_${id}`,
    email: `user_${id}@${TEST_EMAIL_DOMAIN}`,
    password: "Password123!",
  };
}

export async function createUserViaApi(
  request: APIRequestContext,
  user: TestUser,
) {
  const res = await request.post("/api/v0/users", { data: user });
  expect(res.status()).toBe(200);
}

export const test = base.extend<{ registeredUser: TestUser }>({
  // Each test gets its own fake client IP so the in-memory rate limiter
  // (keyed on x-forwarded-for) never trips across tests.
  extraHTTPHeaders: async ({}, use) => {
    await use({ "x-forwarded-for": randomIp() });
  },
  // A user that already exists in the DB, created through the API.
  registeredUser: async ({ request }, use) => {
    const user = uniqueUser();
    await createUserViaApi(request, user);
    await use(user);
  },
});

export { expect };
