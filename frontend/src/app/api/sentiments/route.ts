import { getAllAssetSentimentScores } from "@/actions/queries";
import { AssetSentiMentScore } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type AssetSentimentArrayMap = {
  [symbol: string]: AssetSentiMentScore[];
};

export async function GET(req: NextRequest) {
  const scores = await getAllAssetSentimentScores();

  const scoreArrayMap: AssetSentimentArrayMap = {};
  scores.forEach((score) => {
    const symbol = score.symbol.toLowerCase();
    if (!scoreArrayMap[symbol]) {
      scoreArrayMap[symbol] = [];
    }
    scoreArrayMap[symbol].push(score);
  });


  const total = scores.reduce((sum, score) => sum + (parseFloat(score.sentiment) || 0), 0);

  return NextResponse.json({ 
    arrayMap: scoreArrayMap,
    totalScore: total 
  });
}

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  
}