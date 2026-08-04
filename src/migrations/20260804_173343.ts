import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" ALTER COLUMN "grade_id" DROP NOT NULL;
  ALTER TABLE "questions" ALTER COLUMN "subject_id" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" ALTER COLUMN "grade_id" SET NOT NULL;
  ALTER TABLE "questions" ALTER COLUMN "subject_id" SET NOT NULL;`)
}
