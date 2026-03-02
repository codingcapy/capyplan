import { Hono } from "hono";
import OpenAI from "openai";
import { requireUser } from "../../../../routes/plans";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const aiRouter = new Hono().post("/generate", async (c) => {
  const decodedUser = requireUser(c);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a financial planning assistant.",
      },
      {
        role: "user",
        content: "Give 3 tips for someone earning $70,000 annually.",
      },
    ],
  });

  const content = completion.choices[0].message.content;

  return c.json({ recommendation: content });
});

export default aiRouter;
