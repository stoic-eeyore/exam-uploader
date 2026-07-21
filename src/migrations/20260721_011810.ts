import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_exams_processing_status" ADD VALUE 'consultation' BEFORE 'completed';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exams" ALTER COLUMN "processing_status" SET DATA TYPE text;
  ALTER TABLE "exams" ALTER COLUMN "processing_status" SET DEFAULT 'uploaded'::text;
  DROP TYPE "public"."enum_exams_processing_status";
  CREATE TYPE "public"."enum_exams_processing_status" AS ENUM('uploaded', 'extracting', 'review', 'completed', 'failed');
  ALTER TABLE "exams" ALTER COLUMN "processing_status" SET DEFAULT 'uploaded'::"public"."enum_exams_processing_status";
  ALTER TABLE "exams" ALTER COLUMN "processing_status" SET DATA TYPE "public"."enum_exams_processing_status" USING "processing_status"::"public"."enum_exams_processing_status";`)
}
