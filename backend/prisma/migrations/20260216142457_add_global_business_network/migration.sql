/*
  Warnings:

  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_type_idx";

-- DropIndex
DROP INDEX "Transaction_status_idx";

-- DropIndex
DROP INDEX "Transaction_fromCompanyId_idx";

-- DropIndex
DROP INDEX "Transaction_reference_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transaction";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "about" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verificationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConnectionPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "canViewInventory" BOOLEAN NOT NULL DEFAULT false,
    "canCreateOrders" BOOLEAN NOT NULL DEFAULT false,
    "canViewOrders" BOOLEAN NOT NULL DEFAULT false,
    "canCreateInvoices" BOOLEAN NOT NULL DEFAULT false,
    "canViewInvoices" BOOLEAN NOT NULL DEFAULT false,
    "canAccessPricing" BOOLEAN NOT NULL DEFAULT false,
    "canReceiveMessages" BOOLEAN NOT NULL DEFAULT true,
    "customPermissions" TEXT NOT NULL DEFAULT '{}',
    "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConnectionPermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConnectionPermission_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CompanyConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCompanyId" TEXT NOT NULL,
    "toCompanyId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "senderReference" TEXT,
    "receiverReference" TEXT,
    "globalReference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "senderModuleMapping" TEXT,
    "receiverModuleMapping" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "statusHistory" TEXT NOT NULL DEFAULT '[]',
    "totalAmount" REAL,
    "currency" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GlobalTransaction_fromCompanyId_fkey" FOREIGN KEY ("fromCompanyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GlobalTransaction_toCompanyId_fkey" FOREIGN KEY ("toCompanyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GlobalTransaction_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CompanyConnection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuleMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "globalObjects" TEXT NOT NULL DEFAULT '[]',
    "fieldMapping" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "relatedTransactionId" TEXT,
    "relatedCompanyId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "companyToken" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "registrationNumber" TEXT,
    "country" TEXT,
    "industry" TEXT,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublicProfile" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Company" ("companyToken", "createdAt", "description", "id", "isActive", "isPremium", "logo", "name", "slug", "updatedAt") SELECT "companyToken", "createdAt", "description", "id", "isActive", "isPremium", "logo", "name", "slug", "updatedAt" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE UNIQUE INDEX "Company_companyToken_key" ON "Company"("companyToken");
CREATE UNIQUE INDEX "Company_verificationToken_key" ON "Company"("verificationToken");
CREATE INDEX "Company_slug_idx" ON "Company"("slug");
CREATE INDEX "Company_companyToken_idx" ON "Company"("companyToken");
CREATE INDEX "Company_isPublicProfile_idx" ON "Company"("isPublicProfile");
CREATE INDEX "Company_country_idx" ON "Company"("country");
CREATE INDEX "Company_industry_idx" ON "Company"("industry");
CREATE TABLE "new_CompanyConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCompanyId" TEXT NOT NULL,
    "toCompanyId" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL DEFAULT 'PARTNER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestMessage" TEXT,
    "connectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyConnection_fromCompanyId_fkey" FOREIGN KEY ("fromCompanyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyConnection_toCompanyId_fkey" FOREIGN KEY ("toCompanyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CompanyConnection" ("connectedAt", "createdAt", "fromCompanyId", "id", "requestMessage", "status", "toCompanyId", "updatedAt") SELECT "connectedAt", "createdAt", "fromCompanyId", "id", "requestMessage", "status", "toCompanyId", "updatedAt" FROM "CompanyConnection";
DROP TABLE "CompanyConnection";
ALTER TABLE "new_CompanyConnection" RENAME TO "CompanyConnection";
CREATE INDEX "CompanyConnection_fromCompanyId_idx" ON "CompanyConnection"("fromCompanyId");
CREATE INDEX "CompanyConnection_toCompanyId_idx" ON "CompanyConnection"("toCompanyId");
CREATE INDEX "CompanyConnection_status_idx" ON "CompanyConnection"("status");
CREATE INDEX "CompanyConnection_connectionType_idx" ON "CompanyConnection"("connectionType");
CREATE UNIQUE INDEX "CompanyConnection_fromCompanyId_toCompanyId_key" ON "CompanyConnection"("fromCompanyId", "toCompanyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_companyId_key" ON "CompanyProfile"("companyId");

-- CreateIndex
CREATE INDEX "CompanyProfile_industry_idx" ON "CompanyProfile"("industry");

-- CreateIndex
CREATE INDEX "CompanyProfile_country_idx" ON "CompanyProfile"("country");

-- CreateIndex
CREATE INDEX "CompanyProfile_verificationStatus_idx" ON "CompanyProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "ConnectionPermission_companyId_idx" ON "ConnectionPermission"("companyId");

-- CreateIndex
CREATE INDEX "ConnectionPermission_connectionId_idx" ON "ConnectionPermission"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionPermission_companyId_connectionId_key" ON "ConnectionPermission"("companyId", "connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalTransaction_receiverReference_key" ON "GlobalTransaction"("receiverReference");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalTransaction_globalReference_key" ON "GlobalTransaction"("globalReference");

-- CreateIndex
CREATE INDEX "GlobalTransaction_fromCompanyId_idx" ON "GlobalTransaction"("fromCompanyId");

-- CreateIndex
CREATE INDEX "GlobalTransaction_toCompanyId_idx" ON "GlobalTransaction"("toCompanyId");

-- CreateIndex
CREATE INDEX "GlobalTransaction_status_idx" ON "GlobalTransaction"("status");

-- CreateIndex
CREATE INDEX "GlobalTransaction_transactionType_idx" ON "GlobalTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "GlobalTransaction_connectionId_idx" ON "GlobalTransaction"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleMapping_companyId_moduleName_key" ON "ModuleMapping"("companyId", "moduleName");

-- CreateIndex
CREATE INDEX "ActivityEvent_companyId_idx" ON "ActivityEvent"("companyId");

-- CreateIndex
CREATE INDEX "ActivityEvent_eventType_idx" ON "ActivityEvent"("eventType");

-- CreateIndex
CREATE INDEX "ActivityEvent_isRead_idx" ON "ActivityEvent"("isRead");

-- CreateIndex
CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");
