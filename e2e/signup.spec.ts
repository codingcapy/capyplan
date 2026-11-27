import type { Page } from "@playwright/test";
import { test, expect, uniqueUser, type TestUser } from "./fixtures";

async function fillAndSubmit(page: Page, u: TestUser) {
  await page.getByPlaceholder("username").fill(u.username);
  await page.getByPlaceholder("email").fill(u.email);
  await page.getByPlaceholder("password").fill(u.password);
  await page.getByRole("button", { name: "SIGN UP" }).click();
}

test.describe("signup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("creates an account and lands on the dashboard", async ({ page }) => {
    const user = uniqueUser();
    await fillAndSubmit(page, user);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(user.username, { exact: true })).toBeVisible();
    // The plan title shows in both the left nav and the dashboard header.
    await expect(
      page.getByText(`${user.username}'s plan`, { exact: true }).first(),
    ).toBeVisible();
  });

  test("rejects a duplicate email", async ({ page, registeredUser }) => {
    await fillAndSubmit(page, {
      ...uniqueUser(),
      email: registeredUser.email,
    });

    await expect(
      page.getByText("An account with this email already exists"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("rejects a duplicate username", async ({ page, registeredUser }) => {
    await fillAndSubmit(page, {
      ...uniqueUser(),
      username: registeredUser.username,
    });

    await expect(
      page.getByText("An account with this username already exists"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("rejects a password shorter than 8 characters", async ({ page }) => {
    await fillAndSubmit(page, { ...uniqueUser(), password: "short" });

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("rejects a username longer than 32 characters", async ({ page }) => {
    await fillAndSubmit(page, { ...uniqueUser(), username: "a".repeat(33) });

    await expect(
      page.getByText("Username too long! Max 32 characters"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });
});
