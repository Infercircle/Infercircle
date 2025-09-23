-- CreateTable
CREATE TABLE "UserContentSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserContentSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserContentSummary_userId_idx" ON "UserContentSummary"("userId");

-- CreateIndex
CREATE INDEX "UserContentSummary_contentId_idx" ON "UserContentSummary"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserContentSummary_userId_contentId_key" ON "UserContentSummary"("userId", "contentId");

-- AddForeignKey
ALTER TABLE "UserContentSummary" ADD CONSTRAINT "UserContentSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContentSummary" ADD CONSTRAINT "UserContentSummary_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "ContentSummary"("ContentId") ON DELETE CASCADE ON UPDATE CASCADE;
