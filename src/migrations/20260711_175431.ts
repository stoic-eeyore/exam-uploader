import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "questions_fixes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar NOT NULL,
  	"fixed_by_id" integer,
  	"fixed_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "questions_fixes" ADD CONSTRAINT "questions_fixes_fixed_by_id_users_id_fk" FOREIGN KEY ("fixed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questions_fixes" ADD CONSTRAINT "questions_fixes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "questions_fixes_order_idx" ON "questions_fixes" USING btree ("_order");
  CREATE INDEX "questions_fixes_parent_id_idx" ON "questions_fixes" USING btree ("_parent_id");
  CREATE INDEX "questions_fixes_fixed_by_idx" ON "questions_fixes" USING btree ("fixed_by_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "questions_fixes" CASCADE;`)
}
