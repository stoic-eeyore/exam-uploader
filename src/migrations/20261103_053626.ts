import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_questions_validity_status" AS ENUM('valid', 'ambiguous', 'invalid');
  ALTER TABLE "questions" ADD COLUMN "validity_status" "enum_questions_validity_status";
  ALTER TABLE "questions" ADD COLUMN "validity_confidence" numeric;
  ALTER TABLE "questions" ADD COLUMN "answer_confidence" numeric;
  ALTER TABLE "questions" ADD COLUMN "answer_notes" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" DROP COLUMN "validity_status";
  ALTER TABLE "questions" DROP COLUMN "validity_confidence";
  ALTER TABLE "questions" DROP COLUMN "answer_confidence";
  ALTER TABLE "questions" DROP COLUMN "answer_notes";
  DROP TYPE "public"."enum_questions_validity_status";`)
}
