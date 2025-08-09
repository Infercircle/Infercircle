import { Router, Request, Response } from "express";
import { asyncHandler } from "../lib/helper";
import * as vader from "vader-sentiment";
import fetch from "node-fetch";

const router = Router();

// Health check
router.get("/", (req: Request, res: Response) => {
  res.send("Helper Twitter API Server 🚀");
});

// POST /twitter/stream
// Body: { query: string, limit?: number, product?: string }
router.post("/stream", asyncHandler(async (req: Request, res: Response) => {
  const { query, limit = 10, product = "Latest" } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  // Fetch tweets from helper API
  const helperRes = await fetch("https://helper-apis-and-scrappers.onrender.com/twitter/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, product })
  });

  if (!helperRes.ok) {
    return res.status(500).json({ error: "Failed to fetch tweets from helper API" });
    }

  const helperData = await helperRes.json();
  // The API may return { data: [...] } or just an array
  const tweets = Array.isArray(helperData) ? helperData : helperData.data || helperData.tweets || helperData.results || [];

  // Helper: format relative time like "2m ago"
  function getRelativeTime(timestamp: string) {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = (now.getTime() - then.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  // Normalize tweets (handle both array and object response)
  const normalizedTweets = (tweets.length ? tweets : (helperData.results || [])).map((tweet: any) => {
    const text = tweet.content || tweet.raw_data?.rawContent || tweet.raw_data?.content || tweet.text || "";
    const user = tweet.raw_data?.user || {};
    const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    let sentimentLabel = "neutral";
    if (sentiment.compound >= 0.05) sentimentLabel = "positive";
    else if (sentiment.compound <= -0.05) sentimentLabel = "negative";

    // Format timestamp as relative time
    let rawTimestamp = tweet.date || tweet.raw_data?.date || new Date().toISOString();
    let formattedTimestamp = getRelativeTime(rawTimestamp);
    return {
      id: tweet.id,
      name: user.displayname || tweet.username || user.username || "Unknown",
      handle: user.username ? `@${user.username}` : (tweet.username ? `@${tweet.username}` : ""),
      avatar: user.profileImageUrl || user.profile_image_url || null,
      followers: user.followersCount || user.followers_count || 0,
      tweetUrl: tweet.url || tweet.raw_data?.url || tweet.raw_data?.url || "",
      text,
      timestamp: formattedTimestamp,
      sentiment: sentimentLabel,
      sentimentScore: sentiment.compound,
      likes: tweet.likes || tweet.raw_data?.likeCount || 0,
      retweets: tweet.retweets || tweet.raw_data?.retweetCount || 0,
      replies: tweet.replies || tweet.raw_data?.replyCount || 0,
    };
  });

  res.status(200).json({
    status: "success",
    count: normalizedTweets.length,
    data: normalizedTweets,
    query,
  });
}));

// POST /twitter/sentiment-batch
// Body: { assets: Array<{symbol: string, name: string}> }
// Simple version using a promise pool utility
const processInPool = async <T, R>(
  items: T[], 
  processor: (item: T) => Promise<R>, 
  concurrency: number = 10
): Promise<R[]> => {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
    });
    
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
};

router.post("/sentiment-batch", asyncHandler(async (req: Request, res: Response) => {
  const { assets } = req.body;
  if (!assets || !Array.isArray(assets)) {
    return res.status(400).json({ error: "Assets array is required" });
  }

  const processSingleAsset = async (asset: any) => {
    const symbol = asset.symbol?.toLowerCase();
    const image = asset.image || "";
    const id = asset.id;
    const name = asset.name || "";
    if (!symbol) return null;

    try {
      // Small random delay for rate limiting
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

      const helperRes = await fetch(`${process.env.HELPER_APIS_URL}/twitter/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: symbol, 
          limit: 20,
          product: "Latest" 
        })
      });

      if (!helperRes.ok) {
        console.warn(`Failed to fetch tweets for ${symbol}`);
        return { symbol, sentiment: 0, count: 0, image, error: "Failed to fetch tweets" };
      }

      const helperData = await helperRes.json();
      const tweets = Array.isArray(helperData) ? helperData : 
                    helperData.data || helperData.tweets || helperData.results || [];
      
      if (!tweets || tweets.length === 0) {
        return { symbol, sentiment: 0, count: 0, image, error: "No tweets found" };
      }

      let totalSentiment = 0;
      let validTweets = 0;
      
      tweets.forEach((tweet: any) => {
        const text = tweet.content || tweet.raw_data?.rawContent || 
                    tweet.raw_data?.content || tweet.text || "";
        if (text && text.trim().length > 0) {
          const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text);
          totalSentiment += sentiment.compound;
          validTweets++;
        }
      });

      return {
        id,
        name,
        symbol,
        sentiment: totalSentiment,
        count: validTweets,
        image,
        error: null
      };

    } catch (error) {
      console.error(`Error processing sentiment for ${symbol}:`, error);
      return { symbol, sentiment: 0, count: 0, image, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Process all assets with controlled concurrency
  const results = await processInPool(assets, processSingleAsset, 8);
  
  const sentimentResults: Record<string, any> = {};
  results.forEach(result => {
    if (result) {
      sentimentResults[result.symbol] = result;
    }
  });

  res.status(200).json({
    status: "success",
    results: sentimentResults,
    totalAssets: assets.length,
    processedAssets: Object.keys(sentimentResults).length
  });
}));

router.get("/followers", asyncHandler(async (req: Request, res: Response) => {
  const { username, followers } = req.query;
  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Invalid or missing username" });
  }

  try {
    let allFollowers = [];

      let url = `${process.env.HELPER_APIS_URL}/twitter/followers/${username}?limit=${followers || 100}`;

      const response = await fetch(url);

      if (!response.ok) {
        return res.status(response.status).json({ 
          error: "Failed to fetch followers",
          message: `API returned status ${response.status}`
        });
      }

      const data = await response.json();
      
      // Add current batch of followers to our collection
      if (data.followers && Array.isArray(data.followers)) {
        allFollowers.push(...data.followers);
      }

    // Return all collected followers with metadata
    return res.status(200).json({
      followers: allFollowers,
      status: "success",
      message: `Successfully fetched ${allFollowers.length} followers`,
      totalFetched: allFollowers.length
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}));

export default router;