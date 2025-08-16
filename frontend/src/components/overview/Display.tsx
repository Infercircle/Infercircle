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

interface Tweet {
  sentiment: string;
  avatar: string;
  name: string;
  handle: string;
  timestamp: string;
  followers: string;
  tweetUrl: string;
  text: string;
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

interface DisplayProps {
  selectedAsset?: SelectedAsset | null;
  showPriceChart?: boolean;
  chartAsset?: SelectedAsset | null;
  onCloseChart?: () => void;
  chartType?: 'price' | 'balance';
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

const Display: React.FC<DisplayProps> = React.memo(({ 
  selectedAsset, 
  showPriceChart = false, 
  chartAsset, 
  chartType = 'price' as const, 
  connectedWallets = 0, 
  sharedLogoCache = {}, 
  curatedTweets = [] 
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [rankRetryCount, setRankRetryCount] = useState(0);
  const [rankCache, setRankCache] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentChartType, setCurrentChartType] = useState<'price' | 'balance'>(chartType as 'price' | 'balance');
  const [localLogoCache, setLocalLogoCache] = useState<Record<string, string>>({});
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [tweetBuffer, setTweetBuffer] = useState<Tweet[]>([]);
  const [newTweetIndex, setNewTweetIndex] = useState<number | null>(null);
  const [tweetQueue, setTweetQueue] = useState<Tweet[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeFilter, setActiveFilter] = useState(CHART_FILTERS[5]);
  const [isCurated, setIsCurated] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";



  // Update currentChartType when chartType prop changes
  useEffect(() => {
    setCurrentChartType(chartType as 'price' | 'balance');
  }, [chartType]);

  // Helper function to generate chain-specific search queries
  const generateChainSpecificQueries = useCallback((assetName: string, chain?: string) => {
    const queries = [assetName]; // Always include the base asset name
    
    if (!chain) return queries;
    
    const chainLower = chain.toLowerCase();
    
    // Chain-specific query variations
    const chainQueries: Record<string, string[]> = {
      'ethereum': [`${assetName} ETH`, `${assetName} Ethereum`, `${assetName} on Ethereum`],
      'base': [`${assetName} Base`, `${assetName} on Base`, `${assetName} L2`],
      'polygon': [`${assetName} Polygon`, `${assetName} on Polygon`, `${assetName} MATIC`],
      'arbitrum': [`${assetName} Arbitrum`, `${assetName} on Arbitrum`, `${assetName} ARB`],
      'optimism': [`${assetName} Optimism`, `${assetName} on Optimism`, `${assetName} OP`],
      'bsc': [`${assetName} BSC`, `${assetName} on BSC`, `${assetName} Binance`],
      'avalanche': [`${assetName} Avalanche`, `${assetName} on Avalanche`, `${assetName} AVAX`],
      'solana': [`${assetName} Solana`, `${assetName} on Solana`, `${assetName} SOL`],
      'cardano': [`${assetName} Cardano`, `${assetName} on Cardano`, `${assetName} ADA`],
      'polkadot': [`${assetName} Polkadot`, `${assetName} on Polkadot`, `${assetName} DOT`]
    };
    
    // Add chain-specific queries if available
    if (chainQueries[chainLower]) {
      queries.push(...chainQueries[chainLower]);
    }
    
    return queries;
  }, []);

  // Enhanced asset filtering with chain awareness
  const isAssetRelated = useCallback((tweetContent: string, assetName: string, assetSymbol: string, chain?: string) => {
    if (!tweetContent || !assetName || !assetSymbol) return false;
    
    const content = tweetContent.toLowerCase();
    const name = assetName.toLowerCase();
    const symbol = assetSymbol.toLowerCase();
    const chainLower = chain?.toLowerCase();
    
    // Primary: Check for exact name matches (most precise)
    const nameMatches = content.includes(name);
    
    // Secondary: Check for symbol matches with $ prefix (common crypto format)
    const symbolMatches = content.includes(`$${symbol}`);
    
    // Chain-specific matching
    let chainMatches = false;
    if (chainLower) {
      const chainKeywords: Record<string, string[]> = {
        'ethereum': ['ethereum', 'eth', 'mainnet'],
        'base': ['base', 'coinbase', 'l2'],
        'polygon': ['polygon', 'matic'],
        'arbitrum': ['arbitrum', 'arb'],
        'optimism': ['optimism', 'op'],
        'bsc': ['bsc', 'binance', 'bnb'],
        'avalanche': ['avalanche', 'avax'],
        'solana': ['solana', 'sol'],
        'cardano': ['cardano', 'ada'],
        'polkadot': ['polkadot', 'dot']
      };
      
      if (chainKeywords[chainLower]) {
        chainMatches = chainKeywords[chainLower].some(keyword => 
          content.includes(keyword)
        );
      }
    }
    
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
    
    // Prioritize name matches, then chain-specific matches, then symbol matches
    return nameMatches || (chainMatches && (specialMatch || symbolMatches)) || specialMatch || symbolMatches;
  }, []);

  // Filter curated tweets based on selected asset (updated to include chain)
  const filteredCuratedTweets = useMemo(() => {
    if (!curatedTweets || !selectedAsset) return [];
    
    return curatedTweets.filter(tweet => {
      const tweetContent = tweet.content || tweet.text || '';
      return isAssetRelated(tweetContent, selectedAsset.name, selectedAsset.symbol, selectedAsset.chain);
    });
  }, [curatedTweets, selectedAsset, isAssetRelated]);

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
        try {
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
          setChartError("Failed to load chart data");
        } finally {
          setLoadingChart(false);
        }
      };
      setTimeout(() => fetchChartData(), 100);
    }
  }, [showPriceChart, chartAsset?.symbol, chartAsset?.balance, API_BASE, activeFilter, currentChartType]);

  // Fetch tweets for selected asset with batch optimization
  const fetchTweets = useCallback(async (assetName: string, chain?: string) => {
    if (!assetName) return;
    
    try {
      const batchSize = 5;
      const totalLimit = 10;
      const batches = Math.ceil(totalLimit / batchSize);
      const allTweets: Tweet[] = [];
      
      // Create chain-specific search queries
      const searchQueries = generateChainSpecificQueries(assetName, chain);
      
      for (const query of searchQueries) {
        for (let i = 0; i < batches; i++) {
          const currentLimit = Math.min(batchSize, totalLimit - (i * batchSize));
          
          const response = await fetch(`${API_BASE}/twitter/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: query, 
              limit: currentLimit, 
              product: 'Latest',
              offset: i * batchSize 
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
              const transformedTweets: Tweet[] = data.data.map((tweet: any) => ({
                sentiment: tweet.sentiment || 'neutral',
                avatar: tweet.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
                name: tweet.name || 'Unknown',
                handle: tweet.handle || '@unknown',
                timestamp: formatRelativeTime(tweet.timestamp || new Date()),
                followers: tweet.followers ? `${(tweet.followers / 1000).toFixed(1)}K` : '0',
                tweetUrl: tweet.tweetUrl || 'https://twitter.com',
                text: tweet.text || ''
              }));
              
              allTweets.push(...transformedTweets);
            }
          }
          
          if (i < batches - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (allTweets.length > 0) {
        setTweetQueue(prev => [...prev, ...allTweets]);
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
    }
  }, [API_BASE]);

  // Animate tweets from queue to display
  useEffect(() => {
    if (tweetQueue.length > 0 && !isAnimating && expandedIndex === null) {
      setIsAnimating(true);
      const newTweet = tweetQueue[0];
      
      setTweets(prev => [newTweet, ...prev.slice(0, 19)]);
      setNewTweetIndex(0);
      
      setTweetQueue(prev => prev.slice(1));
      
      setTimeout(() => {
        setNewTweetIndex(null);
        setIsAnimating(false);
      }, 5000);
    }
  }, [tweetQueue, isAnimating, expandedIndex]);

  // Fetch tweets when selected asset changes
  useEffect(() => {
    if (selectedAsset?.name) {
      setTweets([]);
      setTweetQueue([]);
      setTweetBuffer([]);
      setTimeout(() => fetchTweets(selectedAsset.name, selectedAsset.chain), 100);
    } else {
      setTweets([]);
      setTweetQueue([]);
      setTweetBuffer([]);
    }
  }, [selectedAsset?.name, selectedAsset?.chain, fetchTweets]);

  // Poll for new tweets every 60 seconds when an asset is selected
  useEffect(() => {
    if (!selectedAsset?.name) return;

    const interval = setInterval(() => {
      fetchTweets(selectedAsset.name, selectedAsset.chain);
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedAsset?.name, selectedAsset?.chain, fetchTweets]);

  // Handle expanded state - buffer new tweets
  useEffect(() => {
    if (expandedIndex !== null && tweetQueue.length > 0) {
      setTweetBuffer(prev => [...tweetQueue, ...prev].slice(0, 20));
      setTweetQueue([]);
    }
  }, [expandedIndex, tweetQueue]);

  // When expandedIndex goes from not-null to null, flush buffer
  useEffect(() => {
    if (expandedIndex === null && tweetBuffer.length > 0) {
      setTweets(prev => [
        ...tweetBuffer,
        ...prev.slice(0, 20 - tweetBuffer.length)
      ]);
      setNewTweetIndex(tweetBuffer.length - 1);
      setTimeout(() => setNewTweetIndex(null), 1200);
      setTweetBuffer([]);
    }
  }, [expandedIndex, tweetBuffer]);

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

  // Memoized tweets to display based on elite filter with asset filtering
  const displayTweets = useMemo(() => {
    if (isCurated && filteredCuratedTweets && filteredCuratedTweets.length > 0) {
      // Transform filteredCuratedTweets to match Tweet interface
      const transformedTweets = filteredCuratedTweets.map((tweet: any) => ({
        sentiment: tweet.sentiment || 'neutral',
        avatar: tweet.raw_data?.user?.profileImageUrl || 'https://randomuser.me/api/portraits/men/1.jpg',
        name: tweet.raw_data?.user?.displayname || 'Unknown',
        handle: tweet.raw_data?.user?.username ? `@${tweet.raw_data.user.username}` : '@unknown',
        timestamp: formatRelativeTime(tweet.timestamp || tweet.date || new Date()),
        followers: tweet.raw_data?.user?.followersCount ? `${(tweet.raw_data.user.followersCount / 1000).toFixed(1)}K` : '0',
        tweetUrl: tweet.url || 'https://twitter.com',
        text: tweet.content || tweet.text || ''
      }));
      
      // Shuffle the tweets for better variety using Fisher-Yates algorithm
      const shuffledTweets = [...transformedTweets];
      for (let i = shuffledTweets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTweets[i], shuffledTweets[j]] = [shuffledTweets[j], shuffledTweets[i]];
      }
      
      return shuffledTweets;
    }
    return tweets;
  }, [isCurated, filteredCuratedTweets, tweets]);

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
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-hidden relative">
      {/* Main Content */}
      <div className={`transition-opacity duration-500 overflow-y-auto ${showPriceChart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
        </div>

        {/* Price and change */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-4">
          <div className="text-2xl font-bold text-white">
            {displayPrice !== null ? `$${displayPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "N/A"}
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
              {/* Live indicator */}
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              {/* Filter dropdown */}
              <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isCurated 
                    ? 'text-white' 
                    : 'text-[#666]'
                }`}>Elite Feed</span>
                <button 
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none cursor-pointer ${
                    isCurated 
                      ? 'bg-[#A259FF] shadow-md shadow-[#A259FF]/30' 
                      : 'bg-[#444] hover:bg-[#555]'
                  }`}
                  onClick={() => setIsCurated(!isCurated)}
                >
                  <span 
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-all duration-300 ease-in-out ${
                      isCurated 
                        ? 'translate-x-4.5 shadow-sm' 
                        : 'translate-x-0.5 shadow-sm'
                    }`}
                  />
                  {/* Glow effect when active */}
                  {isCurated && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#A259FF]/25 to-[#A259FF]/15 animate-pulse" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {displayTweets.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <span className="text-gray-500 text-sm">
                  {isCurated 
                    ? `No curated tweets found for ${selectedAsset?.name || 'this asset'}` 
                    : "No tweets available for this asset"
                  }
                </span>
                {isCurated && filteredCuratedTweets.length === 0 && curatedTweets && curatedTweets.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Try toggling off "Elite Feed" to see live tweets
                  </div>
                )}
              </div>
            </div>
          ) : expandedIndex === null ? (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {displayTweets.map((tweet, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 border border-transparent bg-[rgba(36,37,42,0.25)] hover:bg-[rgba(50,52,60,0.95)]${expandedIndex === idx ? " shadow-lg" : ""} ${idx === newTweetIndex ? "animate-slideInFromTop" : ""}`}
                  style={{ minHeight: 80, maxHeight: 80, overflow: "hidden" }}
                  onClick={() => setExpandedIndex(idx)}
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
          ) : (
            <div
              className="relative bg-[#181A20] rounded-xl px-5 py-5 flex flex-col items-start min-h-[180px] max-h-80 overflow-y-auto cursor-pointer"
              onClick={() => setExpandedIndex(null)}
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <img src={displayTweets[expandedIndex].avatar} alt={displayTweets[expandedIndex].name} width={48} height={48} className="rounded-full object-cover" />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {sentimentIcon(displayTweets[expandedIndex].sentiment)}
                      <span className="font-semibold text-sm text-[#A259FF] truncate">{displayTweets[expandedIndex].name}</span>
                      <span className="text-[#A3A3A3] text-sm truncate">{displayTweets[expandedIndex].handle}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-[#A3A3A3] text-sm">{displayTweets[expandedIndex].timestamp}</span>
                      <a
                        href={displayTweets[expandedIndex].tweetUrl}
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
                  <span className="text-[#A3A3A3] text-sm mt-0.5">{displayTweets[expandedIndex].followers} followers</span>
                </div>
              </div>
              <div className="text-sm text-white mt-2 whitespace-pre-line break-words" style={{ lineHeight: "1.6" }}>
                {displayTweets[expandedIndex].text}
              </div>
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
                <div className="text-red-400 text-base font-semibold mb-2">Chart Error</div>
                <div className="text-[#666] text-sm">{chartError}</div>
              </div>
            </div>
          ) : chartData && chartAsset ? (
            <div className="h-full p-2 sm:p-4 relative overflow-hidden">
              {/* Chart Filter Tabs */}
              <div className="flex gap-1 sm:gap-2 mb-4 justify-end">
                {CHART_FILTERS.map((filter) => (
                  <button
                    key={filter.label}
                    className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded text-xs sm:text-xs font-semibold transition-colors ${activeFilter.label === filter.label ? 'bg-[#A259FF] text-white' : 'bg-[#23262F] text-[#A3A3A3] hover:bg-[#333]'}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="h-full overflow-hidden">
                {typeof window !== 'undefined' && chartData.prices.length > 0 ? (
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
                          autoSelected: 'zoom',
                          export: {
                            csv: {
                              filename: `${chartAsset?.symbol || 'chart'}_data`,
                              columnDelimiter: ',',
                              headerCategory: 'Date',
                              headerValue: 'Price'
                            }
                          }
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
                        height: '100%',
                        events: {
                          zoomed: function(chartContext: any, { xaxis }: any) {
                            // Chart zoomed event
                          },
                          selection: function(chartContext: any, { xaxis }: any) {
                            // Chart selection event
                          },
                          resetZoom: function() {
                            // Chart reset event
                          }
                        }
                      },
                      series: [
                        {
                          name: currentChartType === 'price' ? 'Price' : 'Balance Value',
                          data: chartData.prices.map((item: { timestamp: number; price: number; balanceValue?: number }) => [
                            item.timestamp, 
                            currentChartType === 'price' ? item.price : item.balanceValue
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
                        },
                        range: undefined,
                        min: undefined,
                        max: undefined
                      },
                      yaxis: [
                        {
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
                            formatter: (value: number) => `${value.toLocaleString()}`
                          },
                          axisBorder: {
                            color: '#23262F'
                          }
                        }
                      ],
                      colors: ['#22c55e'],
                      fill: {
                        type: 'gradient',
                        gradient: {
                          shadeIntensity: 1,
                          opacityFrom: 0.15,
                          opacityTo: 0.02,
                          stops: [0, 100],
                          colorStops: [
                            {
                              offset: 0,
                              color: '#22c55e',
                              opacity: 0.15
                            },
                            {
                              offset: 100,
                              color: '#22c55e',
                              opacity: 0.02
                            }
                          ]
                        }
                      },
                      stroke: {
                        curve: 'smooth',
                        width: 2
                      },
                      grid: {
                        borderColor: '#23262F',
                        strokeDashArray: 5
                      },
                      tooltip: {
                        theme: 'dark',
                        x: {
                          format: 'dd MMM yyyy HH:mm'
                        },
                        y: {
                          formatter: (value: number) => `${value.toLocaleString()}`
                        }
                      },
                      legend: {
                        show: false
                      },
                      dataLabels: {
                        enabled: false
                      },
                      selection: {
                        enabled: true,
                        type: 'x',
                        xaxis: {
                          min: undefined,
                          max: undefined
                        }
                      },
                      brush: {
                        enabled: true,
                        target: 'chart'
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
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-[#A259FF] text-base font-semibold mb-2">No Chart Data</div>
                      <div className="text-[#666] text-sm">Unable to load price data for this asset</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-[#A259FF] text-base font-semibold mb-2">Price Chart</div>
                <div className="text-[#666] text-sm">
                  Chart area - ready for integration
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Display.displayName = "Display";

export default Display;