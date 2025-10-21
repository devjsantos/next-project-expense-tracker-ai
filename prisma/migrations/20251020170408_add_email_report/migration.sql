-- CreateTable
CREATE TABLE "public"."EmailReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL,
    "providerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailReport_userId_idx" ON "public"."EmailReport"("userId");

-- AddForeignKey
ALTER TABLE "public"."EmailReport" ADD CONSTRAINT "EmailReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;
