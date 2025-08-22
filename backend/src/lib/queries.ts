import { AssetSentiMentScore } from "../generated/prisma";
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

export async function createDailySentimentScore(params: {
  assetId: string;
  date: Date;
  sentimentScore: number;
  positiveTweets: number;
  negativeTweets: number;
  neutralTweets: number;
  totalTweets: number;
}) {
  return db.dailySentimentScore.upsert({
    where: {
      assetId_date: {
        assetId: params.assetId,
        date: params.date,
      },
    },
    update: {
      sentimentScore: params.sentimentScore,
      positiveTweets: params.positiveTweets,
      negativeTweets: params.negativeTweets,
      neutralTweets: params.neutralTweets,
      totalTweets: params.totalTweets,
    },
    create: {
      assetId: params.assetId,
      date: params.date,
      sentimentScore: params.sentimentScore,
      positiveTweets: params.positiveTweets,
      negativeTweets: params.negativeTweets,
      neutralTweets: params.neutralTweets,
      totalTweets: params.totalTweets,
    },
  });
}

export async function getDailySentimentScores(assetId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.dailySentimentScore.findMany({
    where: {
      assetId,
      date: {
        gte: startDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
}

export async function getAllAssetsDailySentiment(days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db.dailySentimentScore.findMany({
    where: {
      date: {
        gte: startDate,
      },
    },
    include: {
      asset: {
        select: {
          name: true,
          symbol: true,
          image: true,
        },
      },
    },
    orderBy: [
      { assetId: 'asc' },
      { date: 'asc' },
    ],
  });
}
