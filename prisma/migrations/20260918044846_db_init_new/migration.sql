/*
  Warnings:

  - The values [PENDING] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('CREATED', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."DonationAssignment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DonationAssignment" ALTER COLUMN "status" TYPE "AssignmentStatus_new" USING ("status"::text::"AssignmentStatus_new");
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "public"."AssignmentStatus_old";
ALTER TABLE "DonationAssignment" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterTable
ALTER TABLE "DonationAssignment" ALTER COLUMN "status" SET DEFAULT 'CREATED';
