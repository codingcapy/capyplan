import { Hono } from "hono";
import { requireUser } from "./plans";
import { zValidator } from "@hono/zod-validator";
import { createInsertSchema } from "drizzle-zod";
import { incomes as incomesTable } from "../schemas/incomes";
import { mightFail } from "might-fail";
import { db } from "../db";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";

export const incomesRouter = new Hono()
  .post(
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
        await mightFail(
          db.insert(incomesTable).values(insertValues).returning(),
        );
      if (incomeInsertError) {
        console.log("Error while creating income");
        throw new HTTPException(500, {
          message: "Error while creating income",
          cause: incomeInsertError,
        });
      }
      return c.json({ user: incomeInsertResult[0] }, 200);
    },
  )
  .get("/", async (c) => {
    const { result: incomesQueryResult, error: incomesQueryError } =
      await mightFail(
        db.select().from(incomesTable).where(eq(incomesTable.planId, 5)),
      );
    return c.json({ incomes: incomesQueryResult });
  })
  .get("/:planId", async (c) => {
    const { planId: planIdString } = c.req.param();
    const decodedUser = requireUser(c);
  });
