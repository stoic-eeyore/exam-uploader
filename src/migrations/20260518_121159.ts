import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "gemini_mappings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"drive_url" varchar NOT NULL,
  	"drive_last_updated" timestamp(3) with time zone,
  	"gemini_file_name" varchar NOT NULL,
  	"gemini_file_uri" varchar NOT NULL,
  	"gemini_expires_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "subjects" ALTER COLUMN "code" SET NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gemini_mappings_id" integer;
  CREATE UNIQUE INDEX "gemini_mappings_drive_url_idx" ON "gemini_mappings" USING btree ("drive_url");
  CREATE INDEX "gemini_mappings_updated_at_idx" ON "gemini_mappings" USING btree ("updated_at");
  CREATE INDEX "gemini_mappings_created_at_idx" ON "gemini_mappings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gemini_mappings_fk" FOREIGN KEY ("gemini_mappings_id") REFERENCES "public"."gemini_mappings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "grades_name_idx" ON "grades" USING btree ("name");
  CREATE UNIQUE INDEX "grades_code_idx" ON "grades" USING btree ("code");
  CREATE UNIQUE INDEX "subjects_name_idx" ON "subjects" USING btree ("name");
  CREATE UNIQUE INDEX "subjects_code_idx" ON "subjects" USING btree ("code");
  CREATE INDEX "payload_locked_documents_rels_gemini_mappings_id_idx" ON "payload_locked_documents_rels" USING btree ("gemini_mappings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "gemini_mappings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "gemini_mappings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gemini_mappings_fk";
  
  DROP INDEX "grades_name_idx";
  DROP INDEX "grades_code_idx";
  DROP INDEX "subjects_name_idx";
  DROP INDEX "subjects_code_idx";
  DROP INDEX "payload_locked_documents_rels_gemini_mappings_id_idx";
  ALTER TABLE "subjects" ALTER COLUMN "code" DROP NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "gemini_mappings_id";`)
}
