-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "lockoutCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "permanentlyLocked" BOOLEAN NOT NULL DEFAULT false;
