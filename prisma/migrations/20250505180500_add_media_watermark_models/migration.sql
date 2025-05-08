-- DropForeignKey
ALTER TABLE "ReferralBonus" DROP CONSTRAINT "ReferralBonus_referralId_fkey";

-- DropIndex
DROP INDEX "ReferralBonus_paidAt_idx";

-- AlterTable
ALTER TABLE "ReferralBonus" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatermarkProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "position" TEXT NOT NULL DEFAULT 'bottomRight',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatermarkProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatermarkedMedia" (
    "id" TEXT NOT NULL,
    "originalMediaId" TEXT NOT NULL,
    "watermarkProfileId" TEXT NOT NULL,
    "processedUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatermarkedMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_idx" ON "MediaAsset"("ownerId");

-- CreateIndex
CREATE INDEX "WatermarkProfile_ownerId_idx" ON "WatermarkProfile"("ownerId");

-- CreateIndex
CREATE INDEX "WatermarkedMedia_originalMediaId_idx" ON "WatermarkedMedia"("originalMediaId");

-- CreateIndex
CREATE INDEX "WatermarkedMedia_watermarkProfileId_idx" ON "WatermarkedMedia"("watermarkProfileId");

-- CreateIndex
CREATE INDEX "ReferralBonus_paid_idx" ON "ReferralBonus"("paid");

-- AddForeignKey
ALTER TABLE "ReferralBonus" ADD CONSTRAINT "ReferralBonus_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatermarkProfile" ADD CONSTRAINT "WatermarkProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatermarkedMedia" ADD CONSTRAINT "WatermarkedMedia_originalMediaId_fkey" FOREIGN KEY ("originalMediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatermarkedMedia" ADD CONSTRAINT "WatermarkedMedia_watermarkProfileId_fkey" FOREIGN KEY ("watermarkProfileId") REFERENCES "WatermarkProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
