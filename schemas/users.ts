import { pgTable, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export const users = pgTable("users", {
  userId: varchar("user_id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  profilePic: varchar("profile_pic"),
  role: varchar("role", { length: 50 }).default("member").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  preference: varchar("preference", { length: 50 }).default("light").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  currentPlan: integer("current_plan").default(0).notNull(),
});

export type User = InferSelectModel<typeof users>;
