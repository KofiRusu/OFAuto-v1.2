-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MODEL';

-- CreateTable
CREATE TABLE "ChatbotPersona" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "roleConfig" JSONB,
    "voiceConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotAutomation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerData" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatbotPersona_createdById_idx" ON "ChatbotPersona"("createdById");

-- CreateIndex
CREATE INDEX "ChatbotAutomation_personaId_idx" ON "ChatbotAutomation"("personaId");

-- CreateIndex
CREATE INDEX "ChatbotAutomation_createdBy_idx" ON "ChatbotAutomation"("createdBy");

-- CreateIndex
CREATE INDEX "ChatbotAutomation_isActive_idx" ON "ChatbotAutomation"("isActive");

-- AddForeignKey
ALTER TABLE "ChatbotPersona" ADD CONSTRAINT "ChatbotPersona_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotAutomation" ADD CONSTRAINT "ChatbotAutomation_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "ChatbotPersona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotAutomation" ADD CONSTRAINT "ChatbotAutomation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
