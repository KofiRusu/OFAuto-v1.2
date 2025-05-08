-- CreateEnum
CREATE TYPE "KycReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFO_REQUESTED');

-- CreateTable
CREATE TABLE "KycReview" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "KycReviewStatus" NOT NULL,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "documentUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KycReview_profileId_idx" ON "KycReview"("profileId");

-- CreateIndex
CREATE INDEX "KycReview_reviewerId_idx" ON "KycReview"("reviewerId");

-- CreateIndex
CREATE INDEX "KycReview_status_idx" ON "KycReview"("status");

-- CreateIndex
CREATE INDEX "KycReview_createdAt_idx" ON "KycReview"("createdAt");

-- AddForeignKey
ALTER TABLE "KycReview" ADD CONSTRAINT "KycReview_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "OnboardingProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycReview" ADD CONSTRAINT "KycReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
