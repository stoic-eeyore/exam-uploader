import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pending_exams_status" AS ENUM('new', 'processed', 'archived');
  ALTER TABLE "pending_exams" ADD COLUMN "status" "enum_pending_exams_status" DEFAULT 'new';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_exams" DROP COLUMN "status";
  DROP TYPE "public"."enum_pending_exams_status";`)
}
