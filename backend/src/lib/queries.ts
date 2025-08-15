import db from "./db";

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}

export async function createAssetMindShare(
  params: { id: string, name: string, image?: string, symbol: string, sentiment: string, positiveTweets?: number, negativeTweets?: number, neutralTweets?: number }
) {
  await db.assetSentiMentScore.upsert({
    where: { id: params.id },
    update: {
      name: params.name,
      image: params.image,
      symbol: params.symbol,
      sentiment: params.sentiment,
      positiveTweets: params.positiveTweets || 0,
      negativeTweets: params.negativeTweets || 0,
      neutralTweets: params.neutralTweets || 0,
    },
    create: {
      id: params.id,
      name: params.name,
      image: params.image,
      symbol: params.symbol,
      sentiment: params.sentiment,
      positiveTweets: params.positiveTweets || 0,
      negativeTweets: params.negativeTweets || 0,
      neutralTweets: params.neutralTweets || 0,
    },
  });
}

export async function getAssetById(id: string) {
  return db.assetSentiMentScore.findUnique({
    where: { id },
  });
}

export async function getAllAssetSentimentScores() {
  return db.assetSentiMentScore.findMany();
}
