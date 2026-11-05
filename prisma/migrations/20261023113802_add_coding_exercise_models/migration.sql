-- CreateEnum
CREATE TYPE "ExerciseDifficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "ExerciseStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('manual', 'ai');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'internal_error');

-- CreateEnum
CREATE TYPE "TestCaseStatus" AS ENUM ('passed', 'failed', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'internal_error');

-- CreateTable
CREATE TABLE "coding_exercises" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "programming_language" VARCHAR(50) NOT NULL DEFAULT 'javascript',
    "difficulty" "ExerciseDifficulty" NOT NULL DEFAULT 'easy',
    "starter_code" TEXT NOT NULL,
    "reference_solution" TEXT NOT NULL,
    "execution_contract" JSONB NOT NULL,
    "time_limit" INTEGER NOT NULL DEFAULT 2000,
    "memory_limit" INTEGER NOT NULL DEFAULT 128000,
    "status" "ExerciseStatus" NOT NULL DEFAULT 'draft',
    "source" "ExerciseSource" NOT NULL DEFAULT 'manual',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_exercise_revisions" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "starter_code" TEXT NOT NULL,
    "reference_solution" TEXT NOT NULL,
    "execution_contract" JSONB NOT NULL,
    "time_limit" INTEGER NOT NULL DEFAULT 2000,
    "memory_limit" INTEGER NOT NULL DEFAULT 128000,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_exercise_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_test_cases" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "input" JSONB NOT NULL,
    "expected_output" JSONB NOT NULL,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_submissions" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source_code" TEXT NOT NULL,
    "language" VARCHAR(50) NOT NULL DEFAULT 'javascript',
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "score" INTEGER NOT NULL DEFAULT 0,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "passed_tests" INTEGER NOT NULL DEFAULT 0,
    "total_tests" INTEGER NOT NULL DEFAULT 0,
    "judge_submission_id" VARCHAR(100),
    "execution_time" INTEGER,
    "memory_usage" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "coding_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_test_results" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "test_case_id" UUID NOT NULL,
    "status" "TestCaseStatus" NOT NULL,
    "actual_output" JSONB,
    "execution_time" INTEGER,
    "memory_usage" INTEGER,
    "error_message" TEXT,
    "stdout" TEXT,

    CONSTRAINT "coding_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coding_exercises_lesson_id_status_idx" ON "coding_exercises"("lesson_id", "status");

-- CreateIndex
CREATE INDEX "coding_exercises_lesson_id_order_idx" ON "coding_exercises"("lesson_id", "order");

-- CreateIndex
CREATE INDEX "coding_exercises_course_id_idx" ON "coding_exercises"("course_id");

-- CreateIndex
CREATE INDEX "coding_exercises_created_by_id_idx" ON "coding_exercises"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "coding_exercises_lesson_id_slug_key" ON "coding_exercises"("lesson_id", "slug");

-- CreateIndex
CREATE INDEX "coding_exercise_revisions_exercise_id_is_published_idx" ON "coding_exercise_revisions"("exercise_id", "is_published");

-- CreateIndex
CREATE UNIQUE INDEX "coding_exercise_revisions_exercise_id_version_key" ON "coding_exercise_revisions"("exercise_id", "version");

-- CreateIndex
CREATE INDEX "coding_test_cases_revision_id_order_idx" ON "coding_test_cases"("revision_id", "order");

-- CreateIndex
CREATE INDEX "coding_test_cases_revision_id_is_hidden_idx" ON "coding_test_cases"("revision_id", "is_hidden");

-- CreateIndex
CREATE INDEX "coding_submissions_user_id_exercise_id_created_at_idx" ON "coding_submissions"("user_id", "exercise_id", "created_at");

-- CreateIndex
CREATE INDEX "coding_submissions_exercise_id_status_idx" ON "coding_submissions"("exercise_id", "status");

-- CreateIndex
CREATE INDEX "coding_submissions_revision_id_idx" ON "coding_submissions"("revision_id");

-- CreateIndex
CREATE INDEX "coding_submissions_user_id_status_idx" ON "coding_submissions"("user_id", "status");

-- CreateIndex
CREATE INDEX "coding_submissions_judge_submission_id_idx" ON "coding_submissions"("judge_submission_id");

-- CreateIndex
CREATE INDEX "coding_test_results_submission_id_idx" ON "coding_test_results"("submission_id");

-- CreateIndex
CREATE INDEX "coding_test_results_test_case_id_idx" ON "coding_test_results"("test_case_id");

-- CreateIndex
CREATE UNIQUE INDEX "coding_test_results_submission_id_test_case_id_key" ON "coding_test_results"("submission_id", "test_case_id");

-- AddForeignKey
ALTER TABLE "coding_exercises" ADD CONSTRAINT "coding_exercises_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_exercises" ADD CONSTRAINT "coding_exercises_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_exercises" ADD CONSTRAINT "coding_exercises_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_exercise_revisions" ADD CONSTRAINT "coding_exercise_revisions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "coding_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_exercise_revisions" ADD CONSTRAINT "coding_exercise_revisions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_test_cases" ADD CONSTRAINT "coding_test_cases_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "coding_exercise_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "coding_exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "coding_exercise_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_test_results" ADD CONSTRAINT "coding_test_results_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "coding_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_test_results" ADD CONSTRAINT "coding_test_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "coding_test_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
