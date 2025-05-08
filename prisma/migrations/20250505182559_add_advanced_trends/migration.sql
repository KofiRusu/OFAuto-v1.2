-- CreateTable
CREATE TABLE "Trend" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendMetric" (
    "id" TEXT NOT NULL,
    "trendId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trend_source_idx" ON "Trend"("source");

-- CreateIndex
CREATE INDEX "Trend_detectedAt_idx" ON "Trend"("detectedAt");

-- CreateIndex
CREATE INDEX "TrendMetric_trendId_idx" ON "TrendMetric"("trendId");

-- CreateIndex
CREATE INDEX "TrendMetric_platform_idx" ON "TrendMetric"("platform");

-- CreateIndex
CREATE INDEX "TrendMetric_timestamp_idx" ON "TrendMetric"("timestamp");

-- AddForeignKey
ALTER TABLE "TrendMetric" ADD CONSTRAINT "TrendMetric_trendId_fkey" FOREIGN KEY ("trendId") REFERENCES "Trend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
