-- AlterTable
ALTER TABLE "public"."Records" ADD COLUMN     "recurringId" TEXT;

-- CreateIndex
CREATE INDEX "Records_recurringId_idx" ON "public"."Records"("recurringId");

-- AddForeignKey
ALTER TABLE "public"."Records" ADD CONSTRAINT "Records_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "public"."RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
