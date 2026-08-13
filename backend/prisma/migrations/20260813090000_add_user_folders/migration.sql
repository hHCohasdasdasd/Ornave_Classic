CREATE TABLE "UserFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFolder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserFolder_userId_idx" ON "UserFolder"("userId");

CREATE INDEX "UserFolder_parentId_idx" ON "UserFolder"("parentId");

ALTER TABLE "UserFolder" ADD CONSTRAINT "UserFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFolder" ADD CONSTRAINT "UserFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "UserFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFile" ADD COLUMN "folderId" TEXT;

CREATE INDEX "UserFile_folderId_idx" ON "UserFile"("folderId");

ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "UserFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
