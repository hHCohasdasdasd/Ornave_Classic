-- CreateTable
CREATE TABLE "BarStool" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "positionX" INTEGER NOT NULL DEFAULT 0,
    "positionY" INTEGER NOT NULL DEFAULT 0,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarStool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarStool_companyId_idx" ON "BarStool"("companyId");

-- AddForeignKey
ALTER TABLE "BarStool" ADD CONSTRAINT "BarStool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
