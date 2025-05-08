-- Create LinktreeConfig table
CREATE TABLE "LinktreeConfig" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "links" JSONB NOT NULL,
  "theme" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LinktreeConfig_pkey" PRIMARY KEY ("id")
);

-- Create primary indexes
CREATE UNIQUE INDEX "LinktreeConfig_userId_key" ON "LinktreeConfig"("userId");
CREATE INDEX "LinktreeConfig_userId_idx" ON "LinktreeConfig"("userId");

-- Add composite index for more efficient querying of linktree data
CREATE INDEX "LinktreeConfig_userId_theme_idx" ON "LinktreeConfig"("userId", "theme");

-- Add updated timestamp index for faster sorting by recent updates
CREATE INDEX "LinktreeConfig_updatedAt_idx" ON "LinktreeConfig"("updatedAt");

-- Add foreign key constraint
ALTER TABLE "LinktreeConfig" ADD CONSTRAINT "LinktreeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 