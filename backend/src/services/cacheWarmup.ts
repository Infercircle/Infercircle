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

  // Ultimate fire-and-forget - no promises, no waiting, just fire everything
  private performWarmupInBackground(limit: number): void {
    console.log("🔥 Firing all warmup requests - completely non-blocking");
    
    // Fire trending assets in background
    setImmediate(() => {
      fetch('https://api.cryptorank.io/v0/coins/trending/by-clicks?period=7D&limit=20&locale=en')
        .then(res => res.json())
        .then(data => {
          console.log(`� Fetched ${data.data.length} trending assets, firing warmup requests...`);
          data.data.forEach((item: any, index: number) => {
            if(item.name && item.symbol){
              const queries = [
                `${item.name.toLowerCase()} $${item.symbol.toLowerCase()}`,
                `${item.name.toLowerCase()} crypto`,
                `${item.name} $${item.symbol}`
              ];
              
              setTimeout(() => {
                queries.forEach((query, qIndex) => {
                  setTimeout(() => {
                    this.fireWarmupRequest(query, limit);
                  }, qIndex * 100);
                });
              }, index * 200);
            }
          });
        })
        .catch(error => console.error("❌ Trending assets error:", error));
    });

    // Fire trending assets by views in background
    setImmediate(() => {
      fetch('https://api.cryptorank.io/v0/coins/trending/by-views?period=7D&limit=20&locale=en')
        .then(res => res.json())
        .then(data => {
          console.log(`👀 Fetched ${data.data.length} trending by views assets, firing warmup requests...`);
          data.data.forEach((item: any, index: number) => {
            if(item.name && item.symbol){
              const queries = [
                `${item.name.toLowerCase()} $${item.symbol.toLowerCase()}`,
                `${item.name.toLowerCase()} crypto`,
                `${item.name} $${item.symbol}`
              ];
              
              setTimeout(() => {
                queries.forEach((query, qIndex) => {
                  setTimeout(() => {
                    this.fireWarmupRequest(query, limit);
                  }, qIndex * 100);
                });
              }, index * 300); // Slightly different timing to avoid rate limits
            }
          });
        })
        .catch(error => console.error("❌ Trending by views error:", error));
    });
    
    // Fire static assets in background
    setImmediate(() => {
      const allQueries = this.popularAssets.flatMap(asset => asset.queries);
      console.log(`🔥 Firing ${allQueries.length} static asset warmup requests...`);
      
      allQueries.forEach((query, index) => {
        setTimeout(() => {
          this.fireWarmupRequest(query, limit);
        }, index * 100);
      });
    });
    
    // Immediately mark as not running since we're not waiting for anything
    this.isWarmupRunning = false;
    console.log("🚀 All warmup requests fired in background");
  }

  // Ultra-simple fire-and-forget warmup request
  private fireWarmupRequest(query: string, limit: number): void {
    // Don't even check cache - just fire the request
    fetch(`${process.env.BASE_URL}/twitter/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: query, 
        limit: limit,
        product: 'Latest'
      })
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