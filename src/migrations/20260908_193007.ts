import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_questions_cognitive_level" ADD VALUE 'mots';
  ALTER TYPE "public"."enum_questions_cognitive_level" ADD VALUE 'lots';
  ALTER TABLE "exams" ADD COLUMN "exam_review" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" ALTER COLUMN "cognitive_level" SET DATA TYPE text;
  DROP TYPE "public"."enum_questions_cognitive_level";
  CREATE TYPE "public"."enum_questions_cognitive_level" AS ENUM('recall', 'understanding', 'hots');
  ALTER TABLE "questions" ALTER COLUMN "cognitive_level" SET DATA TYPE "public"."enum_questions_cognitive_level" USING "cognitive_level"::"public"."enum_questions_cognitive_level";
  ALTER TABLE "exams" DROP COLUMN "exam_review";`)
}
