-- AlterTable
ALTER TABLE "BarTab" ADD COLUMN "stoolId" TEXT;

-- CreateIndex
CREATE INDEX "BarTab_stoolId_idx" ON "BarTab"("stoolId");

-- AddForeignKey
ALTER TABLE "BarTab" ADD CONSTRAINT "BarTab_stoolId_fkey" FOREIGN KEY ("stoolId") REFERENCES "BarStool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
