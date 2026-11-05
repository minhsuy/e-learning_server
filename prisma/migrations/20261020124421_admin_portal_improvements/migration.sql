-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CommentStatus" ADD VALUE 'hidden';
ALTER TYPE "CommentStatus" ADD VALUE 'flagged';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "moderation_note" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "rejection_reason" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_reason" TEXT;
