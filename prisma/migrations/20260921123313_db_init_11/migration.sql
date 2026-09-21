-- AlterTable
ALTER TABLE "BloodRequest" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "monthly_request_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_request_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_request_usage_userId_year_month_idx" ON "monthly_request_usage"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_request_usage_userId_year_month_key" ON "monthly_request_usage"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "monthly_request_usage" ADD CONSTRAINT "monthly_request_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
