-- CreateTable
CREATE TABLE "BarTab" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "discountLabel" TEXT,
    "serviceChargeType" TEXT,
    "serviceChargeValue" DOUBLE PRECISION,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarTab_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarTab_companyId_idx" ON "BarTab"("companyId");

-- AddForeignKey
ALTER TABLE "BarTab" ADD CONSTRAINT "BarTab_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BarTabCheck" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
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

    CONSTRAINT "BarTabCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarTabCheck_tabId_idx" ON "BarTabCheck"("tabId");

-- AddForeignKey
ALTER TABLE "BarTabCheck" ADD CONSTRAINT "BarTabCheck_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "BarTab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BarTabItem" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "checkId" TEXT,
    "menuItemId" TEXT,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SERVED',
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarTabItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarTabItem_tabId_idx" ON "BarTabItem"("tabId");

-- CreateIndex
CREATE INDEX "BarTabItem_checkId_idx" ON "BarTabItem"("checkId");

-- AddForeignKey
ALTER TABLE "BarTabItem" ADD CONSTRAINT "BarTabItem_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "BarTab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarTabItem" ADD CONSTRAINT "BarTabItem_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "BarTabCheck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarTabItem" ADD CONSTRAINT "BarTabItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
