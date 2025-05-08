/*
  Warnings:

  - The values [ACTIVE,EXPIRED,TERMINATED] on the enum `ContractStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `expiresAt` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `signatureUrl` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `signed` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Contract` table. All the data in the column will be lost.
  - Added the required column `managerId` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelId` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContractStatus_new" AS ENUM ('PENDING', 'SIGNED', 'REJECTED');
ALTER TABLE "Contract" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Contract" ALTER COLUMN "status" TYPE "ContractStatus_new" USING ("status"::text::"ContractStatus_new");
ALTER TYPE "ContractStatus" RENAME TO "ContractStatus_old";
ALTER TYPE "ContractStatus_new" RENAME TO "ContractStatus";
DROP TYPE "ContractStatus_old";
ALTER TABLE "Contract" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_userId_fkey";

-- DropIndex
DROP INDEX "Contract_userId_idx";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "expiresAt",
DROP COLUMN "signatureUrl",
DROP COLUMN "signed",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "managerId" TEXT NOT NULL,
ADD COLUMN     "modelId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Contract_modelId_idx" ON "Contract"("modelId");

-- CreateIndex
CREATE INDEX "Contract_managerId_idx" ON "Contract"("managerId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
