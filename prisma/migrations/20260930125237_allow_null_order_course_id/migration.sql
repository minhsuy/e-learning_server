-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_course_id_fkey";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "course_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
