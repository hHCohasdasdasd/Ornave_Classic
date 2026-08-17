CREATE TABLE "ManualOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManualOrder_userId_idx" ON "ManualOrder"("userId");

CREATE INDEX "ManualOrder_type_idx" ON "ManualOrder"("type");

CREATE INDEX "ManualOrder_date_idx" ON "ManualOrder"("date");

ALTER TABLE "ManualOrder" ADD CONSTRAINT "ManualOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
