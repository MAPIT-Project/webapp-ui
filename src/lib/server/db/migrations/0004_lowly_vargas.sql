ALTER TABLE "conversation" ADD COLUMN "collaboration_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_collaboration_id_collaboration_id_fk" FOREIGN KEY ("collaboration_id") REFERENCES "public"."collaboration"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
