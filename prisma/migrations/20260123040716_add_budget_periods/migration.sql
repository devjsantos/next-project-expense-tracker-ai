-- AlterTable
ALTER TABLE "public"."Budget" ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3),
ADD COLUMN     "periodType" TEXT NOT NULL DEFAULT 'monthly';
