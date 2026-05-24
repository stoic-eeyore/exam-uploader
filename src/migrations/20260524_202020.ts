import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exams" ADD COLUMN "file_hash" varchar;
  ALTER TABLE "pending_exams" ADD COLUMN "drive_file_id" varchar DEFAULT '' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exams" DROP COLUMN "file_hash";
  ALTER TABLE "pending_exams" DROP COLUMN "drive_file_id";`)
}
