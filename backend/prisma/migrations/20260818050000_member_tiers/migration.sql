ALTER TABLE "User" ADD COLUMN "memberTier" TEXT NOT NULL DEFAULT 'BASIC';
ALTER TABLE "User" ADD COLUMN "memberTierSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_memberTierSubscriptionId_key" ON "User"("memberTierSubscriptionId");
