-- Stripe Connect fields on Company
ALTER TABLE "Company" ADD COLUMN "stripeConnectAccountId" TEXT;
ALTER TABLE "Company" ADD COLUMN "stripeConnectDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "stripeConnectPayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "terminalLocationId" TEXT;

CREATE UNIQUE INDEX "Company_stripeConnectAccountId_key" ON "Company"("stripeConnectAccountId");

-- TerminalReader
CREATE TABLE "TerminalReader" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stripeReaderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerminalReader_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TerminalReader_stripeReaderId_key" ON "TerminalReader"("stripeReaderId");
CREATE INDEX "TerminalReader_companyId_idx" ON "TerminalReader"("companyId");

ALTER TABLE "TerminalReader" ADD CONSTRAINT "TerminalReader_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
