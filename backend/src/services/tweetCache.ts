import Redis from 'ioredis';
import NodeCache from 'node-cache';

interface CachedTweet {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  followers: number;
  tweetUrl: string;
  text: string;
  timestamp: string;
  sentiment: string;
  sentimentScore: number;
  likes: number;
  retweets: number;
  replies: number;
  cachedAt: number;
}

interface CacheResponse {
  status: string;
  count: number;
  data: CachedTweet[];
  query: string;
  cached: boolean;
  cacheSource?: 'memory' | 'redis';
}

export class TweetCacheService {
  private redis: Redis | null = null;
  private memoryCache: NodeCache;
  private readonly REDIS_TTL = 3600; // 1 hour in seconds
  private readonly MEMORY_TTL = 300; // 5 minutes in seconds
  private readonly MAX_MEMORY_KEYS = 1000; // Maximum keys in memory
  private total_elite_keys = 0;
  private redisConnected = false;

  constructor() {
    // Initialize memory cache with TTL check every 60 seconds
    this.memoryCache = new NodeCache({
      stdTTL: this.MEMORY_TTL,
      checkperiod: 60,
      maxKeys: this.MAX_MEMORY_KEYS,
      deleteOnExpire: true
    });

    // Initialize Redis connection (optional fallback)
    this.initRedis();

    // Log cache stats periodically
    this.startCacheStatsLogging();
  }

  private async initRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = process.env.EXTERNAL_REDIS== "EXTERNAL" ? new Redis({
        username: process.env.REDIS_SERVICE_NAME as string,
        host: process.env.REDIS_HOST as string,
        password: process.env.REDIS_PASSWORD as string,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        tls: { rejectUnauthorized: false } ,
      }) : new Redis(redisUrl);

      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.redisConnected = true;
      });

      this.redis.on('error', (err) => {
        console.warn('⚠️ Redis connection error (falling back to memory-only):', err.message);
        this.redisConnected = false;
      });

      this.redis.on('close', () => {
        console.warn('⚠️ Redis connection closed');
        this.redisConnected = false;
      });

      // Test connection
      await this.redis.ping();
    } catch (error) {
      console.warn('⚠️ Redis initialization failed (using memory-only cache):', error);
      this.redisConnected = false;
      this.redis = null;
    }
  }

  private generateCacheKey(query: string, limit: number, offset: number = 0): string {
    // Normalize query to lowercase and create a consistent key
    const normalizedQuery = query.toLowerCase().trim();
    return `tweets:${Buffer.from(normalizedQuery).toString('base64')}:${limit}:${offset}`;
  }

  async getCachedTweets(query: string, limit: number, offset: number = 0, isElite: boolean = false): Promise<CacheResponse | null> {
    const key = isElite ? query : this.generateCacheKey(query, limit, offset);

    try {
      // First check memory cache (fastest)
      const memoryData = this.memoryCache.get<CacheResponse>(key);
      if (memoryData) {
        // console.log(`🚀 Cache HIT (Memory): ${key}`);
        return {
          ...memoryData,
          cached: true,
          cacheSource: 'memory'
        };
      }

      // Then check Redis cache if available
      if (this.redisConnected && this.redis) {
        const redisData = await this.redis.get(key);
        if (redisData) {
          const parsedData: CacheResponse = JSON.parse(redisData);
          
          // Store in memory cache for faster access next time
          this.memoryCache.set(key, parsedData, this.MEMORY_TTL);
          
          // console.log(`🔄 Cache HIT (Redis): ${key}`);
          return {
            ...parsedData,
            cached: true,
            cacheSource: 'redis'
          };
        }
      }

      // console.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  async cacheTweets(query: string, limit: number, tweets: any[], offset: number = 0, isElite: boolean = false): Promise<void> {
    const key = isElite ? query : this.generateCacheKey(query, limit, offset);
    if(this.total_elite_keys > 100 && isElite){
      return;
    }
    try {
      const cachedTweets: CachedTweet[] = tweets.map(tweet => ({
        id: tweet.id,
        name: tweet.name || 'Unknown',
        handle: tweet.handle || '@unknown',
        avatar: tweet.avatar || null,
        followers: tweet.followers || 0,
        tweetUrl: tweet.tweetUrl || '',
        text: tweet.text || '',
        timestamp: tweet.timestamp || 'now',
        sentiment: tweet.sentiment || 'neutral',
        sentimentScore: tweet.sentimentScore || 0,
        likes: tweet.likes || 0,
        retweets: tweet.retweets || 0,
        replies: tweet.replies || 0,
        cachedAt: Date.now()
      }));

      if(isElite){
        this.total_elite_keys++;
      }

      const cacheData: CacheResponse = {
        status: "success",
        count: cachedTweets.length,
        data: cachedTweets,
        query,
        cached: true
      };

      // Store in memory cache first (fastest access)
      this.memoryCache.set(key, cacheData, this.MEMORY_TTL);

      // Store in Redis cache if available (persistent)
      if (this.redisConnected && this.redis) {
        await this.redis.setex(key, this.REDIS_TTL, JSON.stringify(cacheData));
      }

      // console.log(`💾 Cached tweets: ${key} (${cachedTweets.length} tweets)`);
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  async invalidateQueryCache(query: string): Promise<void> {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      const baseKey = `tweets:${Buffer.from(normalizedQuery).toString('base64')}`;

      // Clear memory cache
      const memoryKeys = this.memoryCache.keys();
      const matchingKeys = memoryKeys.filter(key => key.startsWith(baseKey));
      matchingKeys.forEach(key => this.memoryCache.del(key));

      // Clear Redis cache if available
      if (this.redisConnected && this.redis) {
        const pattern = `${baseKey}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      console.log(`🗑️ Invalidated cache for query: ${query} (${matchingKeys.length} keys)`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  getCacheStats() {
    const memoryStats = this.memoryCache.getStats();
    return {
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        hitRate: memoryStats.hits > 0 ? ((memoryStats.hits / (memoryStats.hits + memoryStats.misses)) * 100).toFixed(2) + '%' : '0%'
      },
      redis: {
        connected: this.redisConnected,
        available: this.redis !== null
      },
      totalKeys: memoryStats.keys
    };
  }

  private startCacheStatsLogging() {
    // Log cache statistics every 5 minutes
    setInterval(() => {
      const stats = this.getCacheStats();
      console.log('📊 Cache Stats:', JSON.stringify(stats, null, 2));
    }, 5 * 60 * 1000);
  }

  async warmupCache(popularQueries: string[] = ['bitcoin', 'ethereum', 'solana'], limit: number = 10) {
    console.log('🔥 Starting cache warmup...');
    
    for (const query of popularQueries) {
      try {
        // Check if already cached
        const cached = await this.getCachedTweets(query, limit);
        if (!cached) {
          console.log(`🔥 Warming up cache for: ${query}`);
          // Note: This would need to call the actual API endpoint
          // For now, just log that warmup is needed
          console.log(`⏳ Warmup needed for: ${query}`);
        } else {
          console.log(`✅ Cache already warm for: ${query}`);
        }
      } catch (error) {
        console.error(`❌ Warmup failed for ${query}:`, error);
      }
    }
    
    console.log('🔥 Cache warmup completed');
  }

  async close() {
    this.memoryCache.flushAll();
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const tweetCacheService = new TweetCacheService();
