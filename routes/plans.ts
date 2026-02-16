import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import jwt from "jsonwebtoken";
import { mightFail } from "might-fail";
import { db } from "../db";
import { plans as plansTable } from "../schemas/plans";

const createPlanSchema = z.object({
  title: z.string(),
});

export function requireUser(c: Context) {
  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  try {
    return jwt.verify(authHeader.split(" ")[1]!, process.env.JWT_SECRET!) as {
      id: string;
    };
  } catch {
    throw new HTTPException(401, { message: "Invalid token" });
  }
}

export const plansRouter = new Hono().post(
  "/",
  zValidator("json", createPlanSchema),
  async (c) => {
    const decodedUser = requireUser(c);
    const insertValues = c.req.valid("json");
    if (insertValues.title && insertValues.title.length > 400)
      throw new HTTPException(400, {
        message: "Plan title length exceeds max char limit",
        cause: Error(),
      });
    const { error: planInsertError, result: planInsertResult } =
      await mightFail(
        db
          .insert(plansTable)
          .values({ ...insertValues, userId: decodedUser.id })
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
    return c.json({ plan: planInsertResult[0] }, 200);
  },
);
