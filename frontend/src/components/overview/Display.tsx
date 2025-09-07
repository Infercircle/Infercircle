"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import Tippy from '@tippyjs/react';
import { IoFilter } from "react-icons/io5";

// Import ApexCharts with proper typing and dynamic loading
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">
    <div className="flex space-x-1">
      <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
      <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
      <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
    </div>
  </div>
}) as any;

interface SelectedAsset {
  name: string;
  symbol: string;
  chain: string;
  price: number;
  balance: number;
  value: number;
  priceChange: number;
  balanceChange?: number;
  sentimentChange?: number;
  sentiment?: number;
  icon: string;
}

interface ChartData {
  prices: Array<{
    timestamp: number;
    price: number;
    date: string;
    balanceValue?: number;
  }>;
  market_caps: Array<{
    timestamp: number;
    marketCap: number;
    date: string;
  }>;
  total_volumes: Array<{
    timestamp: number;
    volume: number;
    date: string;
  }>;
}

interface SentimentChartData {
  sentimentData: Array<{
    date: string;
    sentimentScore: number;
    positiveTweets: number;
    negativeTweets: number;
    neutralTweets: number;
    totalTweets: number;
  }>;
}

interface Tweet {
  sentiment: string;
  avatar: string;
  name: string;
  handle: string;
  timestamp: string;
  followers: string;
  tweetUrl: string;
  text: string;
  rawTimestamp: number;
  id: string; // Add unique ID for React keys
}

const sentimentIcon = (sentiment: string) => {
  let icon = null;
  let tooltip = '';
  let bgColor = '';
  if (sentiment === "positive") {
    icon = <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7 7 7M12 3v18" /></svg>;
    tooltip = 'Positive';
    bgColor = 'bg-green-600';
  } else if (sentiment === "negative") {
    icon = <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7-7-7M12 21V3" /></svg>;
    tooltip = 'Negative';
    bgColor = 'bg-red-600';
  } else {
    icon = <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
    tooltip = 'Neutral';
    bgColor = 'bg-gray-400';
  }
  return <Tippy content={tooltip}><span className={`inline-flex items-center justify-center w-5 h-5 rounded ${bgColor}`}>{icon}</span></Tippy>;
};

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m7-1V7m0 0h-5m5 0L10 17" />
  </svg>
);

// Tweet skeleton loading component
const TweetSkeleton = () => (
  <div className="flex items-start gap-3 rounded-xl px-3 py-2 bg-[rgba(36,37,42,0.25)] animate-pulse" style={{ minHeight: 80, maxHeight: 80 }}>
    {/* Avatar skeleton */}
    <div className="w-10 h-10 rounded-full bg-gray-600 mt-1"></div>
    
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 w-full mb-2">
        <div className="w-5 h-5 rounded bg-gray-600"></div>
        <div className="h-3 bg-gray-600 rounded w-20"></div>
        <div className="h-3 bg-gray-600 rounded w-16"></div>
        <div className="ml-auto">
          <div className="h-3 bg-gray-600 rounded w-8"></div>
        </div>
      </div>
      
      {/* Text skeleton */}
      <div className="space-y-1">
        <div className="h-3 bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-600 rounded w-3/4"></div>
      </div>
    </div>
  </div>
);

interface DisplayProps {
  selectedAsset?: SelectedAsset | null;
  showPriceChart?: boolean;
  chartAsset?: SelectedAsset | null;
  onCloseChart?: () => void;
  chartType?: 'price' | 'balance' | 'sentiment';
  connectedWallets?: number;
  sharedLogoCache?: Record<string, string>;
  curatedTweets?: any[];
}

const CHART_FILTERS = [
  { label: '30M', days: '1', interval: 'minutely' },
  { label: '1D', days: '1', interval: 'hourly' },
  { label: '1W', days: '7', interval: 'hourly' },
  { label: '1M', days: '30', interval: 'daily' },
  { label: '3M', days: '90', interval: 'daily' },
  { label: '1Y', days: '365', interval: 'daily' },
];

// Symbol mapping for tokens that have changed their symbols
const SYMBOL_MAPPINGS: Record<string, string> = {
  'matic': 'pol',
  'polygon': 'pol',
};

