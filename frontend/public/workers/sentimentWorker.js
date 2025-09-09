class SentimentWorker {
  constructor() {
    this.isRunning = false;
    this.intervals = new Map();
    this.tweetCache = {};
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    this.API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  }

  startBackgroundSync(config) {
    if (this.isRunning) {
      this.postMessage({ type: 'LOG', message: 'Sentiment sync already running' });
      return;
    }

    this.isRunning = true;
    this.config = config;
    
    this.postMessage({ type: 'LOG', message: 'Starting background sentiment sync...' });
    
    // Start periodic fetching every 3 minutes
    const intervalId = setInterval(() => {
      this.fetchAndUpdateSentimentData();
    }, 3 * 60 * 1000); // 3 minutes
    
    this.intervals.set('sentiment', intervalId);
    
    // Initial fetch after 45 seconds
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
    this.postMessage({ type: 'LOG', message: 'Sentiment sync stopped' });
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

      this.postMessage({ type: 'LOG', message: `Fetching tweets for ${asset.symbol}...` });

      const queries = [
        `${asset.name} ${asset.symbol}`,
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
              limit: 40, 
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
        
        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Remove duplicates and process tweets
      const uniqueTweets = this.removeDuplicateTweets(allTweets);
      const processedTweets = this.processTweets(uniqueTweets);

      // Update cache
      this.tweetCache[cacheKey] = {
        tweets: processedTweets,
        timestamp: Date.now()
      };

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
        name: user.displayname || tweet.username || user.username || "Unknown",
        handle: user.username ? `@${user.username}` : (tweet.username ? `@${tweet.username}` : ""),
        avatar: user.profileImageUrl || user.profile_image_url || null,
        followers: user.followersCount || user.followers_count || 0,
        tweetUrl: tweet.url || tweet.raw_data?.url || "",
        text,
        timestamp: this.getRelativeTime(tweet.date || new Date().toISOString()),
        sentiment: sentimentLabel,
        sentimentScore: (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1),
        likes: tweet.likes || tweet.raw_data?.likeCount || 0,
        retweets: tweet.retweets || tweet.raw_data?.retweetCount || 0,
        replies: tweet.replies || tweet.raw_data?.replyCount || 0,
        rawTimestamp: new Date(tweet.date || Date.now()).getTime()
      };
    }).sort((a, b) => b.rawTimestamp - a.rawTimestamp);
  }

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
      break;
    default:
      console.log('Worker: Unknown message type:', type);
  }
};
