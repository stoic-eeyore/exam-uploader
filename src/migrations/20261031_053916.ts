import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_exams_assets_processing_status" AS ENUM('pending', 'processing', 'complete', 'failed');
  CREATE TABLE "exam_assets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"exam_id" integer NOT NULL,
  	"page" numeric NOT NULL,
  	"image_index" numeric NOT NULL,
  	"width" numeric,
  	"height" numeric,
  	"extraction_version" numeric NOT NULL,
  	"image_url" varchar NOT NULL,
  	"cloudinary_public_id" varchar NOT NULL,
  	"cloudinary_asset_id" varchar NOT NULL,
  	"mime_type" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "exams" ADD COLUMN "assets_processing_status" "enum_exams_assets_processing_status" DEFAULT 'pending';
  ALTER TABLE "exams" ADD COLUMN "assets_processing_error" varchar;
  ALTER TABLE "exams" ADD COLUMN "assets_processing_started_at" timestamp(3) with time zone;
  ALTER TABLE "exams" ADD COLUMN "assets_processed_at" timestamp(3) with time zone;
  ALTER TABLE "exams" ADD COLUMN "assets_extraction_version" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "exam_assets_id" integer;
  ALTER TABLE "exam_assets" ADD CONSTRAINT "exam_assets_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "exam_assets_exam_idx" ON "exam_assets" USING btree ("exam_id");
  CREATE INDEX "exam_assets_extraction_version_idx" ON "exam_assets" USING btree ("extraction_version");
  CREATE INDEX "exam_assets_cloudinary_public_id_idx" ON "exam_assets" USING btree ("cloudinary_public_id");
  CREATE INDEX "exam_assets_updated_at_idx" ON "exam_assets" USING btree ("updated_at");
  CREATE INDEX "exam_assets_created_at_idx" ON "exam_assets" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exam_assets_fk" FOREIGN KEY ("exam_assets_id") REFERENCES "public"."exam_assets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_exam_assets_id_idx" ON "payload_locked_documents_rels" USING btree ("exam_assets_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exam_assets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "exam_assets" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_exam_assets_fk";
  
  DROP INDEX "payload_locked_documents_rels_exam_assets_id_idx";
  ALTER TABLE "exams" DROP COLUMN "assets_processing_status";
  ALTER TABLE "exams" DROP COLUMN "assets_processing_error";
  ALTER TABLE "exams" DROP COLUMN "assets_processing_started_at";
  ALTER TABLE "exams" DROP COLUMN "assets_processed_at";
  ALTER TABLE "exams" DROP COLUMN "assets_extraction_version";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "exam_assets_id";
  DROP TYPE "public"."enum_exams_assets_processing_status";`)
}
