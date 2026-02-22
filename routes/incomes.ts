import { Hono } from "hono";

export const incomesRouter = new Hono().get("/", (c) => {
  return c.json({ incomes: [] }, 200);
});
