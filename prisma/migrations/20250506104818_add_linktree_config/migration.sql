-- CreateTable
CREATE TABLE "LinktreeConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "links" JSONB NOT NULL,
    "theme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinktreeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinktreeConfig_userId_key" ON "LinktreeConfig"("userId");

-- CreateIndex
CREATE INDEX "LinktreeConfig_userId_idx" ON "LinktreeConfig"("userId");

-- AddForeignKey
ALTER TABLE "LinktreeConfig" ADD CONSTRAINT "LinktreeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
