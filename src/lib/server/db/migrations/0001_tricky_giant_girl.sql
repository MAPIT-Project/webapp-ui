ALTER TABLE "message" ADD COLUMN "ai_provider" varchar(50);--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "ai_version" varchar(20);--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "model_used" varchar(100);--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "data_source" varchar(100);--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "processing_time" numeric;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "projects_found" integer;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_question" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_model_used" varchar(100);--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_phases" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_total_processing_time_ms" integer;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_projects_retrieved" integer;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_projects_processed" integer;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_success" boolean;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "logs_average_relevance_score" numeric;