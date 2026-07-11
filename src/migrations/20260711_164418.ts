import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" ADD COLUMN "verified_by_id" integer;
  ALTER TABLE "questions" ADD COLUMN "verified_at" timestamp(3) with time zone;
  ALTER TABLE "questions" ADD CONSTRAINT "questions_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "questions_verified_by_idx" ON "questions" USING btree ("verified_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questions" DROP CONSTRAINT "questions_verified_by_id_users_id_fk";
  
  DROP INDEX "questions_verified_by_idx";
  ALTER TABLE "questions" DROP COLUMN "verified_by_id";
  ALTER TABLE "questions" DROP COLUMN "verified_at";`)
}
