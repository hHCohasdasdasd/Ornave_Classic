-- CreateTable
CREATE TABLE "FloorPlanWall" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "x1" INTEGER NOT NULL,
    "y1" INTEGER NOT NULL,
    "x2" INTEGER NOT NULL,
    "y2" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloorPlanWall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloorPlanWall_companyId_idx" ON "FloorPlanWall"("companyId");

-- AddForeignKey
ALTER TABLE "FloorPlanWall" ADD CONSTRAINT "FloorPlanWall_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
