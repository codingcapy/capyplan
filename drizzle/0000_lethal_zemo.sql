CREATE TABLE "assets" (
	"asset_id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"value" bigint DEFAULT 0 NOT NULL,
	"roi" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenditures" (
	"expenditure_id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_goals" (
	"financial_goal_id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"target_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"generation_id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"content" varchar DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"income_id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"company" varchar(255) DEFAULT '' NOT NULL,
	"position" varchar(255) DEFAULT '' NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"tax" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
	"liability_id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"interest" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"password_reset_token_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"plan_id" serial PRIMARY KEY NOT NULL,
	"user" varchar NOT NULL,
	"title" varchar(80) NOT NULL,
	"icon" varchar,
	"currency" varchar(10) DEFAULT '$' NOT NULL,
	"location" varchar(80) DEFAULT 'Canada' NOT NULL,
	"year_of_birth" varchar(10) DEFAULT '1990' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"refresh_token_id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"family_id" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"username" varchar(32) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" varchar(255) NOT NULL,
	"profile_pic" varchar,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"preference" varchar(50) DEFAULT 'light' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"current_plan" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_plan_id_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_plan_id_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_goals" ADD CONSTRAINT "financial_goals_plan_id_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_plan_id_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_plan_id_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_plan_id_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("plan_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_users_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_plan_id_idx" ON "assets" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "expenditures_plan_id_idx" ON "expenditures" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "financial_goals_plan_id_idx" ON "financial_goals" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "generations_plan_id_idx" ON "generations" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "incomes_plan_id_idx" ON "incomes" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "liabilities_plan_id_idx" ON "liabilities" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "plans_user_id_idx" ON "plans" USING btree ("user");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");