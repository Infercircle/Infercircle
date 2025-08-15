-- AlterTable
ALTER TABLE "AssetSentiMentScore" ADD COLUMN     "negativeTweets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "neutralTweets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "positiveTweets" INTEGER NOT NULL DEFAULT 0;
