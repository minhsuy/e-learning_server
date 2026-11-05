-- AlterTable
ALTER TABLE "certificates" ADD COLUMN "code" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_code_key" ON "certificates"("code");
