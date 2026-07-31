import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_stimuli_images_placement" AS ENUM('auto', 'right', 'top', 'inline');
  CREATE TYPE "public"."enum_stimuli_status" AS ENUM('draft', 'active');
  CREATE TABLE "stimuli_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"placement" "enum_stimuli_images_placement" DEFAULT 'auto',
  	"width" numeric,
  	"alt" varchar
  );
  
  CREATE TABLE "stimuli" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"exam_id" integer NOT NULL,
  	"stimulus_number" numeric NOT NULL,
  	"content" varchar,
  	"status" "enum_stimuli_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "questions" ADD COLUMN "stimulus_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stimuli_id" integer;
  ALTER TABLE "stimuli_images" ADD CONSTRAINT "stimuli_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stimuli"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stimuli" ADD CONSTRAINT "stimuli_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "stimuli_images_order_idx" ON "stimuli_images" USING btree ("_order");
  CREATE INDEX "stimuli_images_parent_id_idx" ON "stimuli_images" USING btree ("_parent_id");
  CREATE INDEX "stimuli_exam_idx" ON "stimuli" USING btree ("exam_id");
  CREATE INDEX "stimuli_updated_at_idx" ON "stimuli" USING btree ("updated_at");
  CREATE INDEX "stimuli_created_at_idx" ON "stimuli" USING btree ("created_at");
  ALTER TABLE "questions" ADD CONSTRAINT "questions_stimulus_id_stimuli_id_fk" FOREIGN KEY ("stimulus_id") REFERENCES "public"."stimuli"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stimuli_fk" FOREIGN KEY ("stimuli_id") REFERENCES "public"."stimuli"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "questions_stimulus_idx" ON "questions" USING btree ("stimulus_id");
  CREATE INDEX "payload_locked_documents_rels_stimuli_id_idx" ON "payload_locked_documents_rels" USING btree ("stimuli_id");
  ALTER TABLE "questions" DROP COLUMN "stimulus";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stimuli_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stimuli" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "stimuli_images" CASCADE;
  DROP TABLE "stimuli" CASCADE;
  ALTER TABLE "questions" DROP CONSTRAINT "questions_stimulus_id_stimuli_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stimuli_fk";
  
  DROP INDEX "questions_stimulus_idx";
  DROP INDEX "payload_locked_documents_rels_stimuli_id_idx";
  ALTER TABLE "questions" ADD COLUMN "stimulus" varchar;
  ALTER TABLE "questions" DROP COLUMN "stimulus_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stimuli_id";
  DROP TYPE "public"."enum_stimuli_images_placement";
  DROP TYPE "public"."enum_stimuli_status";`)
}
