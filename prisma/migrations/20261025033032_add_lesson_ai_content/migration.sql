-- CreateEnum
CREATE TYPE "ai_processing_status" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "ai_processed_at" TIMESTAMP(3),
ADD COLUMN     "ai_processing_error" TEXT,
ADD COLUMN     "ai_processing_status" "ai_processing_status" DEFAULT 'pending',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "transcript" TEXT;
