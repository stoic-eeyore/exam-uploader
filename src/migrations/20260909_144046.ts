import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  CREATE INDEX "questions_deleted_at_idx" ON "questions" USING btree ("deleted_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "questions_deleted_at_idx";
  ALTER TABLE "questions" DROP COLUMN "deleted_at";`)
}
