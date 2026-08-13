-- Drop the manual firm-invoice log (replaced by real Order data)
ALTER TABLE "FirmInvoice" DROP CONSTRAINT IF EXISTS "FirmInvoice_connectionId_fkey";
DROP TABLE IF EXISTS "FirmInvoice";

-- Tracking number on real orders
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;

-- Receipts/documents the selling company attaches to an order
CREATE TABLE "OrderDocument" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderDocument_storageKey_key" ON "OrderDocument"("storageKey");

CREATE INDEX "OrderDocument_orderId_idx" ON "OrderDocument"("orderId");

ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
