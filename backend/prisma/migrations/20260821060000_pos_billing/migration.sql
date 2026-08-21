-- AlterTable: TableReservation billing fields
ALTER TABLE "TableReservation" ADD COLUMN "discountType" TEXT;
ALTER TABLE "TableReservation" ADD COLUMN "discountValue" DOUBLE PRECISION;
ALTER TABLE "TableReservation" ADD COLUMN "discountLabel" TEXT;
ALTER TABLE "TableReservation" ADD COLUMN "serviceChargeType" TEXT;
ALTER TABLE "TableReservation" ADD COLUMN "serviceChargeValue" DOUBLE PRECISION;
ALTER TABLE "TableReservation" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "TableReservation" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "TableReservation" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateTable: TableOrderCheck
CREATE TABLE "TableOrderCheck" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Check',
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "discountLabel" TEXT,
    "serviceChargeType" TEXT,
    "serviceChargeValue" DOUBLE PRECISION,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableOrderCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableOrderCheck_reservationId_idx" ON "TableOrderCheck"("reservationId");

-- AddForeignKey
ALTER TABLE "TableOrderCheck" ADD CONSTRAINT "TableOrderCheck_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "TableReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: TableOrderItem void + check assignment
ALTER TABLE "TableOrderItem" ADD COLUMN "voidReason" TEXT;
ALTER TABLE "TableOrderItem" ADD COLUMN "voidedAt" TIMESTAMP(3);
ALTER TABLE "TableOrderItem" ADD COLUMN "checkId" TEXT;

-- CreateIndex
CREATE INDEX "TableOrderItem_checkId_idx" ON "TableOrderItem"("checkId");

-- AddForeignKey
ALTER TABLE "TableOrderItem" ADD CONSTRAINT "TableOrderItem_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "TableOrderCheck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
