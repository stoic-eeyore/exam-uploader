import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pending_exams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"filename" varchar NOT NULL,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"drive_url" varchar NOT NULL,
  	"ai_analysis" jsonb,
  	"processed" boolean DEFAULT false,
  	"uploaded_by_id" integer,
  	"uploaded_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pending_exams_id" integer;
  ALTER TABLE "pending_exams" ADD CONSTRAINT "pending_exams_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pending_exams_uploaded_by_idx" ON "pending_exams" USING btree ("uploaded_by_id");
  CREATE INDEX "pending_exams_updated_at_idx" ON "pending_exams" USING btree ("updated_at");
  CREATE INDEX "pending_exams_created_at_idx" ON "pending_exams" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pending_exams_fk" FOREIGN KEY ("pending_exams_id") REFERENCES "public"."pending_exams"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pending_exams_id_idx" ON "payload_locked_documents_rels" USING btree ("pending_exams_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_exams" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pending_exams" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pending_exams_fk";
  
  DROP INDEX "payload_locked_documents_rels_pending_exams_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pending_exams_id";`)
}
