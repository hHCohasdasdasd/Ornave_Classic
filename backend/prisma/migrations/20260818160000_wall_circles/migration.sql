-- AlterTable
ALTER TABLE "FloorPlanWall" ADD COLUMN "shape" TEXT NOT NULL DEFAULT 'line';
ALTER TABLE "FloorPlanWall" ADD COLUMN "radius" INTEGER;
