/*
  Warnings:

  - You are about to drop the column `gatewayResponse` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `payments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_requestId_fkey";

-- DropIndex
DROP INDEX "payments_requestId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "gatewayResponse",
DROP COLUMN "requestId";
