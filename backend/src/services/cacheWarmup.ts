import { tweetCacheService } from "./tweetCache";
import fetch from "node-fetch";
import * as vader from "vader-sentiment";
import { getRelativeTime } from "../routes/twitter";

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
      queries: ["bitcoin $btc", "bitcoin crypto", "Bitcoin $BTC"]
    },
    {
      name: "Ethereum", 
      symbol: "ETH",
      queries: ["ethereum $eth", "ethereum crypto", "Ethereum $ETH" ]
    },
    {
      name: "Solana",
      symbol: "SOL", 
      queries: ["solana $sol", "solana crypto", "Solana $SOL"]
    },
    {
      name: "Cardano",
      symbol: "ADA",
      queries: ["cardano $ada", "cardano crypto", "Cardano $ADA"]
    },
    {
      name: "Polkadot",
      symbol: "DOT",
      queries: ["polkadot $dot", "polkadot crypto", "Polkadot $DOT"]
    }
  ];

  private readonly helperApiUrl = process.env.HELPER_APIS_URL || "https://helper-apis-and-scrappers.onrender.com";
  private isWarmupRunning = false;

  constructor() {}

  // Non-blocking warmup using setImmediate and batch processing
  async warmupPopularAssets(limit: number = 120): Promise<void> {
    if (this.isWarmupRunning) {
      console.log("🔥 Cache warmup already in progress, skipping...");
      return;
    }

    this.isWarmupRunning = true;
    console.log("🔥 Starting non-blocking cache warmup for popular assets...");
    
    const startTime = Date.now();
    let warmedCount = 0;
    let skippedCount = 0;

    // Process assets in background using setImmediate
    const processAsset = async (assetIndex: number): Promise<void> => {
      if (assetIndex >= this.popularAssets.length) {
        const duration = Date.now() - startTime;
        console.log(`🔥 Cache warmup completed in ${duration}ms`);
        console.log(`📊 Warmed: ${warmedCount}, Skipped: ${skippedCount}`);
        this.isWarmupRunning = false;
        return;
      }

      const asset = this.popularAssets[assetIndex];
      
      // Process queries for this asset
      const processQuery = async (queryIndex: number): Promise<void> => {
        if (queryIndex >= asset.queries.length) {
          // Move to next asset after a delay (non-blocking)
          setImmediate(() => {
            setTimeout(() => processAsset(assetIndex + 1), 100); // Reduced delay
          });
          return;
        }

        const query = asset.queries[queryIndex];
        
        try {
          // Check cache in non-blocking way
          setImmediate(async () => {
            try {
              const cached = await tweetCacheService.getCachedTweets(query, limit);
              if (cached) {
                console.log(`✅ Cache already warm for: ${query}`);
                skippedCount++;
              } else {
                console.log(`🔥 Warming cache for: ${query} (${asset.name})`);
                // Fetch in background without blocking
                this.fetchAndCacheTweetsBackground(query, limit)
                  .then(() => {
                    warmedCount++;
                    console.log(`💾 Background caching completed for: ${query}`);
                  })
                  .catch(error => {
                    console.error(`❌ Background warmup failed for ${query}:`, error);
                  });
              }
              
              // Process next query after small delay
              setTimeout(() => processQuery(queryIndex + 1), 50); // Very small delay
            } catch (error) {
              console.error(`❌ Warmup failed for ${query}:`, error);
              setTimeout(() => processQuery(queryIndex + 1), 50);
            }
          });
          
        } catch (error) {
          console.error(`❌ Warmup failed for ${query}:`, error);
          setTimeout(() => processQuery(queryIndex + 1), 50);
        }
      };

      // Start processing queries for this asset
      processQuery(0);
    };

    // Start processing assets
    processAsset(0);
  }

  // Background tweet fetching that doesn't block the main thread
  private async fetchAndCacheTweetsBackground(query: string, limit: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use setImmediate to move this off the main event loop
      setImmediate(async () => {
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
            // Process tweets in chunks to avoid blocking
            const processInChunks = async (tweets: any[], chunkSize: number = 10) => {
              const chunks = [];
              for (let i = 0; i < tweets.length; i += chunkSize) {
                chunks.push(tweets.slice(i, i + chunkSize));
              }

              const processedTweets: any[] = [];
              
              for (const chunk of chunks) {
                // Process each chunk and yield control back to event loop
                await new Promise(resolve => {
                  setImmediate(() => {
                    try {
                      const chunkProcessed = chunk.map((tweet: any) => {
                        const text = tweet.content || tweet.raw_data?.rawContent || tweet.raw_data?.content || tweet.text || "";
                        const user = tweet.raw_data?.user || {};
                        const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(text);
                        let sentimentLabel = "neutral";
                        if (sentiment.compound >= 0.05) sentimentLabel = "positive";
                        else if (sentiment.compound <= -0.05) sentimentLabel = "negative";
                  
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
                      
                      processedTweets.push(...chunkProcessed);
                      resolve(void 0);
                    } catch (error) {
                      console.error('Error processing tweet chunk:', error);
                      resolve(void 0);
                    }
                  });
                });
              }

              return processedTweets;
            };

            const processedTweets = await processInChunks(tweets);
            await tweetCacheService.cacheTweets(query, limit, processedTweets);
            console.log(`💾 Cached ${processedTweets.length} tweets for query: ${query}`);
            resolve();
          } else {
            console.log(`⚠️ No tweets found for query: ${query}`);
            resolve();
          }
        } catch (error) {
          console.error(`Error fetching tweets for ${query}:`, error);
          reject(error);
        }
      });
    });
  }

  // Keep the original method for backward compatibility but make it non-blocking
  private async fetchAndCacheTweets(query: string, limit: number): Promise<void> {
    return this.fetchAndCacheTweetsBackground(query, limit);
  }

  async warmupSpecificQueries(queries: string[], limit: number = 10): Promise<void> {
    console.log(`🔥 Starting non-blocking cache warmup for ${queries.length} specific queries...`);
    
    // Process queries in parallel without blocking
    const promises = queries.map(async (query, index) => {
      // Stagger the requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, index * 100));
      
      try {
        const cached = await tweetCacheService.getCachedTweets(query, limit);
        if (!cached) {
          await this.fetchAndCacheTweetsBackground(query, limit);
        }
      } catch (error) {
        console.error(`Warmup failed for ${query}:`, error);
      }
    });

    // Don't await all promises - let them run in background
    Promise.all(promises)
      .then(() => console.log("🔥 Specific query warmup completed"))
      .catch(error => console.error("❌ Specific query warmup had errors:", error));
  }

  startPeriodicWarmup(intervalMinutes: number = 30): void {
    console.log(`⏰ Starting periodic cache warmup every ${intervalMinutes} minutes`);
    
    // Initial warmup (non-blocking)
    setTimeout(() => {
      // Don't await this - let it run in background
      this.warmupPopularAssets().catch(error => {
        console.error("❌ Initial cache warmup failed:", error);
      });
    }, 5000);

    // Periodic warmup (non-blocking)
    setInterval(() => {
      // Don't await this - let it run in background
      this.warmupPopularAssets().catch(error => {
        console.error("❌ Periodic cache warmup failed:", error);
      });
    }, intervalMinutes * 60 * 1000);
  }
}

export const cacheWarmupService = new CacheWarmupService();