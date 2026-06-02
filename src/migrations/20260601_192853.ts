import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_questions_quality_issues_severity" AS ENUM('low', 'medium', 'high');
  CREATE TYPE "public"."enum_questions_cognitive_level" AS ENUM('recall', 'understanding', 'hots');
  CREATE TABLE "questions_quality_issues" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"issue" varchar,
  	"severity" "enum_questions_quality_issues_severity"
  );
  
  ALTER TABLE "exams" ADD COLUMN "reviewed_by_a_i" boolean DEFAULT false;
  ALTER TABLE "questions" ADD COLUMN "cognitive_level" "enum_questions_cognitive_level";
  ALTER TABLE "questions" ADD COLUMN "reviewed_by_a_i" boolean DEFAULT false;
  ALTER TABLE "questions_quality_issues" ADD CONSTRAINT "questions_quality_issues_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "questions_quality_issues_order_idx" ON "questions_quality_issues" USING btree ("_order");
  CREATE INDEX "questions_quality_issues_parent_id_idx" ON "questions_quality_issues" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "questions_quality_issues" CASCADE;
  ALTER TABLE "exams" DROP COLUMN "reviewed_by_a_i";
  ALTER TABLE "questions" DROP COLUMN "cognitive_level";
  ALTER TABLE "questions" DROP COLUMN "reviewed_by_a_i";
  DROP TYPE "public"."enum_questions_quality_issues_severity";
  DROP TYPE "public"."enum_questions_cognitive_level";`)
}
