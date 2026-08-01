import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pending_exams_status" ADD VALUE 'failed';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum_pending_exams_status";
  CREATE TYPE "public"."enum_pending_exams_status" AS ENUM('new', 'verified', 'processed', 'archived');
  ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."enum_pending_exams_status";
  ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DATA TYPE "public"."enum_pending_exams_status" USING "status"::"public"."enum_pending_exams_status";`)
}
