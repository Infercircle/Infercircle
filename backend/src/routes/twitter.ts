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
// Returns sentiment for each asset based on recent tweets
router.post("/sentiment-batch", asyncHandler(async (req: Request, res: Response) => {
  const { assets } = req.body;
  if (!assets || !Array.isArray(assets)) {
    return res.status(400).json({ error: "Assets array is required" });
  }

  const sentimentResults: Record<string, any> = {};
  const batchSize = 5; // Process 5 assets at a time to avoid rate limits
  
  // Process assets in batches
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize);
    
    // Process batch concurrently
    const batchPromises = batch.map(async (asset: any) => {
      const symbol = asset.symbol?.toLowerCase();
      if (!symbol) return null;

      try {
        // Fetch tweets for this asset
        const helperRes = await fetch("https://helper-apis-and-scrappers.onrender.com/twitter/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: symbol, 
            limit: 20, // More tweets for better sentiment accuracy
            product: "Latest" 
          })
        });

        if (!helperRes.ok) {
          console.warn(`Failed to fetch tweets for ${symbol}`);
          return { symbol, sentiment: 0, count: 0, error: "Failed to fetch tweets" };
        }

        const helperData = await helperRes.json();
        const tweets = Array.isArray(helperData) ? helperData : helperData.data || helperData.tweets || helperData.results || [];
        
        if (!tweets || tweets.length === 0) {
          return { symbol, sentiment: 0, count: 0, error: "No tweets found" };
        }

        // Calculate sentiment for all tweets
        let totalSentiment = 0;
        let validTweets = 0;
        
        tweets.forEach((tweet: any) => {
          const text = tweet.content || tweet.raw_data?.rawContent || tweet.raw_data?.content || tweet.text || "";
          if (text && text.trim().length > 0) {
            const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text);
            totalSentiment += sentiment.compound;
            validTweets++;
          }
        });

        // Calculate average sentiment and convert to percentage
        const avgSentiment = validTweets > 0 ? totalSentiment / validTweets : 0;
        const sentimentPercentage = Math.round(((avgSentiment + 1) / 2) * 100); // Convert -1 to 1 range to 0-100%

      return {
          symbol,
          sentiment: sentimentPercentage,
          count: validTweets,
          avgSentimentScore: avgSentiment,
          error: null
        };

      } catch (error) {
        console.error(`Error processing sentiment for ${symbol}:`, error);
        return { symbol, sentiment: 0, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add results to main results object
    batchResults.forEach(result => {
      if (result) {
        sentimentResults[result.symbol] = result;
      }
    });

    // Small delay between batches to be respectful to the API
    if (i + batchSize < assets.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  res.status(200).json({
    status: "success",
    results: sentimentResults,
    totalAssets: assets.length,
    processedAssets: Object.keys(sentimentResults).length
  });
}));

export default router;