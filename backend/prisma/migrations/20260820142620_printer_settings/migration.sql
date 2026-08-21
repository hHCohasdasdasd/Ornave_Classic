-- AlterTable
ALTER TABLE "TableOrderItem" ADD COLUMN "printedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StationPrinterSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "printMethod" TEXT NOT NULL DEFAULT 'BROWSER',
    "autoPrint" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationPrinterSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StationPrinterSettings_companyId_station_key" ON "StationPrinterSettings"("companyId", "station");
