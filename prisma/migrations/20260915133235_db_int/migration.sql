/*
  Warnings:

  - You are about to drop the column `area` on the `donors` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `donors` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `donors` table. All the data in the column will be lost.
  - Made the column `dateOfBirth` on table `donors` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "donors" DROP COLUMN "area",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "address" TEXT,
ALTER COLUMN "dateOfBirth" SET NOT NULL;
