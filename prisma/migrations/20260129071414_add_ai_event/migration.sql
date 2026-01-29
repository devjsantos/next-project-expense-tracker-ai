-- CreateTable
CREATE TABLE "AIEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIEvent_userId_idx" ON "AIEvent"("userId");

-- AddForeignKey
ALTER TABLE "AIEvent" ADD CONSTRAINT "AIEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkUserId") ON DELETE SET NULL ON UPDATE CASCADE;
