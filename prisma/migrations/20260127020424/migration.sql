-- AlterTable
ALTER TABLE "RecurringExpense" ADD COLUMN     "isVariable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAmount" DOUBLE PRECISION,
ADD COLUMN     "nextDueDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
