-- CreateTable
CREATE TABLE "telegram_report_schedules" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "report_type" VARCHAR(20) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "delivery_time" VARCHAR(5) NOT NULL DEFAULT '20:00',
    "day_of_week" INTEGER,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "next_run_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "last_status" VARCHAR(20),
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_report_deliveries" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "report_type" VARCHAR(20) NOT NULL,
    "period_key" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'CLAIMED',
    "attempt_count" INTEGER NOT NULL DEFAULT 1,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "error_message" TEXT,
    "response_message_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_report_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telegram_report_schedules_is_enabled_next_run_at_idx" ON "telegram_report_schedules"("is_enabled", "next_run_at");

-- CreateIndex
CREATE INDEX "telegram_report_schedules_teacher_id_idx" ON "telegram_report_schedules"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_report_schedules_teacher_id_report_type_key" ON "telegram_report_schedules"("teacher_id", "report_type");

-- CreateIndex
CREATE INDEX "telegram_report_deliveries_teacher_id_period_key_idx" ON "telegram_report_deliveries"("teacher_id", "period_key");

-- CreateIndex
CREATE INDEX "telegram_report_deliveries_status_claimed_at_idx" ON "telegram_report_deliveries"("status", "claimed_at");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_report_deliveries_schedule_id_period_key_key" ON "telegram_report_deliveries"("schedule_id", "period_key");

-- AddForeignKey
ALTER TABLE "telegram_report_schedules" ADD CONSTRAINT "telegram_report_schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_report_deliveries" ADD CONSTRAINT "telegram_report_deliveries_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "telegram_report_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
