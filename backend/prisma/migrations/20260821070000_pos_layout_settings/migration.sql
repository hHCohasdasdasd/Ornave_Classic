-- CreateTable
CREATE TABLE "PosLayoutSettings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosLayoutSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosLayoutSettings_companyId_key" ON "PosLayoutSettings"("companyId");
