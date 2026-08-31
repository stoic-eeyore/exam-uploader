import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_exams_year" ADD VALUE '2026/2027' BEFORE '2025/2026';
  ALTER TABLE "exams" ALTER COLUMN "year" SET DEFAULT '2026/2027';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "exams" ALTER COLUMN "year" SET DATA TYPE text;
  ALTER TABLE "exams" ALTER COLUMN "year" SET DEFAULT '2025/2026'::text;
  DROP TYPE "public"."enum_exams_year";
  CREATE TYPE "public"."enum_exams_year" AS ENUM('2025/2026', '2024/2025', '2023/2024', '2022/2023', '2021/2022', '2020/2021', '2019/2020', '2018/2019', '2017/2018', '2016/2017', '2015/2016');
  ALTER TABLE "exams" ALTER COLUMN "year" SET DEFAULT '2025/2026'::"public"."enum_exams_year";
  ALTER TABLE "exams" ALTER COLUMN "year" SET DATA TYPE "public"."enum_exams_year" USING "year"::"public"."enum_exams_year";`)
}
