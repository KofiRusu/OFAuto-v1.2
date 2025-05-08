/*
  Warnings:

  - You are about to drop the column `notes` on the `KycReview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KycReview" DROP COLUMN "notes",
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);
