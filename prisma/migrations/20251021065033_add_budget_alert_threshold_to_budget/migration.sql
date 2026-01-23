-- AlterTable
ALTER TABLE "public"."Budget" ADD COLUMN     "budgetAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8;
