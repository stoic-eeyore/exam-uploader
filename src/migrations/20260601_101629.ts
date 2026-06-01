import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_exams_processing_status" AS ENUM('uploaded', 'extracting', 'review', 'completed', 'failed');
  CREATE TYPE "public"."enum_questions_question_type" AS ENUM('mcq', 'essay');
  CREATE TYPE "public"."enum_questions_suggested_question_type" AS ENUM('mcq', 'essay');
  CREATE TYPE "public"."enum_questions_status" AS ENUM('draft', 'verified');
  CREATE TABLE "questions_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "questions_suggested_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "questions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"exam_id" integer NOT NULL,
  	"question_number" numeric NOT NULL,
  	"question_type" "enum_questions_question_type",
  	"question_text" varchar,
  	"answer" varchar,
  	"explanation" varchar,
  	"extraction_confidence" numeric,
  	"ai_raw_response" varchar,
  	"suggested_question_text" varchar,
  	"suggested_question_type" "enum_questions_suggested_question_type",
  	"suggested_instructions" varchar,
  	"edited_by_human" boolean DEFAULT false,
  	"status" "enum_questions_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "exams" ADD COLUMN "drive_file_id" varchar DEFAULT '';
  ALTER TABLE "exams" ADD COLUMN "processing_status" "enum_exams_processing_status" DEFAULT 'uploaded';
  ALTER TABLE "exams" ADD COLUMN "processing_error" varchar;
  ALTER TABLE "pending_exams" ADD COLUMN "file_hash" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "questions_id" integer;
  ALTER TABLE "questions_options" ADD CONSTRAINT "questions_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions_suggested_options" ADD CONSTRAINT "questions_suggested_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "questions_options_order_idx" ON "questions_options" USING btree ("_order");
  CREATE INDEX "questions_options_parent_id_idx" ON "questions_options" USING btree ("_parent_id");
  CREATE INDEX "questions_suggested_options_order_idx" ON "questions_suggested_options" USING btree ("_order");
  CREATE INDEX "questions_suggested_options_parent_id_idx" ON "questions_suggested_options" USING btree ("_parent_id");
  CREATE INDEX "questions_exam_idx" ON "questions" USING btree ("exam_id");
  CREATE INDEX "questions_updated_at_idx" ON "questions" USING btree ("updated_at");
  CREATE INDEX "questions_created_at_idx" ON "questions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_questions_fk" FOREIGN KEY ("questions_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_questions_id_idx" ON "payload_locked_documents_rels" USING btree ("questions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "questions_suggested_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "questions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "questions_options" CASCADE;
  DROP TABLE "questions_suggested_options" CASCADE;
  DROP TABLE "questions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_questions_fk";
  
  DROP INDEX "payload_locked_documents_rels_questions_id_idx";
  ALTER TABLE "exams" DROP COLUMN "drive_file_id";
  ALTER TABLE "exams" DROP COLUMN "processing_status";
  ALTER TABLE "exams" DROP COLUMN "processing_error";
  ALTER TABLE "pending_exams" DROP COLUMN "file_hash";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "questions_id";
  DROP TYPE "public"."enum_exams_processing_status";
  DROP TYPE "public"."enum_questions_question_type";
  DROP TYPE "public"."enum_questions_suggested_question_type";
  DROP TYPE "public"."enum_questions_status";`)
}
