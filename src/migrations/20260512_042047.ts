import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exams" ADD COLUMN "ai_analysis" jsonb;
  ALTER TABLE "exams" ADD COLUMN "ai_raw_response" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exams" DROP COLUMN "ai_analysis";
  ALTER TABLE "exams" DROP COLUMN "ai_raw_response";`)
}
