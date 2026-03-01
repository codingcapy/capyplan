import { Hono } from "hono";
import { requireUser } from "./plans";
import { zValidator } from "@hono/zod-validator";
import { createInsertSchema } from "drizzle-zod";
import { incomes as incomesTable } from "../schemas/incomes";
import { mightFail } from "might-fail";
import { db } from "../db";
import { HTTPException } from "hono/http-exception";

export const incomesRouter = new Hono().post(
  "/",
  zValidator(
    "json",
    createInsertSchema(incomesTable).omit({
      incomeId: true,
      status: true,
      createdAt: true,
    }),
  ),
  async (c) => {
    const decodedUser = requireUser(c);
    const insertValues = c.req.valid("json");
    const { error: incomeInsertError, result: incomeInsertResult } =
      await mightFail(db.insert(incomesTable).values(insertValues).returning());
    if (incomeInsertError) {
      console.log("Error while creating income");
      throw new HTTPException(500, {
        message: "Error while creating income",
        cause: incomeInsertError,
      });
    }
    return c.json({ user: incomeInsertResult[0] }, 200);
  },
);
