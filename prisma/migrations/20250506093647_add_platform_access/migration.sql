-- CreateTable
CREATE TABLE "PlatformAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformAccess_userId_idx" ON "PlatformAccess"("userId");

-- CreateIndex
CREATE INDEX "PlatformAccess_platformId_idx" ON "PlatformAccess"("platformId");

-- CreateIndex
CREATE INDEX "PlatformAccess_approved_idx" ON "PlatformAccess"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccess_userId_platformId_key" ON "PlatformAccess"("userId", "platformId");

-- AddForeignKey
ALTER TABLE "PlatformAccess" ADD CONSTRAINT "PlatformAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAccess" ADD CONSTRAINT "PlatformAccess_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
