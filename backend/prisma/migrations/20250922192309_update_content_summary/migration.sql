-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('space', 'broadcast');

-- CreateTable
CREATE TABLE "ContentSummary" (
    "ContentId" TEXT NOT NULL,
    "ContentType" "ContentType" NOT NULL,
    "Summary" TEXT NOT NULL,
    "Transcript" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentSummary_pkey" PRIMARY KEY ("ContentId")
);
