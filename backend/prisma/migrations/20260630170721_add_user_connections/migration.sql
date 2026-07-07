-- CreateTable
CREATE TABLE "UserConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserConnection_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserConnection_requesterId_idx" ON "UserConnection"("requesterId");

-- CreateIndex
CREATE INDEX "UserConnection_addresseeId_idx" ON "UserConnection"("addresseeId");

-- CreateIndex
CREATE INDEX "UserConnection_status_idx" ON "UserConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_requesterId_addresseeId_key" ON "UserConnection"("requesterId", "addresseeId");
