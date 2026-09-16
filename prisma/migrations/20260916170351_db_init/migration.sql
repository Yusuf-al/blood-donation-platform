/*
  Warnings:

  - The values [VERIFIED,IN_PROGRESS,REJECTED] on the enum `BloodRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BloodRequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'MATCHING', 'DONOR_ASSIGNED', 'FULFILLED', 'CANCELLED');
ALTER TABLE "public"."BloodRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BloodRequest" ALTER COLUMN "status" TYPE "BloodRequestStatus_new" USING ("status"::text::"BloodRequestStatus_new");
ALTER TABLE "BloodRequestStatusHistory" ALTER COLUMN "oldStatus" TYPE "BloodRequestStatus_new" USING ("oldStatus"::text::"BloodRequestStatus_new");
ALTER TABLE "BloodRequestStatusHistory" ALTER COLUMN "newStatus" TYPE "BloodRequestStatus_new" USING ("newStatus"::text::"BloodRequestStatus_new");
ALTER TYPE "BloodRequestStatus" RENAME TO "BloodRequestStatus_old";
ALTER TYPE "BloodRequestStatus_new" RENAME TO "BloodRequestStatus";
DROP TYPE "public"."BloodRequestStatus_old";
ALTER TABLE "BloodRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
