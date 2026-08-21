CREATE TABLE "ReceiptSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "headerText" TEXT NOT NULL DEFAULT '',
    "footerText" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReceiptSettings_companyId_key" ON "ReceiptSettings"("companyId");
