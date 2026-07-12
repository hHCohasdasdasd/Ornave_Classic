-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "partnerStatus" TEXT NOT NULL DEFAULT 'NONE',
    "partnerRequestedBy" TEXT,
    "partneredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserConnection_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserConnection" ("addresseeId", "createdAt", "id", "requesterId", "status", "updatedAt") SELECT "addresseeId", "createdAt", "id", "requesterId", "status", "updatedAt" FROM "UserConnection";
DROP TABLE "UserConnection";
ALTER TABLE "new_UserConnection" RENAME TO "UserConnection";
CREATE INDEX "UserConnection_requesterId_idx" ON "UserConnection"("requesterId");
CREATE INDEX "UserConnection_addresseeId_idx" ON "UserConnection"("addresseeId");
CREATE INDEX "UserConnection_status_idx" ON "UserConnection"("status");
CREATE INDEX "UserConnection_partnerStatus_idx" ON "UserConnection"("partnerStatus");
CREATE UNIQUE INDEX "UserConnection_requesterId_addresseeId_key" ON "UserConnection"("requesterId", "addresseeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
