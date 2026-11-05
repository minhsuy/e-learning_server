-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "bunny_video_id" VARCHAR(100),
ADD COLUMN "video_status" VARCHAR(50) DEFAULT 'READY';

-- CreateIndex
CREATE UNIQUE INDEX "lessons_bunny_video_id_key" ON "lessons"("bunny_video_id");

-- CreateTable
CREATE TABLE "video_uploads" (
    "id" UUID NOT NULL,
    "bunny_video_id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    "course_id" UUID NOT NULL,
    "chapter_id" UUID,
    "user_id" UUID NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "upload_url" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_uploads_bunny_video_id_key" ON "video_uploads"("bunny_video_id");

-- CreateIndex
CREATE INDEX "video_uploads_course_id_idx" ON "video_uploads"("course_id");

-- CreateIndex
CREATE INDEX "video_uploads_user_id_idx" ON "video_uploads"("user_id");

-- AddForeignKey
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
