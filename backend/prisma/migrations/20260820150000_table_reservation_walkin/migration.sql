-- DropForeignKey
ALTER TABLE "TableReservation" DROP CONSTRAINT "TableReservation_userId_fkey";

-- AlterTable
ALTER TABLE "TableReservation" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "TableReservation" ADD COLUMN "walkInName" TEXT;
ALTER TABLE "TableReservation" ADD COLUMN "walkInPhone" TEXT;

-- AddForeignKey
ALTER TABLE "TableReservation" ADD CONSTRAINT "TableReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
