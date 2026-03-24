import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export const additionalInformation = pgTable("additional_information", {
  additionalInformationId: serial("additional_information_id").primaryKey(),
  planId: integer("plan_id").notNull(),
  country: varchar("country").notNull().default(""),
  dateOfBirth: timestamp("date_of_birth").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdditionalInformation = InferSelectModel<
  typeof additionalInformation
>;
