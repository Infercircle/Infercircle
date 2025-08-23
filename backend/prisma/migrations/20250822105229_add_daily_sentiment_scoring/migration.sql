-- CreateTable
CREATE TABLE "DailySentimentScore" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positiveTweets" INTEGER NOT NULL DEFAULT 0,
    "negativeTweets" INTEGER NOT NULL DEFAULT 0,
    "neutralTweets" INTEGER NOT NULL DEFAULT 0,
    "totalTweets" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySentimentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailySentimentScore_date_idx" ON "DailySentimentScore"("date");

-- CreateIndex
CREATE INDEX "DailySentimentScore_assetId_date_idx" ON "DailySentimentScore"("assetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailySentimentScore_assetId_date_key" ON "DailySentimentScore"("assetId", "date");

-- AddForeignKey
ALTER TABLE "DailySentimentScore" ADD CONSTRAINT "DailySentimentScore_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "AssetSentiMentScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
