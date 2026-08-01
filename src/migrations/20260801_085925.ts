import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_exams_semester" AS ENUM('ganjil', 'genap');
  ALTER TYPE "public"."enum_pending_exams_status" ADD VALUE 'verified' BEFORE 'processed';
  ALTER TABLE "exams" ADD COLUMN "semester" "enum_exams_semester";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DATA TYPE text;
  ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DEFAULT 'new'::text;
  DROP TYPE "public"."enum_pending_exams_status";
  CREATE TYPE "public"."enum_pending_exams_status" AS ENUM('new', 'processed', 'archived');
  ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DEFAULT 'new'::"public"."enum_pending_exams_status";
  ALTER TABLE "pending_exams" ALTER COLUMN "status" SET DATA TYPE "public"."enum_pending_exams_status" USING "status"::"public"."enum_pending_exams_status";
  ALTER TABLE "exams" DROP COLUMN "semester";
  DROP TYPE "public"."enum_exams_semester";`)
}
