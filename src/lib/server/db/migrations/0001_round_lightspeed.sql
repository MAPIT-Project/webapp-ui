ALTER TABLE "client" ADD COLUMN "auth_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_auth_id_unique" UNIQUE("auth_id");