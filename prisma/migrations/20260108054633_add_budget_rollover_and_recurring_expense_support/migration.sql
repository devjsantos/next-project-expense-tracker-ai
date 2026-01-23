-- AlterTable
ALTER TABLE "public"."Budget" ADD COLUMN     "rolloverAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "rolloverEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."RecurringExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "startDate" TIMESTAMP(3) NOT NULL,
    "frequency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringExpense_userId_idx" ON "public"."RecurringExpense"("userId");

-- AddForeignKey
ALTER TABLE "public"."RecurringExpense" ADD CONSTRAINT "RecurringExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;
