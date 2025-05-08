/*
  Warnings:

  - You are about to drop the column `description` on the `ActivityLog` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `ActivityLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ActivityLog_timestamp_idx";

-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "description",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "PerformanceReport" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceReport_modelId_idx" ON "PerformanceReport"("modelId");

-- CreateIndex
CREATE INDEX "PerformanceReport_periodStart_idx" ON "PerformanceReport"("periodStart");

-- CreateIndex
CREATE INDEX "PerformanceReport_periodEnd_idx" ON "PerformanceReport"("periodEnd");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PerformanceReport" ADD CONSTRAINT "PerformanceReport_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
