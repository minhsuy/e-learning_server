-- AlterEnum
ALTER TYPE "XPTransactionType" ADD VALUE 'coding_exercise_completed';

-- CreateTable
CREATE TABLE "coding_exercise_completions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "first_accepted_submission_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "best_score" INTEGER NOT NULL DEFAULT 100,
    "total_attempts" INTEGER NOT NULL DEFAULT 1,
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_exercise_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coding_exercise_completions_user_id_idx" ON "coding_exercise_completions"("user_id");

-- CreateIndex
CREATE INDEX "coding_exercise_completions_exercise_id_idx" ON "coding_exercise_completions"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "coding_exercise_completions_user_id_exercise_id_key" ON "coding_exercise_completions"("user_id", "exercise_id");

-- AddForeignKey
ALTER TABLE "coding_exercise_completions" ADD CONSTRAINT "coding_exercise_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_exercise_completions" ADD CONSTRAINT "coding_exercise_completions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "coding_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_exercise_completions" ADD CONSTRAINT "coding_exercise_completions_first_accepted_submission_id_fkey" FOREIGN KEY ("first_accepted_submission_id") REFERENCES "coding_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill historical completions from existing accepted submissions
INSERT INTO "coding_exercise_completions" (
    "id",
    "user_id",
    "exercise_id",
    "first_accepted_submission_id",
    "completed_at",
    "best_score",
    "total_attempts",
    "xp_awarded",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    s."user_id",
    s."exercise_id",
    s."id",
    COALESCE(s."completed_at", s."created_at"),
    s."score",
    1,
    CASE
        WHEN e."difficulty" = 'easy' THEN 30
        WHEN e."difficulty" = 'medium' THEN 50
        WHEN e."difficulty" = 'hard' THEN 80
        ELSE 30
    END,
    s."created_at",
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON ("user_id", "exercise_id") *
    FROM "coding_submissions"
    WHERE "status" = 'accepted'
    ORDER BY "user_id", "exercise_id", "created_at" ASC
) s
JOIN "coding_exercises" e ON s."exercise_id" = e."id"
ON CONFLICT ("user_id", "exercise_id") DO NOTHING;

