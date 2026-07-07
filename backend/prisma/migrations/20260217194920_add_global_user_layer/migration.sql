-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "address" TEXT,
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserCompanyConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'CLIENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "permissions" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCompanyConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCompanyConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "attachedFiles" TEXT NOT NULL DEFAULT '[]',
    "preferredDates" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "statusHistory" TEXT NOT NULL DEFAULT '[]',
    "linkedErpObjectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GlobalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GlobalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "uploadedBy" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlobalPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "erpInvoiceId" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlobalPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GlobalPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "userType" TEXT NOT NULL DEFAULT 'COMPANY_USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("companyId", "createdAt", "email", "firstName", "id", "isActive", "lastLogin", "lastName", "password", "role", "updatedAt") SELECT "companyId", "createdAt", "email", "firstName", "id", "isActive", "lastLogin", "lastName", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserCompanyConnection_companyId_idx" ON "UserCompanyConnection"("companyId");

-- CreateIndex
CREATE INDEX "UserCompanyConnection_status_idx" ON "UserCompanyConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompanyConnection_userId_companyId_key" ON "UserCompanyConnection"("userId", "companyId");

-- CreateIndex
CREATE INDEX "GlobalRequest_userId_idx" ON "GlobalRequest"("userId");

-- CreateIndex
CREATE INDEX "GlobalRequest_companyId_idx" ON "GlobalRequest"("companyId");

-- CreateIndex
CREATE INDEX "GlobalRequest_status_idx" ON "GlobalRequest"("status");

-- CreateIndex
CREATE INDEX "GlobalRequest_type_idx" ON "GlobalRequest"("type");

-- CreateIndex
CREATE INDEX "UserDocument_userId_idx" ON "UserDocument"("userId");

-- CreateIndex
CREATE INDEX "UserDocument_companyId_idx" ON "UserDocument"("companyId");

-- CreateIndex
CREATE INDEX "UserDocument_visibility_idx" ON "UserDocument"("visibility");

-- CreateIndex
CREATE INDEX "GlobalPayment_userId_idx" ON "GlobalPayment"("userId");

-- CreateIndex
CREATE INDEX "GlobalPayment_companyId_idx" ON "GlobalPayment"("companyId");

-- CreateIndex
CREATE INDEX "GlobalPayment_status_idx" ON "GlobalPayment"("status");
