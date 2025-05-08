/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AutoDMTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CampaignExperiment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatbotMessageFeedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatbotPersona` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClientCredential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClientPersona` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngagementMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Insight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InsightLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlatformCredential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PostPlatform` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduledPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduledTask` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_performedById_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_targetUserId_fkey";

-- DropForeignKey
ALTER TABLE "AutoDMTask" DROP CONSTRAINT "AutoDMTask_clientId_fkey";

-- DropForeignKey
ALTER TABLE "AutoDMTask" DROP CONSTRAINT "AutoDMTask_platformId_fkey";

-- DropForeignKey
ALTER TABLE "CampaignExperiment" DROP CONSTRAINT "CampaignExperiment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "CampaignExperiment" DROP CONSTRAINT "CampaignExperiment_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ChatbotMessageFeedback" DROP CONSTRAINT "ChatbotMessageFeedback_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ChatbotMessageFeedback" DROP CONSTRAINT "ChatbotMessageFeedback_personaId_fkey";

-- DropForeignKey
ALTER TABLE "ChatbotMessageFeedback" DROP CONSTRAINT "ChatbotMessageFeedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatbotPersona" DROP CONSTRAINT "ChatbotPersona_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ChatbotPersona" DROP CONSTRAINT "ChatbotPersona_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ClientCredential" DROP CONSTRAINT "ClientCredential_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientPersona" DROP CONSTRAINT "ClientPersona_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientPersona" DROP CONSTRAINT "ClientPersona_createdById_fkey";

-- DropForeignKey
ALTER TABLE "DashboardMetric" DROP CONSTRAINT "DashboardMetric_clientId_fkey";

-- DropForeignKey
ALTER TABLE "EngagementMetric" DROP CONSTRAINT "EngagementMetric_clientId_fkey";

-- DropForeignKey
ALTER TABLE "EngagementMetric" DROP CONSTRAINT "EngagementMetric_platformId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialMetric" DROP CONSTRAINT "FinancialMetric_clientId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialMetric" DROP CONSTRAINT "FinancialMetric_platformId_fkey";

-- DropForeignKey
ALTER TABLE "Insight" DROP CONSTRAINT "Insight_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Insight" DROP CONSTRAINT "Insight_generatedById_fkey";

-- DropForeignKey
ALTER TABLE "InsightLog" DROP CONSTRAINT "InsightLog_clientId_fkey";

-- DropForeignKey
ALTER TABLE "InsightLog" DROP CONSTRAINT "InsightLog_insightId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformCredential" DROP CONSTRAINT "PlatformCredential_platformId_fkey";

-- DropForeignKey
ALTER TABLE "PostPlatform" DROP CONSTRAINT "PostPlatform_platformId_fkey";

-- DropForeignKey
ALTER TABLE "PostPlatform" DROP CONSTRAINT "PostPlatform_postId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledPost" DROP CONSTRAINT "ScheduledPost_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledPost" DROP CONSTRAINT "ScheduledPost_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledTask" DROP CONSTRAINT "ScheduledTask_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledTask" DROP CONSTRAINT "ScheduledTask_createdById_fkey";

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "AutoDMTask";

-- DropTable
DROP TABLE "CampaignExperiment";

-- DropTable
DROP TABLE "ChatbotMessageFeedback";

-- DropTable
DROP TABLE "ChatbotPersona";

-- DropTable
DROP TABLE "ClientCredential";

-- DropTable
DROP TABLE "ClientPersona";

-- DropTable
DROP TABLE "DashboardMetric";

-- DropTable
DROP TABLE "EngagementMetric";

-- DropTable
DROP TABLE "FinancialMetric";

-- DropTable
DROP TABLE "Insight";

-- DropTable
DROP TABLE "InsightLog";

-- DropTable
DROP TABLE "PlatformCredential";

-- DropTable
DROP TABLE "PostPlatform";

-- DropTable
DROP TABLE "ScheduledPost";

-- DropTable
DROP TABLE "ScheduledTask";

-- DropEnum
DROP TYPE "AuditAction";

-- DropEnum
DROP TYPE "InsightType";

-- DropEnum
DROP TYPE "PostStatus";

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "budget" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampaignToPlatform" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Automation_clientId_idx" ON "Automation"("clientId");

-- CreateIndex
CREATE INDEX "Automation_createdById_idx" ON "Automation"("createdById");

-- CreateIndex
CREATE INDEX "Automation_isActive_idx" ON "Automation"("isActive");

-- CreateIndex
CREATE INDEX "Campaign_clientId_idx" ON "Campaign"("clientId");

-- CreateIndex
CREATE INDEX "Campaign_createdById_idx" ON "Campaign"("createdById");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_platform_idx" ON "Campaign"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignToPlatform_AB_unique" ON "_CampaignToPlatform"("A", "B");

-- CreateIndex
CREATE INDEX "_CampaignToPlatform_B_index" ON "_CampaignToPlatform"("B");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToPlatform" ADD CONSTRAINT "_CampaignToPlatform_A_fkey" FOREIGN KEY ("A") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignToPlatform" ADD CONSTRAINT "_CampaignToPlatform_B_fkey" FOREIGN KEY ("B") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
