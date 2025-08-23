import { tweetCacheService } from "./tweetCache";
import fetch from "node-fetch";

interface WarmupAsset {
  name: string;
  symbol: string;
  queries: string[];
}

export class CacheWarmupService {
  private readonly popularAssets: WarmupAsset[] = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      queries: ["bitcoin", "btc", "$btc", "bitcoin crypto"]
    },
    {
      name: "Ethereum", 
      symbol: "ETH",
      queries: ["ethereum", "eth", "$eth", "ethereum crypto"]
    },
    {
      name: "Solana",
      symbol: "SOL", 
      queries: ["solana", "sol", "$sol", "solana crypto"]
    },
    {
      name: "Cardano",
      symbol: "ADA",
      queries: ["cardano", "ada", "$ada"]
    },
    {
      name: "Polkadot",
      symbol: "DOT",
      queries: ["polkadot", "dot", "$dot"]
    }
  ];

  private readonly helperApiUrl = process.env.HELPER_APIS_URL || "https://helper-apis-and-scrappers.onrender.com";

  constructor() {}

  async warmupPopularAssets(limit: number = 10): Promise<void> {
    console.log("🔥 Starting cache warmup for popular assets...");
    
    const startTime = Date.now();
    let warmedCount = 0;
    let skippedCount = 0;

    for (const asset of this.popularAssets) {
      for (const query of asset.queries) {
        try {
          // Check if already cached
          const cached = await tweetCacheService.getCachedTweets(query, limit);
          if (cached) {
            console.log(`✅ Cache already warm for: ${query}`);
            skippedCount++;
            continue;
          }

          // Fetch and cache
          console.log(`🔥 Warming cache for: ${query} (${asset.name})`);
          await this.fetchAndCacheTweets(query, limit);
          warmedCount++;

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ Warmup failed for ${query}:`, error);
        }
      }

      // Longer delay between different assets
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const duration = Date.now() - startTime;
    console.log(`🔥 Cache warmup completed in ${duration}ms`);
    console.log(`📊 Warmed: ${warmedCount}, Skipped: ${skippedCount}`);
  }

  private async fetchAndCacheTweets(query: string, limit: number): Promise<void> {
    try {
      const response = await fetch(`${this.helperApiUrl}/twitter/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit, product: "Latest" })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const tweets = Array.isArray(data) ? data : data.data || data.tweets || data.results || [];

      if (tweets.length > 0) {
        // Process tweets (simplified version of the main processing logic)
        const processedTweets = tweets.map((tweet: any) => ({
          id: tweet.id || Math.random().toString(36),
          name: tweet.raw_data?.user?.displayname || tweet.username || "Unknown",
          handle: tweet.raw_data?.user?.username ? `@${tweet.raw_data.user.username}` : "@unknown",
          avatar: tweet.raw_data?.user?.profileImageUrl || null,
          followers: tweet.raw_data?.user?.followersCount || 0,
          tweetUrl: tweet.url || tweet.raw_data?.url || "",
          text: tweet.content || tweet.raw_data?.rawContent || tweet.text || "",
          timestamp: this.getRelativeTime(tweet.date || tweet.raw_data?.date || new Date().toISOString()),
          sentiment: "neutral", // Simplified for warmup
          sentimentScore: 0,
          likes: tweet.raw_data?.likeCount || 0,
          retweets: tweet.raw_data?.retweetCount || 0,
          replies: tweet.raw_data?.replyCount || 0,
        }));

        await tweetCacheService.cacheTweets(query, limit, processedTweets);
        console.log(`💾 Cached ${processedTweets.length} tweets for query: ${query}`);
      } else {
        console.log(`⚠️ No tweets found for query: ${query}`);
      }
    } catch (error) {
      console.error(`Error fetching tweets for ${query}:`, error);
      throw error;
    }
  }

  private getRelativeTime(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = (now.getTime() - then.getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  async warmupSpecificQueries(queries: string[], limit: number = 10): Promise<void> {
    console.log(`🔥 Starting cache warmup for ${queries.length} specific queries...`);
    
    for (const query of queries) {
      try {
        const cached = await tweetCacheService.getCachedTweets(query, limit);
        if (!cached) {
          await this.fetchAndCacheTweets(query, limit);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Warmup failed for ${query}:`, error);
      }
    }
    
    console.log("🔥 Specific query warmup completed");
  }

  startPeriodicWarmup(intervalMinutes: number = 30): void {
    console.log(`⏰ Starting periodic cache warmup every ${intervalMinutes} minutes`);
    
    // Initial warmup
    setTimeout(() => {
      this.warmupPopularAssets();
    }, 5000); // 5 second delay after server start

    // Periodic warmup
    setInterval(() => {
      this.warmupPopularAssets();
    }, intervalMinutes * 60 * 1000);
  }
}

export const cacheWarmupService = new CacheWarmupService();
