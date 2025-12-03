CREATE TYPE "public"."status" AS ENUM('enriched', 'processing', 'failed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"firstName" varchar(128),
	"lastName" varchar(128),
	"title" varchar(255),
	"company" varchar(255) NOT NULL,
	"companyLogo" text,
	"avatar" text,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"email" varchar(320),
	"phone" varchar(50),
	"linkedin" text,
	"location" varchar(255),
	"techStack" text,
	"aiInsight" text,
	"mutualConnection" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;