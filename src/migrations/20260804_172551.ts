import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_questions_origin" AS ENUM('uploaded', 'manual', 'ai');
  ALTER TABLE "questions" ALTER COLUMN "exam_id" DROP NOT NULL;
  ALTER TABLE "questions" ALTER COLUMN "question_number" DROP NOT NULL;
  ALTER TABLE "questions" ADD COLUMN "grade_id" integer;
  ALTER TABLE "questions" ADD COLUMN "subject_id" integer;
  ALTER TABLE "questions" ADD COLUMN "origin" "enum_questions_origin" DEFAULT 'uploaded';
  ALTER TABLE "questions" ADD CONSTRAINT "questions_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "questions_grade_idx" ON "questions" USING btree ("grade_id");
  CREATE INDEX "questions_subject_idx" ON "questions" USING btree ("subject_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" DROP CONSTRAINT "questions_grade_id_grades_id_fk";
  
  ALTER TABLE "questions" DROP CONSTRAINT "questions_subject_id_subjects_id_fk";
  
  DROP INDEX "questions_grade_idx";
  DROP INDEX "questions_subject_idx";
  ALTER TABLE "questions" ALTER COLUMN "exam_id" SET NOT NULL;
  ALTER TABLE "questions" ALTER COLUMN "question_number" SET NOT NULL;
  ALTER TABLE "questions" DROP COLUMN "grade_id";
  ALTER TABLE "questions" DROP COLUMN "subject_id";
  ALTER TABLE "questions" DROP COLUMN "origin";
  DROP TYPE "public"."enum_questions_origin";`)
}
