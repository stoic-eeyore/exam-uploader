import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_questions_images_placement" AS ENUM('auto', 'right', 'top', 'inline');
  CREATE TABLE "questions_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"placement" "enum_questions_images_placement" DEFAULT 'auto',
  	"width" numeric,
  	"alt" varchar
  );
  
  ALTER TABLE "questions" ADD COLUMN "stimulus" varchar;
  ALTER TABLE "questions_images" ADD CONSTRAINT "questions_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "questions_images_order_idx" ON "questions_images" USING btree ("_order");
  CREATE INDEX "questions_images_parent_id_idx" ON "questions_images" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "questions_images" CASCADE;
  ALTER TABLE "questions" DROP COLUMN "stimulus";
  DROP TYPE "public"."enum_questions_images_placement";`)
}
