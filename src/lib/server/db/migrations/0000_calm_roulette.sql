DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sender" AS ENUM('ai', 'user', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "client_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_collaboration" (
	"id" serial PRIMARY KEY NOT NULL,
	"collaboration_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "collaboration" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"topic" varchar(255),
	"name" varchar(255),
	"collaboration_id" integer,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" integer,
	"text" text NOT NULL,
	"sender" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"projectID" integer NOT NULL,
	"projectAcronym" text,
	"organisationID" text PRIMARY KEY NOT NULL,
	"vatNumber" text,
	"name" text,
	"shortName" text,
	"SME" boolean,
	"activityType" text,
	"street" text,
	"postCode" text,
	"city" text,
	"country" text,
	"nutsCode" text,
	"geolocation" text,
	"organizationURL" text,
	"contactForm" text,
	"contentUpdateDate" timestamp,
	"rcn" integer,
	"order" integer,
	"role" text,
	"ecContribution" numeric,
	"netEcContribution" numeric,
	"totalCost" numeric,
	"endOfParticipation" boolean,
	"active" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" integer PRIMARY KEY NOT NULL,
	"acronym" text,
	"status" text,
	"title" text,
	"startDate" date,
	"endDate" date,
	"totalCost" numeric,
	"ecMaxContribution" numeric,
	"legalBasis" text,
	"topics" text,
	"ecSignatureDate" date,
	"frameworkProgramme" text,
	"masterCall" text,
	"subCall" text,
	"fundingScheme" text,
	"nature" text,
	"objective" text,
	"contentUpdateDate" timestamp,
	"rcn" integer,
	"grantDoi" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_collaboration" ADD CONSTRAINT "client_collaboration_collaboration_id_collaboration_id_fk" FOREIGN KEY ("collaboration_id") REFERENCES "public"."collaboration"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_collaboration" ADD CONSTRAINT "client_collaboration_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_client_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."client"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_collaboration_id_collaboration_id_fk" FOREIGN KEY ("collaboration_id") REFERENCES "public"."collaboration"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_user_id_client_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."client"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
