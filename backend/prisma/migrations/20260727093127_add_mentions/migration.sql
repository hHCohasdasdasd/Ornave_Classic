-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'post',
    "reactions" TEXT NOT NULL DEFAULT '{}',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT,
    "groupId" TEXT,
    "linkedPublicationId" TEXT,
    "mentions" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Post_linkedPublicationId_fkey" FOREIGN KEY ("linkedPublicationId") REFERENCES "Publication" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "content", "createdAt", "groupId", "id", "isDeleted", "linkedPublicationId", "mediaUrl", "reactions", "title", "type", "updatedAt", "visibility") SELECT "authorId", "content", "createdAt", "groupId", "id", "isDeleted", "linkedPublicationId", "mediaUrl", "reactions", "title", "type", "updatedAt", "visibility" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_visibility_idx" ON "Post"("visibility");
CREATE INDEX "Post_groupId_idx" ON "Post"("groupId");
CREATE INDEX "Post_linkedPublicationId_idx" ON "Post"("linkedPublicationId");
CREATE TABLE "new_Publication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "mentions" TEXT NOT NULL DEFAULT '[]',
    "reactions" TEXT NOT NULL DEFAULT '{}',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Publication_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Publication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Publication" ("authorId", "companyId", "content", "coverImage", "createdAt", "id", "isDeleted", "reactions", "tags", "title", "updatedAt", "visibility") SELECT "authorId", "companyId", "content", "coverImage", "createdAt", "id", "isDeleted", "reactions", "tags", "title", "updatedAt", "visibility" FROM "Publication";
DROP TABLE "Publication";
ALTER TABLE "new_Publication" RENAME TO "Publication";
CREATE INDEX "Publication_authorId_idx" ON "Publication"("authorId");
CREATE INDEX "Publication_companyId_idx" ON "Publication"("companyId");
CREATE INDEX "Publication_createdAt_idx" ON "Publication"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
