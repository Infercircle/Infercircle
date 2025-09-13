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

  // Completely non-blocking warmup - fire and forget
  warmupPopularAssets(limit: number = 120): void {
    if (this.isWarmupRunning) {
      console.log("🔥 Cache warmup already in progress, skipping...");
      return;
    }

    this.isWarmupRunning = true;
    console.log("🔥 Starting non-blocking cache warmup for popular assets...");
    
    // Use setImmediate to move everything to next tick - completely non-blocking
    setImmediate(() => {
      this.performWarmupInBackground(limit);
    });
  }

  // Background processing - runs completely async without blocking
  private performWarmupInBackground(limit: number): void {
    const startTime = Date.now();
    let completed = 0;
    let skipped = 0;
    let failed = 0;

    // Flatten all queries for parallel processing
    const allQueries = this.popularAssets.flatMap(asset => 
      asset.queries.map(query => ({ query, assetName: asset.name }))
    );

    console.log(`🔥 Processing ${allQueries.length} queries in parallel...`);

    // Process all queries in parallel without any blocking
    const processPromises = allQueries.map((item, index) => {
      return new Promise<void>((resolve) => {
        // Stagger requests to avoid overwhelming the API
        setTimeout(() => {
          setImmediate(async () => {
            try {
              // Check cache first
              const cached = await tweetCacheService.getCachedTweets(item.query, limit);
              if (cached) {
                skipped++;
                resolve();
                return;
              }
              
              // Fire the warmup request and immediately resolve - don't wait for it
              this.fetchAndCacheTweetsBackground(item.query, limit)
                .then(() => {
                  completed++;
                  console.log(`🚀 Warmup initiated for: ${item.query} (${completed}/${allQueries.length - skipped})`);
                })
                .catch((error) => {
                  failed++;
                  console.error(`❌ Failed to initiate warmup for ${item.query}:`, error.message);
                });
              
              // Resolve immediately - don't wait for the HTTP request to complete
              resolve();
            } catch (error) {
              failed++;
              console.error(`❌ Error processing ${item.query}:`, error);
              resolve();
            }
          });
        }, index * 100);
      });
    });

    // Let all promises run in background - don't await
    Promise.allSettled(processPromises).then(() => {
      const duration = Date.now() - startTime;
      console.log(`🔥 Cache warmup completed in ${duration}ms`);
      console.log(`📊 Completed: ${completed}, Skipped: ${skipped}, Failed: ${failed}`);
      this.isWarmupRunning = false;
    }).catch((error) => {
      console.error("❌ Warmup background processing failed:", error);
      this.isWarmupRunning = false;
    });
  }

  // Background tweet fetching that doesn't block the main thread
  private fetchAndCacheTweetsBackground(query: string, limit: number): Promise<void> {
    return new Promise((resolve) => {
      // Use setImmediate to move this off the main event loop
      setImmediate(() => {
        // Fire the request and forget about it - don't wait for response
        fetch(`${process.env.BASE_URL}/twitter/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: query, 
            limit: 120,
            product: 'Latest'
          })
        }).then(response => {
          if (response.ok) {
            console.log(`� Warmup request sent for: ${query}`);
          } else {
            console.warn(`⚠️ Warmup request failed for ${query}: ${response.status}`);
          }
        }).catch(error => {
          console.error(`❌ Warmup request error for ${query}:`, error.message);
        });

        // Resolve immediately - don't wait for the HTTP request
        resolve();
      });
    });
  }

  // Keep the original method for backward compatibility but make it non-blocking
  private fetchAndCacheTweets(query: string, limit: number): Promise<void> {
    return this.fetchAndCacheTweetsBackground(query, limit);
  }

  // Non-blocking specific queries warmup
  warmupSpecificQueries(queries: string[], limit: number = 10): void {
    console.log(`🔥 Starting non-blocking cache warmup for ${queries.length} specific queries...`);
    
    // Use setImmediate to defer to next tick
    setImmediate(() => {
      // Process all queries in parallel
      const promises = queries.map((query, index) => {
        return new Promise<void>((resolve) => {
          // Stagger requests to avoid overwhelming the API
          setTimeout(async () => {
            try {
              const cached = await tweetCacheService.getCachedTweets(query, limit);
              if (!cached) {
                // Fire the warmup request and don't wait for it
                this.fetchAndCacheTweetsBackground(query, limit)
                  .then(() => {
                    console.log(`🚀 Warmup initiated for specific query: ${query}`);
                  })
                  .catch((error) => {
                    console.error(`❌ Failed to initiate warmup for specific query ${query}:`, error);
                  });
              } else {
                console.log(`✅ Cache already warm for specific query: ${query}`);
              }
            } catch (error) {
              console.error(`❌ Error checking cache for specific query ${query}:`, error);
            } finally {
              // Always resolve immediately
              resolve();
            }
          }, index * 100); // 100ms stagger
        });
      });

      // Let all promises run in background - don't await
      Promise.allSettled(promises).then(() => {
        console.log("🔥 Specific query warmup completed in background");
      }).catch((error) => {
        console.error("❌ Specific query warmup had errors:", error);
      });
    });
  }

  startPeriodicWarmup(intervalMinutes: number = 30): void {
    console.log(`⏰ Starting periodic cache warmup every ${intervalMinutes} minutes`);
    
    setTimeout(() => {
      this.warmupPopularAssets();
    }, 5000);

    setInterval(() => {
      this.warmupPopularAssets();
    }, intervalMinutes * 60 * 1000);
  }
}

export const cacheWarmupService = new CacheWarmupService();