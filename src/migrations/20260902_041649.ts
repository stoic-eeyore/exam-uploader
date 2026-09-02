import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_questions_status" ADD VALUE 'flagged';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "questions" ALTER COLUMN "status" SET DEFAULT 'draft'::text;
  DROP TYPE "public"."enum_questions_status";
  CREATE TYPE "public"."enum_questions_status" AS ENUM('draft', 'verified');
  ALTER TABLE "questions" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."enum_questions_status";
  ALTER TABLE "questions" ALTER COLUMN "status" SET DATA TYPE "public"."enum_questions_status" USING "status"::"public"."enum_questions_status";`)
}
