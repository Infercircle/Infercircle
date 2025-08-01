-- CreateTable
CREATE TABLE "InviteCode" (
    "InviteCode" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("InviteCode")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "username" TEXT,
    "followersCount" INTEGER,
    "inviteAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "twitterId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWallet" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elite_curators" (
    "id" SERIAL NOT NULL,
    "twitter_id" VARCHAR(32) NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "twitter_score" DOUBLE PRECISION,
    "tags" JSONB,
    "categories" JSONB,
    "subscribed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "followers_count" INTEGER,

    CONSTRAINT "elite_curators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_elite_curators" (
    "id" SERIAL NOT NULL,
    "twitter_id" VARCHAR(32) NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "processed" BOOLEAN DEFAULT false,

    CONSTRAINT "top_elite_curators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSentiMentScore" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "image" TEXT,
    "sentiment" TEXT NOT NULL DEFAULT '0',

    CONSTRAINT "AssetSentiMentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserWallets" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserWallets_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_twitterId_key" ON "User"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "elite_curators_twitter_id_key" ON "elite_curators"("twitter_id");

-- CreateIndex
CREATE UNIQUE INDEX "elite_curators_username_key" ON "elite_curators"("username");

-- CreateIndex
CREATE UNIQUE INDEX "top_elite_curators_twitter_id_key" ON "top_elite_curators"("twitter_id");

-- CreateIndex
CREATE UNIQUE INDEX "top_elite_curators_username_key" ON "top_elite_curators"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AssetSentiMentScore_name_key" ON "AssetSentiMentScore"("name");

-- CreateIndex
CREATE INDEX "_UserWallets_B_index" ON "_UserWallets"("B");

-- AddForeignKey
ALTER TABLE "_UserWallets" ADD CONSTRAINT "_UserWallets_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserWallets" ADD CONSTRAINT "_UserWallets_B_fkey" FOREIGN KEY ("B") REFERENCES "UserWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