// Function to format timestamp to relative time (5s, 3min, 2h, 1d, etc.)
const formatRelativeTime = (timestamp: string | number | Date): string => {
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

// Function to parse timestamp strings like "1s", "10min", "2h", "3d" back to numeric values for sorting
const parseTimestampToSeconds = (timestampStr: string): number => {
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

const Display: React.FC<DisplayProps> = React.memo(({ 
  selectedAsset, 
  showPriceChart = false, 
  chartAsset, 
  chartType = 'price' as const, 
  connectedWallets = 0, 
  sharedLogoCache = {}, 
  curatedTweets = [] 
}) => {
  const [rankRetryCount, setRankRetryCount] = useState(0);
  const [rankCache, setRankCache] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [sentimentChartData, setSentimentChartData] = useState<SentimentChartData | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentChartType, setCurrentChartType] = useState<'price' | 'balance' | 'sentiment'>(chartType as 'price' | 'balance' | 'sentiment');
  const [localLogoCache, setLocalLogoCache] = useState<Record<string, string>>({});
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  
  // Simplified tweet state management
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [eliteTweets, setEliteTweets] = useState<Tweet[]>([]);
  const [tweetMap, setTweetMap] = useState<Map<string, Tweet>>(new Map());
  const [expandedTweetId, setExpandedTweetId] = useState<string | null>(null);
  
  // Simplified caching system
  const [tweetCache, setTweetCache] = useState<Record<string, {
    tweets: Tweet[];
    timestamp: number;
  }>>({});
  const [loadingTweets, setLoadingTweets] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState(CHART_FILTERS[5]);
  const [isCurated, setIsCurated] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  // Cache duration and limits
  const TWEET_CACHE_DURATION = 10 * 60 * 1000;
  const MAX_CACHE_ENTRIES = 10; // Limit cache size
  const MAX_TWEET_MAP_SIZE = 200; // Limit tweet map size

  // Load tweet cache from session storage on mount
  useEffect(() => {
    const sessionKey = 'display_tweet_cache';
    const persistedCache = sessionStorage.getItem(sessionKey);
    
    if (persistedCache) {
      try {
        const { cache: cachedData, timestamp } = JSON.parse(persistedCache);
        // Check if cache is still fresh (less than 5 minutes old)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setTweetCache(cachedData);
        }
      } catch (error) {
        console.error('Error loading persisted tweet cache:', error);
      }
    }
  }, []);

  // Save tweet cache to session storage when it changes
  useEffect(() => {
    if (Object.keys(tweetCache).length > 0) {
      const sessionKey = 'display_tweet_cache';
      const dataToStore = {
        cache: tweetCache,
        timestamp: Date.now()
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(dataToStore));
    }
  }, [tweetCache]);


  // Function to get cache key for an asset
  const getCacheKey = useCallback((asset: SelectedAsset): string => {
    return Buffer.from(`${asset.symbol.toLowerCase()}-${asset.name.toLowerCase()}-${asset.chain.toLowerCase()}`).toString('base64');
  }, []);

  // Function to check if cached data is still fresh
  const isCacheFresh = useCallback((cacheEntry: any): boolean => {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return (Date.now() - cacheEntry.timestamp) < TWEET_CACHE_DURATION;
  }, [TWEET_CACHE_DURATION]);

  // Function to load tweets from cache
  const loadFromCache = useCallback((asset: SelectedAsset): boolean => {
    const cacheKey = getCacheKey(asset);
    const cacheEntry = tweetCache[cacheKey];
    
    if (cacheEntry && isCacheFresh(cacheEntry)) {
      console.log(`📱 Loading ${cacheEntry.tweets.length} tweets from cache for ${asset.symbol}`);
      setTweets(cacheEntry.tweets);
      // Update tweet map
      const newMap = new Map<string, Tweet>();
      cacheEntry.tweets.forEach(tweet => newMap.set(tweet.id, tweet));
      setTweetMap(newMap);
      return true;
    }
    
    console.log(`❌ Cache miss for ${asset.symbol}: ${!cacheEntry ? 'no entry' : 'stale data'}`);
    return false;
  }, [tweetCache, getCacheKey, isCacheFresh]);

  // Function to save tweets to cache
  const saveToCache = useCallback((asset: SelectedAsset, tweetsData: Tweet[]) => {
    const cacheKey = getCacheKey(asset);
    const cacheEntry = {
      tweets: tweetsData,
      timestamp: Date.now()
    };
    
    setTweetCache(prev => {
      const newCache = { ...prev, [cacheKey]: cacheEntry };
      
      // Clean up old cache entries if we exceed the limit
      const entries = Object.entries(newCache);
      if (entries.length > MAX_CACHE_ENTRIES) {
        // Keep only the most recent entries
        const sortedEntries = entries.sort(([,a], [,b]) => b.timestamp - a.timestamp);
        const cleanedCache = Object.fromEntries(sortedEntries.slice(0, MAX_CACHE_ENTRIES));
        return cleanedCache;
      }
      
      return newCache;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 Saved ${tweetsData.length} tweets to cache for ${asset.symbol}`);
    }
  }, [getCacheKey, MAX_CACHE_ENTRIES]);

  // Function to create a unique content hash for duplicate detection (kept for elite tweets)
  const createTweetHash = useCallback((tweet: Tweet): string => {
    const contentHash = `${tweet.handle}-${tweet.text.substring(0, 50)}-${tweet.name}`;
    return contentHash.toLowerCase().replace(/\s+/g, '');
  }, []);

  // Update currentChartType when chartType prop changes
  useEffect(() => {
    setCurrentChartType(chartType as 'price' | 'balance' | 'sentiment');
  }, [chartType]);

  // Simplified fetch tweets function
  const fetchTweets = useCallback(async (assetName: string, assetSymbol: string, chain?: string) => {
    if (!assetName || !assetSymbol) return;
    
    setLoadingTweets(true);
    
    try {
      console.log(`🔄 Fetching tweets for ${assetSymbol}`);
      
      // Check cache first
      if (selectedAsset) {
        const cached = loadFromCache(selectedAsset);
        if (cached) {
          setLoadingTweets(false);
          return; // Use cached data
        }
      }
      
      const searchQueries: string[] = [
        `${assetName} $${assetSymbol}`
      ];
      
      const allTweets: Tweet[] = [];
      const newTweetMap = new Map<string, Tweet>();
      // Fetch from multiple queries
      for (const query of searchQueries) {
        try {
          const response = await fetch(`${API_BASE}/twitter/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: query, 
              limit: 120,
              product: 'Latest'
            })
          });
          if (response.ok) {
            const data = await response.json();
            
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              console.log(`✅ Got ${data.data.length} tweets from "${query}"`);
              
              data.data.forEach((tweet: any) => {
                const rawTimestamp = Date.now() - (allTweets.length * 1000);
                const uniqueId = `${tweet.id || tweet.handle}-${rawTimestamp}`;
                
                const transformedTweet: Tweet = {
                  sentiment: tweet.sentiment || 'neutral',
                  avatar: tweet.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
                  name: tweet.name || 'Unknown',
                  handle: tweet.handle || '@unknown',
                  timestamp: tweet.timestamp || formatRelativeTime(rawTimestamp),
                  followers: tweet.followers ? `${Math.floor(tweet.followers / 1000)}K` : '0',
                  tweetUrl: tweet.tweetUrl || 'https://twitter.com',
                  text: tweet.text || '',
                  rawTimestamp,
                  id: uniqueId
                };
                
                // Filter out very short tweets
                if (transformedTweet.text.length > 10 && transformedTweet.name !== 'Unknown') {
                  allTweets.push(transformedTweet);
                  newTweetMap.set(uniqueId, transformedTweet);
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching tweets for "${query}":`, error);
        }
        
        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Remove duplicates based on text content
      const uniqueTweets = allTweets.filter((tweet, index, arr) => {
        const duplicateIndex = arr.findIndex(t => t.text === tweet.text && t.handle === tweet.handle);
        return duplicateIndex === index;
      }).sort((a, b) => {
        // Fallback to parsing timestamp strings
        const aSeconds = parseTimestampToSeconds(a.timestamp);
        const bSeconds = parseTimestampToSeconds(b.timestamp);
        
        // Smaller seconds = more recent, so reverse order
        return aSeconds - bSeconds;
      });
      
      console.log(`📝 Processed ${uniqueTweets.length} unique tweets for ${assetSymbol}`);
      
      // Update state
      setTweets(uniqueTweets);
      setTweetMap(newTweetMap);
      
      // Cache the results
      if (selectedAsset && uniqueTweets.length > 0) {
        saveToCache(selectedAsset, uniqueTweets);
      }
      
    } catch (error) {
      console.error('Error in fetchTweets:', error);
    } finally {
      setLoadingTweets(false);
    }
  }, [API_BASE, selectedAsset, loadFromCache, saveToCache]);

  // Enhanced asset filtering with name and symbol priority
  const isAssetRelated = useCallback((tweetContent: string, assetName: string, assetSymbol: string) => {
    if (!tweetContent || !assetName || !assetSymbol) return false;
    
    const content = tweetContent.toLowerCase();
    const name = assetName.toLowerCase();
    const symbol = assetSymbol.toLowerCase();
    
    // Primary: Check for exact name matches (most precise)
    const nameMatches = content.includes(name);
    
    // Secondary: Check for symbol matches with $ prefix (common crypto format)
    const symbolMatches = content.includes(`$${symbol}`);
    
    // Handle special cases for common token names and their variations
    const specialCases = {
      'bitcoin': ['bitcoin', 'btc', '$btc'],
      'ethereum': ['ethereum', 'eth', '$eth'],
      'solana': ['solana', 'sol', '$sol'],
      'cardano': ['cardano', 'ada', '$ada'],
      'polygon': ['polygon', 'matic', '$matic', '$pol'],
      'chainlink': ['chainlink', 'link', '$link'],
      'uniswap': ['uniswap', 'uni', '$uni'],
      'avalanche': ['avalanche', 'avax', '$avax'],
      'polkadot': ['polkadot', 'dot', '$dot'],
      'litecoin': ['litecoin', 'ltc', '$ltc'],
      'binance coin': ['binance coin', 'bnb', '$bnb', 'binance'],
      'xrp': ['xrp', 'ripple', '$xrp'],
      'dogecoin': ['dogecoin', 'doge', '$doge'],
      'shiba inu': ['shiba inu', 'shib', '$shib', 'shiba'],
      'pepe': ['pepe', '$pepe']
    };
    
    // Check special cases - only if the asset name matches one of our known cases
    let specialMatch = false;
    for (const [key, variations] of Object.entries(specialCases)) {
      if (name.includes(key) || symbol.includes(key)) {
        specialMatch = variations.some(variation => 
          content.includes(variation)
        );
        if (specialMatch) break;
      }
    }
    
    // Prioritize name matches, then symbol matches
    return nameMatches || symbolMatches || specialMatch;
  }, []);

  // Filter curated tweets based on selected asset
  const filteredCuratedTweets = useMemo(() => {
    // Only log in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      console.log('🔍 Processing curated tweets:', {
        curatedTweetsCount: curatedTweets?.length || 0,
        selectedAsset: selectedAsset?.symbol || 'none'
      });
    }
    
    if (!curatedTweets || !selectedAsset) {
      return [];
    }
    
    const filtered = curatedTweets.filter(tweet => {
      // Handle different tweet structures from different sources
      const tweetContent = tweet.text || tweet.content || tweet.full_text || '';
      const isRelated = isAssetRelated(tweetContent, selectedAsset.name, selectedAsset.symbol);
      return isRelated;
    });

    if (isDev) {
      console.log(`📊 Filtered ${filtered.length} curated tweets for ${selectedAsset.symbol}`);
    }
    
    // Always process fresh curated tweets (don't rely only on cache)
    
    if (filtered.length > 0) {
      const newEliteTweets: Tweet[] = [];
      const seenHashes = new Set<string>(); // Track duplicates
      
      filtered.forEach((tweet: any, index: number) => {
        let actualTimestamp: number;
        
        // Handle different timestamp formats
        const tweetTime = tweet.timestamp || tweet.date || tweet.created_at || new Date().toISOString();
        if (tweetTime) {
          const tweetDate = new Date(tweetTime);
          actualTimestamp = isNaN(tweetDate.getTime()) ? Date.now() - (index * 60000) : tweetDate.getTime();
        } else {
          actualTimestamp = Date.now() - (index * 60000);
        }
        
        // Handle different user data structures
        const userData = tweet.raw_data?.user || tweet.user || tweet.author || {};
        
        const transformedTweet: Tweet = {
          sentiment: tweet.sentiment || 'neutral',
          avatar: tweet.avatar || userData.profileImageUrl || userData.profile_image_url || userData.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
          name: tweet.name || userData.displayname || userData.display_name || userData.name || tweet.author_name || 'Unknown',
          handle: tweet.handle || (userData.username ? `@${userData.username}` : (tweet.author_username ? `@${tweet.author_username}` : '@unknown')),
          timestamp: tweet.timestamp || userData.timestamp || formatRelativeTime(actualTimestamp),
          followers: tweet.followers ? `${(tweet.followers / 1000).toFixed(1)}K` : (userData.followersCount ? `${(userData.followersCount / 1000).toFixed(1)}K` : (userData.followers_count ? `${(userData.followers_count / 1000).toFixed(1)}K` : '0')),
          tweetUrl: tweet.tweetUrl || tweet.url || `https://twitter.com/${tweet.handle?.replace('@', '') || userData.username || 'unknown'}/status/${tweet.id || 'unknown'}`,
          text: tweet.text || tweet.content || tweet.full_text || '',
          rawTimestamp: actualTimestamp,
          id: `elite-${tweet.handle?.replace('@', '') || userData.username || tweet.author_username || 'unknown'}-${actualTimestamp}-${index}`
        };
        
        // Create content hash for duplicate detection BEFORE checking
        const contentHash = createTweetHash(transformedTweet);
        
        // Check for duplicates AND other criteria before adding
        if (transformedTweet.text.length > 5 && 
            transformedTweet.name !== 'Unknown' && 
            !seenHashes.has(contentHash)) {
          
          newEliteTweets.push(transformedTweet);
          seenHashes.add(contentHash); // Add hash AFTER successful validation
          
          if (isDev) {
            console.log('✅ Added elite tweet:', {
              name: transformedTweet.name,
              handle: transformedTweet.handle
            });
          }
        } else {
          if (isDev) {
            console.log('❌ Skipped elite tweet:', {
              reason: transformedTweet.text.length <= 5 ? 'too short' : 
                      transformedTweet.name === 'Unknown' ? 'unknown author' : 'duplicate content'
            });
          }
        }
      });
      
      // Sort elite tweets by timestamp (newest first) - use timestamp parsing for accurate sorting
      newEliteTweets.sort((a, b) => {
        // Fallback to parsing timestamp strings
        const aSeconds = parseTimestampToSeconds(a.timestamp);
        const bSeconds = parseTimestampToSeconds(b.timestamp);
        
        // Smaller seconds = more recent, so reverse order
        return aSeconds - bSeconds;
      });
      if (isDev) {
        console.log(`💫 Setting ${newEliteTweets.length} elite tweets for ${selectedAsset.symbol}`);
      }
      setEliteTweets(newEliteTweets);
      
      // Add elite tweets to the tweet map for expanded view support
      setTweetMap(prevMap => {
        // Clean up tweet map if it's getting too large
        let baseMap = prevMap;
        if (prevMap.size > MAX_TWEET_MAP_SIZE) {
          // Keep only recent tweets and clear old ones
          const recentTweets = Array.from(prevMap.values())
            .sort((a, b) => {
              // Fallback to parsing timestamp strings
              const aSeconds = parseTimestampToSeconds(a.timestamp);
              const bSeconds = parseTimestampToSeconds(b.timestamp);
              
              // Smaller seconds = more recent, so reverse order
              return aSeconds - bSeconds;
            })
            .slice(0, Math.floor(MAX_TWEET_MAP_SIZE / 2));
          baseMap = new Map(recentTweets.map(tweet => [tweet.id, tweet]));
        }
        
        // Add new elite tweets
        const newMap = new Map(baseMap);
        newEliteTweets.forEach(tweet => newMap.set(tweet.id, tweet));
        return newMap;
      });
    } else {
      setEliteTweets([]);
    }
    
    return filtered;
  }, [curatedTweets, selectedAsset, isAssetRelated, createTweetHash]);

  // Fetch logo for selected asset if it doesn't have one
  useEffect(() => {
    if (!selectedAsset?.symbol || selectedAsset.icon || loadingLogo) {
      return;
    }

    const fetchLogo = async () => {
      setLoadingLogo(true);
      try {
        // First try sentiment API
        const sentimentResponse = await fetch("/api/sentiments");
        if (sentimentResponse.ok) {
          const data = await sentimentResponse.json();
          const assetSentiMentScoreList = data.arrayMap;
          
          if (assetSentiMentScoreList && assetSentiMentScoreList[selectedAsset.symbol.toLowerCase()]) {
            const allAssets = assetSentiMentScoreList[selectedAsset.symbol.toLowerCase()];
            
            for (const asset of allAssets) {
              if (asset.name.toLowerCase() === selectedAsset.name.toLowerCase()) {
                if (asset.image) {
                  setLocalLogoCache(prev => ({ ...prev, [selectedAsset.symbol.toLowerCase()]: asset.image }));
                  return;
                }
              }
            }
          }
        }

        // Fallback to mindshare API
        const notFoundArr = [{
          id: selectedAsset.symbol,
          name: selectedAsset.name,
          symbol: selectedAsset.symbol,
          image: '',
          blockchain: selectedAsset.chain.toLowerCase(),
          address: '',
        }];
        
        const missingDataResponse = await fetch(`${API_BASE}/mindshare/addAsset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assets: notFoundArr }),
        });
        
        if (missingDataResponse.ok) {
          const missingData = await missingDataResponse.json();
          missingData.results.forEach((res: any) => {
            if (res.symbol.toLowerCase() === selectedAsset.symbol.toLowerCase() && res.image) {
              setLocalLogoCache(prev => ({ ...prev, [selectedAsset.symbol.toLowerCase()]: res.image }));
            }
          });
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      } finally {
        setLoadingLogo(false);
      }
    };

    fetchLogo();
  }, [selectedAsset?.symbol, selectedAsset?.name, selectedAsset?.icon, selectedAsset?.chain, API_BASE]);

  // Helper function to get the correct symbol for API calls
  const getApiSymbol = useCallback((symbol: string): string => {
    const lowerSymbol = symbol.toLowerCase();
    return SYMBOL_MAPPINGS[lowerSymbol] || lowerSymbol;
  }, []);

  // Fetch rank data when selectedAsset changes (background processing)
  useEffect(() => {
    if (!selectedAsset?.symbol) {
      setRank(null);
      setRankRetryCount(0);
      return;
    }

    const symbol = selectedAsset.symbol.toLowerCase();
    const apiSymbol = getApiSymbol(symbol);
    
    // Check if rank is already cached
    if (rankCache[symbol] !== undefined) {
      setRank(rankCache[symbol]);
      return;
    }

    // Fetch rank in background without blocking UI
    const fetchRank = async () => {
      try {
        const res = await fetch(`${API_BASE}/tokens/cmc/price?symbol=${apiSymbol}`);
        if (res.ok) {
          const data = await res.json();
          if (data.rank !== undefined && data.rank !== null) {
            setRank(data.rank);
            setRankCache(prev => ({ ...prev, [symbol]: data.rank }));
            setRankRetryCount(0);
          } else {
            throw new Error("No rank data available");
          }
        } else {
          throw new Error("Failed to fetch rank");
        }        
      } catch (error) {
        console.error("Rank fetch error:", error);
        setRank(null);
        setRankRetryCount((prev: number) => prev + 1);
      }
    };

    setTimeout(() => fetchRank(), 200);
  }, [selectedAsset?.symbol, API_BASE, rankCache, getApiSymbol]);

  // Retry logic for failed rank fetches (background processing)
  useEffect(() => {
    if (rankRetryCount > 0 && rankRetryCount <= 3 && selectedAsset?.symbol) {
      const retryTimeout = setTimeout(() => {
        const fetchRank = async () => {
          try {
            const symbol = selectedAsset.symbol.toLowerCase();
            const apiSymbol = getApiSymbol(symbol);
            const res = await fetch(`${API_BASE}/tokens/cmc/price?symbol=${apiSymbol}`);
            if (res.ok) {
              const data = await res.json();
              if (data.rank !== undefined && data.rank !== null) {
                setRank(data.rank);
                setRankCache(prev => ({ ...prev, [symbol]: data.rank }));
                setRankRetryCount(0);
              } else {
                throw new Error("No rank data available");
              }
            } else {
              throw new Error("Failed to fetch rank");
            }            
          } catch (error) {
            console.error("Retry rank fetch error:", error);
            setRank(null);
            if (rankRetryCount < 3) {
              setRankRetryCount((prev: number) => prev + 1);
            }
          }
        };

        fetchRank();
      }, 5000);

      return () => clearTimeout(retryTimeout);
    }
  }, [rankRetryCount, selectedAsset?.symbol, API_BASE, getApiSymbol]);

  // Fetch chart data when chart view is active or filter changes (background processing)

  useEffect(() => {
    if (showPriceChart && chartAsset?.symbol) {
      const fetchChartData = async () => {
        setLoadingChart(true);
        setChartError(null);
        // Clear both chart data types when starting a new fetch
        setChartData(null);
        setSentimentChartData(null);
        
        try {
          if (currentChartType === 'sentiment') {
            // Fetch sentiment data
            const res = await fetch(`${API_BASE}/tokens/sentiment-graph/${chartAsset.name.toLowerCase()}?days=${activeFilter.days}`);
            if (res.ok) {
              const data = await res.json();
              console.log('Sentiment data fetched:', data);
              if (data.data && Array.isArray(data.data) && data.data.length >= 3) {
                setSentimentChartData({ sentimentData: data.data });
              } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                throw new Error("Not enough data for "+chartAsset.name.toLowerCase());
              } else {
                throw new Error("No sentiment data available for this time period");
              }
            } else {
              if(res.status === 404){
                throw new Error("Not enough data for "+chartAsset.name.toLowerCase());
              }
              throw new Error("Failed to fetch sentiment data - data might not be available yet");
            }
            return;
          }
          
          const res = await fetch(`${API_BASE}/tokens/chart?symbol=${chartAsset.symbol}&days=${activeFilter.days}`);
          if (res.ok) {
            const data = await res.json();
            
            if (currentChartType === 'balance' && chartAsset.balance) {
              // Calculate balance value over time
              const balanceData = {
                prices: data.prices.map((item: { timestamp: number; price: number; date: string }) => ({
                  timestamp: item.timestamp,
                  price: item.price,
                  date: item.date,
                  balanceValue: item.price * chartAsset.balance
                })),
                market_caps: data.market_caps,
                total_volumes: data.total_volumes
              };
              setChartData(balanceData);
            } else {
              setChartData(data);
            }
          } else {
            throw new Error("Failed to fetch chart data");
          }
        } catch (error) {
          console.error("Error fetching chart data:", error);
          setChartError(
            typeof error === "object" && error !== null && "message" in error
              ? (error as { message?: string }).message || "Failed to load chart data"
              : "Failed to load chart data"
          );
        } finally {
          setLoadingChart(false);
        }
      };
      setTimeout(() => fetchChartData(), 100);
    }
  }, [showPriceChart, chartAsset?.symbol, chartAsset?.balance, API_BASE, activeFilter, currentChartType]);


  // Fetch tweets for selected asset with batch optimization
  // const fetchTweets = useCallback(async (assetName: string, chain?: string) => {
  //   if (!assetName) return;
    
  //   try {
  //     const batchSize = 5;
  //     const totalLimit = 10;
  //     const batches = Math.ceil(totalLimit / batchSize);
  //     const allTweets: Tweet[] = [];
      
  //     // Create chain-specific search queries
  //     const searchQueries = generateChainSpecificQueries(assetName, chain);
      
  //     for (const query of searchQueries) {
  //       for (let i = 0; i < batches; i++) {
  //         const currentLimit = Math.min(batchSize, totalLimit - (i * batchSize));
          
  //         const response = await fetch(`${API_BASE}/twitter/stream`, {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({ 
  //             query: query, 
  //             limit: currentLimit, 
  //             product: 'Latest',
  //             offset: i * batchSize 
  //           })
  //         });

  //         if (response.ok) {
  //           const data = await response.json();
  //           if (data.data && Array.isArray(data.data)) {
  //             const transformedTweets: Tweet[] = data.data.map((tweet: any) => ({
  //               sentiment: tweet.sentiment || 'neutral',
  //               avatar: tweet.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
  //               name: tweet.name || 'Unknown',
  //               handle: tweet.handle || '@unknown',
  //               timestamp: formatRelativeTime(tweet.timestamp || new Date()),
  //               followers: tweet.followers ? `${(tweet.followers / 1000).toFixed(1)}K` : '0',
  //               tweetUrl: tweet.tweetUrl || 'https://twitter.com',
  //               text: tweet.text || ''
  //             }));
              
  //             allTweets.push(...transformedTweets);
  //           }
  //         }
          
  //         if (i < batches - 1) {
  //           await new Promise(resolve => setTimeout(resolve, 500));
  //         }
  //       }
  //     }
      
  //     if (allTweets.length > 0) {
  //       setTweetQueue(prev => [...prev, ...allTweets]);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching tweets:', error);
  //   }
  // }, [API_BASE]);



  // Use selected asset data if available, otherwise show loading state
  const displayName = selectedAsset ? selectedAsset.name : "Loading...";
  const displaySymbol = selectedAsset ? selectedAsset.symbol : "";
  const displayPrice = selectedAsset ? selectedAsset.price : null;
  const displayChange = selectedAsset ? selectedAsset.priceChange : null;
  const displayLogo = selectedAsset?.icon || 
                     localLogoCache[selectedAsset?.symbol?.toLowerCase() || ''] || 
                     sharedLogoCache[selectedAsset?.symbol?.toLowerCase() || ''] || 
                     null;
  const displayRank = rank !== null ? `#${rank}` : null;

  // Get display tweets based on current mode
  const displayTweets = useMemo(() => {
    return isCurated ? eliteTweets : tweets;
  }, [tweets, eliteTweets, isCurated]);

  // Get expanded tweet data from map
  const expandedTweet = expandedTweetId ? tweetMap.get(expandedTweetId) : null;

  // Show loading indicator only when actively fetching
  const showTweetSkeleton = loadingTweets && displayTweets.length === 0;

  // Handle asset changes - load from cache or fetch new tweets
  useEffect(() => {
    if (selectedAsset?.name && selectedAsset?.symbol) {
      console.log(`🔄 Asset changed to: ${selectedAsset.symbol} (${selectedAsset.name})`);
      
      // Clear expanded state when switching assets
      setExpandedTweetId(null);
      
      // Try to load from cache first for instant display
      const cached = loadFromCache(selectedAsset);
      
      if (!cached) {
        console.log(`❌ No cache for ${selectedAsset.symbol}, fetching fresh tweets`);
        // Clear tweets and fetch new ones
        setTweets([]);
        setTweetMap(new Map());
        fetchTweets(selectedAsset.name, selectedAsset.symbol, selectedAsset.chain);
      }
    } else {
      console.log(`🧹 Clearing tweets - no asset selected`);
      setTweets([]);
      setTweetMap(new Map());
      setExpandedTweetId(null);
    }
  }, [selectedAsset?.name, selectedAsset?.symbol, selectedAsset?.chain, fetchTweets, loadFromCache]);

  // Auto-save tweets to cache whenever they change
  useEffect(() => {
    if (selectedAsset && tweets.length > 0) {
      // Debounce saves to avoid excessive caching
      const saveTimer = setTimeout(() => {
        saveToCache(selectedAsset, tweets);
      }, 500);
      
      return () => clearTimeout(saveTimer);
    }
  }, [selectedAsset, tweets, saveToCache]);

  // Background refresh for stale cache (every 10 minutes)
  useEffect(() => {
    if (!selectedAsset?.name || !selectedAsset?.symbol) return;

    const interval = setInterval(() => {
      const cacheKey = getCacheKey(selectedAsset);
      const cacheEntry = tweetCache[cacheKey];
      
      // Only refresh if cache is very stale (older than 10 minutes) or doesn't exist
      if (!cacheEntry || (Date.now() - cacheEntry.timestamp) > TWEET_CACHE_DURATION) {
        console.log(`🔄 Background refresh for ${selectedAsset.symbol} (stale cache)`);
        fetchTweets(selectedAsset.name, selectedAsset.symbol, selectedAsset.chain);
      }
    }, TWEET_CACHE_DURATION); // Every 10 minutes

    return () => clearInterval(interval);
  }, [selectedAsset?.name, selectedAsset?.symbol, selectedAsset?.chain, fetchTweets, getCacheKey, tweetCache, TWEET_CACHE_DURATION]);

  // Cleanup effect - periodic cleanup of cache and tweet map
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Clean up stale cache entries
      setTweetCache(prev => {
        const now = Date.now();
        const cleanedCache: typeof prev = {};
        
        Object.entries(prev).forEach(([key, entry]) => {
          if (now - entry.timestamp < TWEET_CACHE_DURATION * 2) { // Keep entries for 20 minutes max
            cleanedCache[key] = entry;
          }
        });
        
        return cleanedCache;
      });
      
      // Clean up tweet map if it's too large
      setTweetMap(prevMap => {
        if (prevMap.size <= MAX_TWEET_MAP_SIZE) return prevMap;
        
        const recentTweets = Array.from(prevMap.values())
          .sort((a, b) => {
            // Fallback to parsing timestamp strings
            const aSeconds = parseTimestampToSeconds(a.timestamp);
            const bSeconds = parseTimestampToSeconds(b.timestamp);
            
            // Smaller seconds = more recent, so reverse order
            return aSeconds - bSeconds;
          })
          .slice(0, MAX_TWEET_MAP_SIZE);
        
        return new Map(recentTweets.map(tweet => [tweet.id, tweet]));
      });
      
      // Clear expanded tweet if it's no longer in the map
      setExpandedTweetId(prev => {
        if (prev && !tweetMap.has(prev)) {
          return null;
        }
        return prev;
      });
      
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [TWEET_CACHE_DURATION, MAX_TWEET_MAP_SIZE, tweetMap]);

  // Show message if no wallets are connected
  if (connectedWallets === 0) {
    return (
      <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-x-auto">
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-500 italic text-base">Add a wallet to view asset details</span>
        </div>
      </div>
    );
  }
  
  // Show loading state if no asset is selected but wallets are connected
  if (!selectedAsset) {
    return (
      <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-x-auto">
        <div className="flex items-center justify-center h-full">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[500px] flex-1 overflow-hidden relative">
      {/* Main Content */}
      <div className={`transition-opacity duration-500 overflow-y-auto ${showPriceChart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Fixed Header Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-2 lg:gap-0">
          <div className="flex items-center gap-3">
            {displayLogo ? (
              <img src={displayLogo} alt={displaySymbol} width={32} height={32} className="rounded-full" />
            ) : loadingLogo ? (
              <div className="w-8 h-8 rounded-full bg-[#23262F] flex items-center justify-center">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            ) : (
              <span className="text-3xl">{displaySymbol ? displaySymbol[0] : "🟠"}</span>
            )}
            <div>
              <div className="text-white font-semibold text-base flex items-center gap-2">
                {displayName} <span className="text-xs text-[#A3A3A3] font-normal">{displaySymbol}</span>
                {displayRank && <span className="bg-[#23262F] text-xs px-2 py-0.5 rounded-full ml-2">{displayRank}</span>}
              </div>
            </div>
          </div>
          <button className="text-[#A3A3A3] cursor-pointer text-xs bg-[#23262F] px-3 py-1 rounded-lg mt-2 sm:mt-0" onClick={() => {}}>
            View Asset
          </button>
          {/* <button className="text-[#A3A3A3] cursor-pointer text-xs bg-[#23262F] px-3 py-1 rounded-lg mt-2 sm:mt-0" onClick={() => {}}>
            View Asset
          </button> */}
        </div>

        {/* Price and change */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-4">
          <div className="text-2xl font-bold text-white">
            {displayPrice !== null ? `$${displayPrice.toLocaleString(undefined, { maximumFractionDigits: 9 })}` : "N/A"}
          </div>
          <div className={
            displayChange !== null && displayChange >= 0
              ? "text-green-400 font-semibold text-sm"
              : "text-red-400 font-semibold text-sm"
          }>
            {displayChange !== null ? `${displayChange.toFixed(2)}% (24h) ${displayChange >= 0 ? "▲" : "▼"}` : "N/A"}
          </div>
        </div>

        {/* Social Sentiment */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[#A259FF] font-semibold">Social Sentiment</div>
            <div className="flex items-center gap-2">
              {/* Cache indicator with tweet count */}
              {selectedAsset && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${loadingTweets ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className={`text-xs ${loadingTweets ? 'text-yellow-400' : 'text-green-400'}`}>
                      {loadingTweets ? 'Fetching...' : `${displayTweets.length} tweets`}
                    </span>
                  </div>
                </div>
              )}
              {/* Live indicator */}
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              {/* Elite feed toggle */}
              <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isCurated ? 'text-white' : 'text-[#666]'
                }`}>Elite Feed</span>
                <button 
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none cursor-pointer ${
                    isCurated ? 'bg-[#A259FF] shadow-md shadow-[#A259FF]/30' : 'bg-[#444] hover:bg-[#555]'
                  }`}
                  onClick={() => setIsCurated(!isCurated)}
                >
                  <span 
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-all duration-300 ease-in-out ${
                      isCurated ? 'translate-x-4.5 shadow-sm' : 'translate-x-0.5 shadow-sm'
                    }`}
                  />
                  {isCurated && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#A259FF]/25 to-[#A259FF]/15 animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {showTweetSkeleton ? (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {Array.from({ length: 3 }).map((_, idx) => (
                <TweetSkeleton key={`skeleton-${idx}`} />
              ))}
            </div>
          ) : displayTweets.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <span className="text-gray-500 text-sm">
                  {isCurated 
                    ? `No curated tweets found for ${selectedAsset?.name || 'this asset'}` 
                    : "No tweets available for this asset yet"
                  }
                </span>
                {isCurated && filteredCuratedTweets.length === 0 && curatedTweets && curatedTweets.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Try toggling off "Elite Feed" to see live tweets
                  </div>
                )}
              </div>
            </div>
          ) : expandedTweet ? (
            // Expanded tweet view
            <div
              className="relative bg-[#181A20] rounded-xl px-5 py-5 flex flex-col items-start min-h-[180px] max-h-80 overflow-y-auto cursor-pointer"
              onClick={() => setExpandedTweetId(null)}
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <img src={expandedTweet.avatar} alt={expandedTweet.name} width={48} height={48} className="rounded-full object-cover" />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {sentimentIcon(expandedTweet.sentiment)}
                      <span className="font-semibold text-sm text-[#A259FF] truncate">{expandedTweet.name}</span>
                      <span className="text-[#A3A3A3] text-sm truncate">{expandedTweet.handle}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[#A3A3A3] text-sm">{expandedTweet.timestamp}</span>
                      <a
                        href={expandedTweet.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A259FF] flex items-center"
                        title="View Tweet"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  </div>
                  <span className="text-[#A3A3A3] text-sm mt-0.5">{expandedTweet.followers} followers</span>
                </div>
              </div>
              <div className="text-sm text-white mt-2 whitespace-pre-line break-words" style={{ lineHeight: "1.6" }}>
                {expandedTweet.text}
              </div>
            </div>
          ) : (
            // Tweet list view
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {displayTweets.map((tweet: Tweet) => (
                <div
                  key={tweet.id}
                  className="flex items-start gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 border border-transparent bg-[rgba(36,37,42,0.25)] hover:bg-[rgba(50,52,60,0.95)]"
                  style={{ minHeight: 80, maxHeight: 80, overflow: "hidden" }}
                  onClick={() => setExpandedTweetId(tweet.id)}
                >
                  <img src={tweet.avatar} alt={tweet.name} width={40} height={40} className="rounded-full object-cover mt-1" />
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {sentimentIcon(tweet.sentiment)}
                        <span className="font-semibold text-sm text-white truncate">{tweet.name}</span>
                        <span className="text-[#A3A3A3] text-sm truncate">{tweet.handle}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[#A3A3A3] text-sm">{tweet.timestamp}</span>
                        <a
                          href={tweet.tweetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#A259FF] flex items-center"
                          title="View Tweet"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <ExternalLinkIcon />
                        </a>
                      </div>
                    </div>
                    <div className={`text-sm text-[#E0E0E0] mt-1 truncate`} style={{ lineHeight: "1.4" }}>
                      {tweet.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Chart View */}
      <div className={`absolute inset-0 transition-opacity duration-500 overflow-hidden ${showPriceChart ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Chart Container */}
        <div className="h-full flex flex-col overflow-hidden">
          {loadingChart ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : chartError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-400 text-base font-semibold mb-2">{chartError.toLowerCase().includes("not enough data") ? "Not Enough Data" : "Chart Error"}</div>
                <div className="text-[#666] text-sm">{chartError}</div>
              </div>
            </div>
          ) : (chartData && chartAsset) || (sentimentChartData && chartAsset) ? (
            <div className="h-full p-2 sm:p-4 relative overflow-hidden">
              {/* Chart Filter Tabs */}
              {currentChartType !== 'sentiment' && <div className="flex gap-1 sm:gap-2 mb-4 justify-end">
                {CHART_FILTERS.map((filter) => (
                  <button
                    key={filter.label}
                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded text-xs sm:text-xs font-semibold transition-colors ${activeFilter.label === filter.label ? 'bg-[#A259FF] text-white' : 'bg-[#23262F] text-[#A3A3A3] hover:bg-[#333]'}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>}
              <div className="h-full overflow-hidden">
                {((currentChartType === 'sentiment' && sentimentChartData?.sentimentData && sentimentChartData.sentimentData.length >= 3) ||
                  (currentChartType !== 'sentiment' && chartData?.prices && chartData.prices.length > 0)) ? (
                  currentChartType === 'sentiment' && sentimentChartData ? (
                    <div className="flex flex-col h-full">
                      <h2 className="text-white text-lg font-bold mb-6 text-center">Historical Sentiment Score of {chartAsset.name}</h2>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
                          {/* Historical sentiment cards */}
                          {(() => {
                            // Helper function to get color based on sentiment score (0-100)
                            const getSentimentColor = (sentiment: number): string => {
                              if (sentiment >= 70) {
                                const ratio = (sentiment - 70) / 30;
                                const red = Math.round(255 * (1 - ratio >= 0.2 ? ratio : ratio + 0.2));
                                const green = 255;
                                const blue = 0;
                                return `rgb(${red}, ${green}, ${blue})`;
                              } else if (sentiment >= 50) {
                                const ratio = (sentiment - 50) / 20;
                                const red = 255;
                                const green = Math.round(128 + (127 * ratio));
                                const blue = 0;
                                return `rgb(${red}, ${green}, ${blue})`;
                              } else {
                                const ratio = sentiment / 30;
                                const red = 255;
                                const green = Math.round(64 * ratio);
                                const blue = 0;
                                return `rgb(${red}, ${green}, ${blue})`;
                              }
                            };

                            // Get sentiment data for different time periods
                            const today = new Date();
                            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                            const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

                            // Find closest sentiment data for each period
                            const findClosestSentiment = (targetDate: Date) => {
                              const targetTime = targetDate.getTime();
                              let closest = sentimentChartData.sentimentData[0];
                              let minDiff = Math.abs(new Date(closest.date).getTime() - targetTime);
                              
                              sentimentChartData.sentimentData.forEach(item => {
                                const diff = Math.abs(new Date(item.date).getTime() - targetTime);
                                if (diff < minDiff) {
                                  minDiff = diff;
                                  closest = item;
                                }
                              });
                              
                              return closest.sentimentScore;
                            };

                            const historicalData = [
                              {
                                label: 'Yesterday',
                                sentiment: findClosestSentiment(yesterday),
                                status: 'Greed'
                              },
                              {
                                label: '7d ago', 
                                sentiment: findClosestSentiment(sevenDaysAgo),
                                status: 'Greed'
                              },
                              {
                                label: '1m ago',
                                sentiment: findClosestSentiment(oneMonthAgo), 
                                status: 'Greed'
                              }
                            ];

                            return historicalData.map((data, index) => (
                              <div key={index} className="bg-[#1A1D24] rounded-xl p-4 border border-[#23272b] flex flex-col items-center text-center">
                                <div className="text-white text-sm font-semibold mb-2">{data.label}</div>
                                <div className="text-[#A3A3A3] text-xs mb-4">{data.status}</div>
                                
                                {/* Circular Progress */}
                                <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                                  <svg className="absolute top-0 left-0" width="80" height="80">
                                    <circle cx="40" cy="40" r="36" stroke="#23262F" strokeWidth="6" fill="none" />
                                    <circle
                                      cx="40"
                                      cy="40"
                                      r="36"
                                      stroke={getSentimentColor(data.sentiment)}
                                      strokeWidth="6"
                                      fill="none"
                                      strokeDasharray={226}
                                      strokeDashoffset={226 - (data.sentiment/100) * 226}
                                      strokeLinecap="round"
                                      transform="rotate(-90 40 40)"
                                    />
                                  </svg>
                                  <span className="text-white text-lg font-bold z-10">{Math.round(data.sentiment)}</span>
                                </div>
                                
                                <div className="w-4 h-4 rounded-full bg-[#23262F] opacity-50"></div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : chartData ? (
                    <Chart
                      options={{
                        chart: {
                          type: 'area',
                          background: 'transparent',
                          toolbar: {
                            show: true,
                            tools: {
                              download: false,
                              selection: true,
                              zoom: true,
                              zoomin: true,
                              zoomout: true,
                              pan: true,
                              reset: true
                            },
                            autoSelected: 'zoom'
                          },
                          zoom: {
                            enabled: true,
                            type: 'x',
                            autoScaleYaxis: true
                          },
                          pan: {
                            enabled: true,
                            type: 'x'
                          },
                          animations: {
                            enabled: true,
                            speed: 800
                          },
                          height: '100%'
                        },
                        dataLabels: {
                          enabled: false
                        },
                        series: [
                          {
                            name: currentChartType === 'price' ? 'Price' : 'Balance Value',
                            data: chartData.prices.map((item: { timestamp: number; price: number; balanceValue?: number }) => [
                              item.timestamp, 
                              item.balanceValue !== undefined ? item.balanceValue : item.price
                            ])
                          }
                        ],
                        xaxis: {
                          type: 'datetime',
                          labels: {
                            show: true,
                            style: {
                              colors: '#A3A3A3',
                              fontSize: '10px'
                            },
                            datetimeFormatter: {
                              year: 'yyyy',
                              month: 'MMM \'yy',
                              day: 'dd MMM',
                              hour: 'HH:mm'
                            }
                          },
                          axisBorder: {
                            color: '#23262F'
                          },
                          axisTicks: {
                            color: '#23262F'
                          }
                        },
                        yaxis: {
                          title: {
                            text: currentChartType === 'price' ? 'Price (USD)' : 'Value (USD)',
                            style: {
                              color: '#A3A3A3'
                            }
                          },
                          labels: {
                            style: {
                              colors: '#A3A3A3',
                              fontSize: '10px'
                            },
                            formatter: function(val: number) {
                              return '$' + val.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            }
                          }
                        },
                        stroke: {
                          curve: 'smooth',
                          width: 2,
                          colors: ['#A259FF']
                        },
                        fill: {
                          type: 'gradient',
                          gradient: {
                            shadeIntensity: 1,
                            opacityFrom: 0.3,
                            opacityTo: 0.1,
                            stops: [0, 100],
                            colorStops: [
                              {
                                offset: 0,
                                color: '#A259FF',
                                opacity: 0.3
                              },
                              {
                                offset: 100,
                                color: '#A259FF',
                                opacity: 0.1
                              }
                            ]
                          }
                        },
                        grid: {
                          borderColor: '#23262F',
                          strokeDashArray: 3
                        },
                        theme: {
                          mode: 'dark'
                        },
                        tooltip: {
                          enabled: true,
                          theme: 'dark',
                          style: {
                            fontSize: '12px'
                          },
                          x: {
                            format: 'dd MMM yyyy HH:mm'
                          },
                          y: {
                            formatter: function(val: number) {
                              return '$' + val.toLocaleString(undefined, { maximumFractionDigits: 4 });
                            }
                          }
                        }
                      }}
                      series={[
                        {
                          name: currentChartType === 'price' ? 'Price' : 'Balance Value',
                          data: chartData.prices.map((item: { timestamp: number; price: number; balanceValue?: number }) => [
                            item.timestamp, 
                            currentChartType === 'price' ? item.price : item.balanceValue
                          ])
                        }
                      ]}
                      type="area"
                      height="100%"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-[#A259FF] text-base font-semibold mb-2">No Chart Data</div>
                        <div className="text-[#666] text-sm">Unable to load {currentChartType} data for this asset</div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-[#666] text-sm">No chart data available</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

Display.displayName = "Display";

export default Display;