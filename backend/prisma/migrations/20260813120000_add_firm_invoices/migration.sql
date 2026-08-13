CREATE TABLE "FirmInvoice" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirmInvoice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FirmInvoice_connectionId_idx" ON "FirmInvoice"("connectionId");

ALTER TABLE "FirmInvoice" ADD CONSTRAINT "FirmInvoice_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "UserCompanyConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFile" ADD COLUMN "connectionId" TEXT;

CREATE INDEX "UserFile_connectionId_idx" ON "UserFile"("connectionId");

ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "UserCompanyConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
