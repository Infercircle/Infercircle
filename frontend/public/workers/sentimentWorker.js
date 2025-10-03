class SentimentWorker {
  constructor() {
    this.isRunning = false;
    this.intervals = new Map();
    this.tweetCache = {};
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    this.API_BASE = 'http://localhost:8080'; // Default, will be updated from config
    this.assetList = []; // Store current asset list for background fetching
  }

  startBackgroundSync(config) {
    if (this.isRunning) {
      this.postMessage({ type: 'LOG', message: 'Sentiment sync already running' });
      return;
    }

    this.isRunning = true;
    this.config = config;
    this.API_BASE = config.apiBase || 'http://localhost:8080'; // Use passed API base
    this.assetList = config.assetList || []; // Store asset list for background fetching
    
    this.postMessage({ type: 'LOG', message: 'Starting background sentiment and tweet sync...' });
    
    // Start periodic fetching for tweets every 3 minutes
    // Run immediately on start
    this.fetchTweetsForAllAssets();

    // Then schedule it every 3 minutes
    const tweetIntervalId = setInterval(() => {
      this.fetchTweetsForAllAssets();
    }, 3 * 60 * 1000);

    
    // Start periodic fetching for sentiment data every 5 minutes
    const sentimentIntervalId = setInterval(() => {
      this.fetchAndUpdateSentimentData();
    }, 5 * 60 * 1000);
    
    this.intervals.set('tweets', tweetIntervalId);
    this.intervals.set('sentiment', sentimentIntervalId);
    
    // Initial fetch after 45 seconds for sentiment
    setTimeout(() => {
      this.fetchAndUpdateSentimentData();
    }, 45000);
  }

  stopBackgroundSync() {
    this.isRunning = false;
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
    this.postMessage({ type: 'LOG', message: 'Sentiment and tweet sync stopped' });
  }

  // New method to fetch tweets for all assets in background
  async fetchTweetsForAllAssets() {
    
    const { assetList } = this.config;

    if (!assetList || assetList.length === 0) {
      return;
    }

    this.postMessage({ type: 'LOG', message: `Fetching tweets for ${assetList.length} assets...` });

    // Fetch all assets in parallel
    const allPromises = assetList.filter(asset => Number(asset.value) > 1).map(asset => this.fetchTweetsForAsset(asset));

    try {
      await Promise.allSettled(allPromises);
    } catch (error) {
      console.error('Error processing tweet batch:', error);
    }
  }

  // Update asset list when portfolio changes
  updateAssetList(newAssetList) {
    this.assetList = newAssetList || [];
    this.postMessage({ 
      type: 'LOG', 
      message: `Updated asset list: ${this.assetList.length} assets` 
    });
    
    // Immediately fetch tweets for new assets if we're running
    if (this.isRunning && this.assetList.length > 0) {
      setTimeout(() => {
        this.fetchTweetsForAllAssets();
      }, 1000);
    }
  }

  async fetchAndUpdateSentimentData() {
    try {
      const { selectedAsset, allElites } = this.config;
      
      if (selectedAsset) {
        // Fetch fresh tweets for selected asset
        await this.fetchTweetsForAsset(selectedAsset);
      }
      
      // Fetch curated tweets from elite users (less frequently)
      if (allElites && Array.isArray(allElites) && allElites.length > 0) {
        await this.fetchCuratedTweets(allElites);
      }

    } catch (error) {
      this.postMessage({ 
        type: 'ERROR', 
        error: `Sentiment fetch error: ${error.message}` 
      });
    }
  }

  async fetchTweetsForAsset(asset) {
    try {
      const cacheKey = this.getCacheKey(asset);
      const cached = this.tweetCache[cacheKey];
      
      // Check if cache is still fresh
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return; // Don't fetch if cache is fresh
      }

      // Generate multiple queries for better coverage
      const queries = [
        `${asset.name} $${asset.symbol}`,
        `$${asset.symbol.toLowerCase()}`,
        asset.name
      ];

      let allTweets = [];
      
      for (const query of queries) {
        try {
          const response = await fetch(`${this.API_BASE}/twitter/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query, 
              limit: 120, 
              product: "Latest" 
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const tweets = Array.isArray(data) ? data : data.data || data.tweets || [];
            allTweets.push(...tweets);
          }
        } catch (error) {
          console.error(`Worker: Error fetching tweets for query ${query}:`, error);
        }
      }

      // Remove duplicates and process tweets
      const uniqueTweets = this.removeDuplicateTweets(allTweets);
      const processedTweets = this.processTweets(uniqueTweets);

      // Update cache
      this.tweetCache[cacheKey] = {
        tweets: processedTweets,
        timestamp: Date.now()
      };

      // Save to sessionStorage for main thread access
      const sessionStorageKey = `tweets_${cacheKey}`;
      const sessionData = {
        tweets: processedTweets,
        timestamp: Date.now(),
        assetKey: cacheKey
      };
      
      // Store in sessionStorage (accessible by main thread)
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(sessionStorageKey, JSON.stringify(sessionData));
        }
      } catch (error) {
        console.error('Error saving tweets to sessionStorage:', error);
      }

      // Send updated tweets to main thread
      this.postMessage({
        type: 'TWEETS_UPDATE',
        data: {
          assetKey: cacheKey,
          tweets: processedTweets,
          timestamp: Date.now()
        }
      });

      this.postMessage({ 
        type: 'LOG', 
        message: `Updated ${processedTweets.length} tweets for ${asset.symbol}` 
      });

    } catch (error) {
      console.error('Worker: Error fetching asset tweets:', error);
    }
  }

  async fetchCuratedTweets(eliteUsernames) {
    try {
      this.postMessage({ type: 'LOG', message: 'Fetching curated tweets from elite users...' });

      const BATCH_SIZE = 5;
      let newTweets = [];

      for (let i = 0; i < eliteUsernames.length; i += BATCH_SIZE) {
        const batch = eliteUsernames.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async (username) => {
            try {
              const response = await fetch(`${this.API_BASE}/twitter/elite/tweets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  username, 
                  limit: 5
                })
              });

              if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) ? data : data.data || data.tweets || [];
              }
              return [];
            } catch (error) {
              console.error(`Worker: Error fetching tweets for ${username}:`, error);
              return [];
            }
          })
        );

        const flattenedBatch = batchResults.flat();
        newTweets.push(...flattenedBatch);

        // Small delay to avoid rate limiting
        if (i + BATCH_SIZE < eliteUsernames.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const processedCuratedTweets = this.processTweets(newTweets);

      // Send curated tweets to main thread
      this.postMessage({
        type: 'CURATED_TWEETS_UPDATE',
        data: {
          tweets: processedCuratedTweets,
          timestamp: Date.now()
        }
      });

      this.postMessage({ 
        type: 'LOG', 
        message: `Updated ${processedCuratedTweets.length} curated tweets` 
      });

    } catch (error) {
      console.error('Worker: Error fetching curated tweets:', error);
    }
  }

  getCacheKey(asset) {
    return `${asset.name.toLowerCase()}_${asset.symbol.toLowerCase()}_${asset.chain.toLowerCase()}`;
  }

  removeDuplicateTweets(tweets) {
    const seen = new Set();
    return tweets.filter(tweet => {
      const identifier = tweet.id || tweet.url || tweet.text;
      if (seen.has(identifier)) return false;
      seen.add(identifier);
      return true;
    });
  }

  processTweets(tweets) {
    return tweets.map(tweet => {
      const text = tweet.content || tweet.raw_data?.rawContent || tweet.text || "";
      const user = tweet.raw_data?.user || {};

      // Simple sentiment analysis
      let sentimentLabel = "neutral";
      const lowerText = text.toLowerCase();
      const positiveWords = ['bull', 'bullish', 'moon', 'pump', 'gain', 'profit', 'buy', 'hold'];
      const negativeWords = ['bear', 'bearish', 'dump', 'loss', 'sell', 'crash', 'drop'];
      
      const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
      
      if (positiveCount > negativeCount) sentimentLabel = "positive";
      else if (negativeCount > positiveCount) sentimentLabel = "negative";

      return {
        id: tweet.id || Date.now() + Math.random(),
        name: tweet.name || "Unknown",
        handle: user.username ? `@${user.username}` : (tweet.username ? `@${tweet.username}` : ""),
        avatar: tweet.avatar || 'https://ranlower = 1 << (5 - 1)domuser.me/api/portraits/men/1.jpg',
        followers: tweet.followers ? `${Math.floor(tweet.followers / 1000)}K` : '0',
        tweetUrl: tweet.tweetUrl || tweet.raw_data?.url || "",
        text,
        timestamp: tweet.timestamp || this.formatRelativeTime(rawTimestamp),
        sentiment: sentimentLabel,
        sentimentScore: (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1),
        rawTimestamp: new Date(tweet.date || Date.now()).getTime()
      };
    }).filter((tweet, index, arr) => {
        const duplicateIndex = arr.findIndex(t => t.text === tweet.text && t.handle === tweet.handle);
        return duplicateIndex === index;
      }).sort((a, b) => {
        // Fallback to parsing timestamp strings
        const aSeconds = this.parseTimestampToSeconds(a.timestamp);
        const bSeconds = this.parseTimestampToSeconds(b.timestamp);

        // Smaller seconds = more recent, so reverse order
        return aSeconds - bSeconds;
      });;
  }

  // Function to format timestamp to relative time (5s, 3min, 2h, 1d, etc.)
  formatRelativeTime(timestamp){
    try {
      const now = new Date();
      const tweetTime = new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(tweetTime.getTime())) {
        return 'now';
      }
      
      const diffInSeconds = Math.floor((now.getTime() - tweetTime.getTime()) / 1000);
      if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}min`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}mo`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years}y`;
      }
    } catch (error) {
      return 'now';
    }
  };

  getRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds}s`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
      if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
      return `${Math.floor(diffInSeconds / 31536000)}y`;
    } catch (error) {
      return 'now';
    }
  }

  // Function to parse timestamp strings like "1s", "10min", "2h", "3d" back to numeric values for sorting
  parseTimestampToSeconds(timestampStr){
    if (!timestampStr || timestampStr === 'now') return 0;
    
    const match = timestampStr.match(/^(\d+)(s|min|h|d|mo|y)$/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'min': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'mo': return value * 2592000; // 30 days
      case 'y': return value * 31536000; // 365 days
      default: return 0;
    }
  };

  postMessage(message) {
    self.postMessage(message);
  }
}

// Web Worker message handler
self.onmessage = function(e) {
  if (!self.sentimentWorker) {
    self.sentimentWorker = new SentimentWorker();
  }

  const { type, data } = e.data;

  switch (type) {
    case 'START_SYNC':
      self.sentimentWorker.startBackgroundSync(data);
      break;
    case 'STOP_SYNC':
      self.sentimentWorker.stopBackgroundSync();
      break;
    case 'UPDATE_CONFIG':
      self.sentimentWorker.config = { ...self.sentimentWorker.config, ...data };
      // Update API_BASE if provided
      if (data.apiBase) {
        self.sentimentWorker.API_BASE = data.apiBase;
      }
      break;
    case 'UPDATE_ASSET_LIST':
      self.sentimentWorker.updateAssetList(data.assets);
      break;
    default:
      console.log('Worker: Unknown message type:', type);
  }
};
