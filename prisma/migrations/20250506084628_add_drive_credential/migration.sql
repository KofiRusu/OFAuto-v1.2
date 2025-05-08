-- CreateTable
CREATE TABLE "DriveCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriveCredential_userId_idx" ON "DriveCredential"("userId");

-- AddForeignKey
ALTER TABLE "DriveCredential" ADD CONSTRAINT "DriveCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
