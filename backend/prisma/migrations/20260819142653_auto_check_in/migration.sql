-- AlterTable
ALTER TABLE "BankAccount" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "BankAccount" ADD COLUMN "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TableReservation" ADD COLUMN "autoCheckInEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TableReservation" ADD COLUMN "checkedInAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "tableReservationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_tableReservationId_key" ON "CalendarEvent"("tableReservationId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_tableReservationId_fkey" FOREIGN KEY ("tableReservationId") REFERENCES "TableReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
