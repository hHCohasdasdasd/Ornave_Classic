-- Track who uploaded a given order document, so either side can upload
-- and each can only delete its own.
ALTER TABLE "OrderDocument" ADD COLUMN "uploadedByCompany" BOOLEAN NOT NULL DEFAULT true;

-- Order-scoped message thread between the buyer and the selling company
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderIsCompany" BOOLEAN NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderMessage_orderId_idx" ON "OrderMessage"("orderId");

ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
