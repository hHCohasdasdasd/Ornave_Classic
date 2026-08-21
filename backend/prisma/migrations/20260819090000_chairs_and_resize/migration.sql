-- AlterTable
ALTER TABLE "RestaurantTable" ADD COLUMN "width" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "RestaurantTable" ADD COLUMN "height" INTEGER NOT NULL DEFAULT 90;

-- CreateTable
CREATE TABLE "FloorPlanChair" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "positionX" INTEGER NOT NULL DEFAULT 0,
    "positionY" INTEGER NOT NULL DEFAULT 0,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanChair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloorPlanChair_companyId_idx" ON "FloorPlanChair"("companyId");

-- AddForeignKey
ALTER TABLE "FloorPlanChair" ADD CONSTRAINT "FloorPlanChair_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
