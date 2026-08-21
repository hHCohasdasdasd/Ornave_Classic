-- AlterTable
ALTER TABLE "CheckInProfile" ADD COLUMN "nfcToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CheckInProfile_nfcToken_key" ON "CheckInProfile"("nfcToken");
