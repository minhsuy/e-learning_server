-- CreateEnum
CREATE TYPE "ai_job_types" AS ENUM ('transcribe_and_summarize', 'transcribe', 'summarize', 'generate_quiz', 'generate_coding_exercise');

-- CreateEnum
CREATE TYPE "ai_job_statuses" AS ENUM ('pending', 'submitting', 'queued', 'running', 'completed', 'failed', 'stale');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "ai_generation" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ai_processing_jobs" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "job_type" "ai_job_types" NOT NULL DEFAULT 'transcribe_and_summarize',
    "status" "ai_job_statuses" NOT NULL DEFAULT 'pending',
    "provider_job_id" VARCHAR(100),
    "generation" INTEGER NOT NULL DEFAULT 1,
    "video_id" VARCHAR(100),
    "video_fingerprint" VARCHAR(255),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "current_stage" VARCHAR(50),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "last_polled_at" TIMESTAMP(3),
    "next_poll_at" TIMESTAMP(3),
    "error_message" TEXT,
    "raw_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_processing_jobs_lesson_id_status_idx" ON "ai_processing_jobs"("lesson_id", "status");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_provider_job_id_idx" ON "ai_processing_jobs"("provider_job_id");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_status_next_poll_at_idx" ON "ai_processing_jobs"("status", "next_poll_at");

-- CreateIndex
CREATE INDEX "ai_processing_jobs_requested_by_id_idx" ON "ai_processing_jobs"("requested_by_id");

-- AddForeignKey
ALTER TABLE "ai_processing_jobs" ADD CONSTRAINT "ai_processing_jobs_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_processing_jobs" ADD CONSTRAINT "ai_processing_jobs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_processing_jobs" ADD CONSTRAINT "ai_processing_jobs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
