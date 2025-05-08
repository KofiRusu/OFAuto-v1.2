-- CreateEnum
CREATE TYPE "TaxFormType" AS ENUM ('US_1099', 'EU_VAT', 'OTHER');

-- CreateTable
CREATE TABLE "TaxForm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "TaxFormType" NOT NULL,
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxForm_userId_idx" ON "TaxForm"("userId");

-- CreateIndex
CREATE INDEX "TaxForm_year_idx" ON "TaxForm"("year");

-- CreateIndex
CREATE INDEX "TaxForm_type_idx" ON "TaxForm"("type");

-- AddForeignKey
ALTER TABLE "TaxForm" ADD CONSTRAINT "TaxForm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
