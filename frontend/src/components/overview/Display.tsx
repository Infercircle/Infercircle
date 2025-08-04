"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Tippy from '@tippyjs/react';

// Import ApexCharts with proper typing and dynamic loading
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><span className="text-purple-400 animate-pulse text-5xl">.....</span></div>
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

interface AddressDistribution {
  less_0001: number;
  "0001_001": number;
  "001_01": number;
  "01_1": number;
  "1_10": number;
  "10_100": number;
  "100_1k": number;
  "1k_10k": number;
  "10k_100k": number;
  above_100k: number;
}

interface WhaleDistribution {
  "1k_10k": number;
  "10k_100k": number;
  above_100k: number;
}

const MOCK_TWEETS: Tweet[] = [
  {
    sentiment: "negative",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    name: "InvestAnswers",
    handle: "@invest_answers",
    timestamp: "1m",
    followers: "3.39K",
    tweetUrl: "https://twitter.com/invest_answers/status/1",
    text: "🚨 How the Bitcoin Cycle Died 🚨💱 SOL Why the Crash? Old whales selling? 🏛️ Institutions buying 📈 Treasuries up 50% YTD ☀️ China's solar dominanc. Bitcoin Basics: Learn the Wyckoff patterns and the 50% pullbacks in a bull market. The Wyckoff Spring was April 6th. Each push up as global liquidity is Bitcoin Basics: Learn the Wyckoff patterns and the 50% pullbacks in a bull market. The Wyckoff Spring was April 6th. Each push up as global liquidity isBitcoin Basics: Learn the Wyckoff patterns and the 50% pullbacks in a bull market. The Wyckoff Spring was April 6th. Each push up as global liquidity isBitcoin Basics: Learn the Wyckoff patterns and the 50% pullbacks in a bull market. The Wyckoff Spring was April 6th. Each push up as global liquidity is"
  },
  {
    sentiment: "negative",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "Myles Snider",
    handle: "@myles_snider",
    timestamp: "2m",
    followers: "2.1K",
    tweetUrl: "https://twitter.com/myles_snider/status/2",
    text: "As @_drewarmstrong_ likes to say, this is currently the most mispriced risk in the world. BTC-backed loans are over-collateralized with a pristine asset"
  },
  {
    sentiment: "positive",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    name: "MartyParty",
    handle: "@martypartymusic",
    timestamp: "2m",
    followers: "5.2K",
    tweetUrl: "https://twitter.com/martypartymusic/status/3",
    text: "Bitcoin Basics: Learn the Wyckoff patterns and the 50% pullbacks in a bull market. The Wyckoff Spring was April 6th. Each push up as global liquidity is"
  },
  {
    sentiment: "positive",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "TFTC",
    handle: "@TFTC21",
    timestamp: "3m",
    followers: "8.7K",
    tweetUrl: "https://twitter.com/TFTC21/status/4",
    text: "Strive CEO reveals plan to buy public companies trading below net cash. Then convert their treasuries into #Bitcoin. \"This is a multibillion-dollar\""
  },
  {
    sentiment: "positive",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "ilodi wow",
    handle: "@ilodiwow",
    timestamp: "4m",
    followers: "1.1K",
    tweetUrl: "https://twitter.com/ilodiwow/status/5",
    text: "The $PTB TGE and Portal to Bitcoin mainnet is SOOO around the corner, I literally can't wait anymore AAAA!!! When @PortaltoBitcoin open staking aswel"
  },
  {
    sentiment: "neutral",
    avatar: "https://randomuser.me/api/portraits/men/6.jpg",
    name: "Crypto Neutralist",
    handle: "@neutral_crypto",
    timestamp: "5m",
    followers: "4.2K",
    tweetUrl: "https://twitter.com/neutral_crypto/status/6",
    text: "Market is moving sideways. No major news or price action at the moment. Let's see how things develop."
  }
];

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
}

const CHART_FILTERS = [
  { label: '30M', days: '1', interval: 'minutely' }, // CoinGecko only supports minutely for 1 day
  { label: '1D', days: '1', interval: 'hourly' },
  { label: '1W', days: '7', interval: 'hourly' },
  { label: '1M', days: '30', interval: 'daily' },
  { label: '3M', days: '90', interval: 'daily' },
  { label: '1Y', days: '365', interval: 'daily' },
];

// Symbol mapping for tokens that have changed their symbols
const SYMBOL_MAPPINGS: Record<string, string> = {
  'matic': 'pol', // MATIC rebranded to POL
  'polygon': 'pol',
};

const Display: React.FC<DisplayProps> = ({ selectedAsset, showPriceChart = false, chartAsset, chartType = 'price' as const, connectedWallets = 0, sharedLogoCache = {} }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [rankRetryCount, setRankRetryCount] = useState(0);
  const [rankCache, setRankCache] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentChartType, setCurrentChartType] = useState<'price' | 'balance'>(chartType as 'price' | 'balance');
  const [addressDist] = useState<AddressDistribution>({
    less_0001: 0.1,
    "0001_001": 0.15,
    "001_01": 0.2,
    "01_1": 0.1,
    "1_10": 0.1,
    "10_100": 0.15,
    "100_1k": 0.1,
    "1k_10k": 0.05,
    "10k_100k": 0.03,
    above_100k: 0.02,
  });
  const [whaleDist] = useState<WhaleDistribution>({
    "1k_10k": 0.05,
    "10k_100k": 0.03,
    above_100k: 0.02,
  });
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [tweetBuffer, setTweetBuffer] = useState<Tweet[]>([]);
  const [newTweetIndex, setNewTweetIndex] = useState<number | null>(null);
  const [tweetQueue, setTweetQueue] = useState<Tweet[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeFilter, setActiveFilter] = useState(CHART_FILTERS[5]); // Default to 1Y

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  // Update currentChartType when chartType prop changes
  useEffect(() => {
    setCurrentChartType(chartType as 'price' | 'balance');
  }, [chartType]);

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
            setRankRetryCount(0); // Reset retry count on success
          } else {
            throw new Error("No rank data available");
          }
        } else {
          throw new Error("Failed to fetch rank");
        }        } catch (error) {
          console.error("Rank fetch error:", error);
          setRank(null);
          // Increment retry count for failed attempts
          setRankRetryCount((prev: number) => prev + 1);
        }
    };

    // Fetch rank in background with small delay
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
                setRankRetryCount(0); // Reset retry count on success
              } else {
                throw new Error("No rank data available");
              }
            } else {
              throw new Error("Failed to fetch rank");
            }            } catch (error) {
              console.error("Retry rank fetch error:", error);
              setRank(null);
              // Continue retrying if we haven't reached max attempts
              if (rankRetryCount < 3) {
                setRankRetryCount((prev: number) => prev + 1);
              }
            }
        };

        fetchRank();
      }, 5000); // Retry every 5 seconds

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
                  balanceValue: item.price * chartAsset.balance // Calculate total value of holdings
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
      // Fetch chart data in background with small delay
      setTimeout(() => fetchChartData(), 100);
    }
  }, [showPriceChart, chartAsset?.symbol, chartAsset?.balance, API_BASE, activeFilter, currentChartType]);

  // Fetch tweets for selected asset with batch optimization
  const fetchTweets = useCallback(async (symbol: string) => {
    if (!symbol) return;
    
    try {
      // Fetch tweets in batches of 5 for better performance
      const batchSize = 5;
      const totalLimit = 10;
      const batches = Math.ceil(totalLimit / batchSize);
      const allTweets: Tweet[] = [];
      
      for (let i = 0; i < batches; i++) {
        const currentLimit = Math.min(batchSize, totalLimit - (i * batchSize));
        
        const response = await fetch(`${API_BASE}/twitter/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: symbol, 
            limit: currentLimit, 
            product: 'Latest',
            offset: i * batchSize 
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            // Transform API response to match Tweet interface
            const transformedTweets: Tweet[] = data.data.map((tweet: any) => ({
              sentiment: tweet.sentiment || 'neutral',
              avatar: tweet.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
              name: tweet.name || 'Unknown',
              handle: tweet.handle || '@unknown',
              timestamp: tweet.timestamp || 'now',
              followers: tweet.followers ? `${(tweet.followers / 1000).toFixed(1)}K` : '0',
              tweetUrl: tweet.tweetUrl || 'https://twitter.com',
              text: tweet.text || ''
            }));
            
            allTweets.push(...transformedTweets);
          }
        }
        
        // Small delay between batches to be respectful to API
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Add all fetched tweets to queue
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
      
      // Add tweet to display
      setTweets(prev => [newTweet, ...prev.slice(0, 19)]);
      setNewTweetIndex(0);
      
      // Remove from queue
      setTweetQueue(prev => prev.slice(1));
      
      // Reset animation after 5 seconds (optimized for better UX)
      setTimeout(() => {
        setNewTweetIndex(null);
        setIsAnimating(false);
      }, 5000);
    }
  }, [tweetQueue, isAnimating, expandedIndex]);

  // Fetch tweets when selected asset changes
  useEffect(() => {
    if (selectedAsset?.symbol) {
      // Clear existing tweets and queue for new asset
      setTweets([]);
      setTweetQueue([]);
      setTweetBuffer([]);
      // Fetch tweets in background without blocking UI
      setTimeout(() => fetchTweets(selectedAsset.symbol), 100);
    } else {
      setTweets([]);
      setTweetQueue([]);
      setTweetBuffer([]);
    }
  }, [selectedAsset?.symbol, fetchTweets]);

  // Poll for new tweets every 60 seconds when an asset is selected (optimized)
  useEffect(() => {
    if (!selectedAsset?.symbol) return;

    const interval = setInterval(() => {
      fetchTweets(selectedAsset.symbol);
    }, 60000); // Poll every 60 seconds (optimized)

    return () => clearInterval(interval);
  }, [selectedAsset?.symbol, fetchTweets]);

  // Handle expanded state - buffer new tweets
  useEffect(() => {
    if (expandedIndex !== null && tweetQueue.length > 0) {
      // Buffer tweets when expanded
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
      setNewTweetIndex(tweetBuffer.length - 1); // Animate the last buffered tweet
      setTimeout(() => setNewTweetIndex(null), 1200);
      setTweetBuffer([]);
    }
  }, [expandedIndex, tweetBuffer]);

  // Helper for address bands
  const getBand = (band: keyof AddressDistribution) => {
    if (!addressDist) return 0;
    return (addressDist[band] ?? 0) * 100;
  };
  // Helper for whale bands
  const getWhale = (band: keyof WhaleDistribution) => {
    if (!whaleDist) return 0;
    return (whaleDist[band] ?? 0) * 100;
  };

  // Use selected asset data if available, otherwise show loading state
  const displayName = selectedAsset ? selectedAsset.name : "Loading...";
  const displaySymbol = selectedAsset ? selectedAsset.symbol : "";
  const displayPrice = selectedAsset ? selectedAsset.price : null;
  const displayChange = selectedAsset ? selectedAsset.priceChange : null;
  const displayLogo = selectedAsset?.icon || sharedLogoCache[selectedAsset?.symbol?.toLowerCase() || ''] || null;
  const displayRank = rank !== null ? `#${rank}` : null;

  // Show message if no wallets are connected
  if (connectedWallets === 0) {
    return (
      <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-x-auto">
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-500 italic text-base">Add a wallet to view asset details</span>
        </div>
      </div>
    );
  }
  
  // Show loading state if no asset is selected but wallets are connected
  if (!selectedAsset) {
    return (
      <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-x-auto">
        <div className="flex items-center justify-center h-full">
          <span className="text-purple-400 animate-pulse text-5xl">.....</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-hidden relative">
      {/* Main Content */}
      <div className={`transition-opacity duration-500 overflow-y-auto ${showPriceChart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-2 lg:gap-0">
        <div className="flex items-center gap-3">
            {displayLogo ? (
              <Image src={displayLogo} alt={displaySymbol} width={32} height={32} className="rounded-full" />
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
      {/* Holdings */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 bg-[#23262F] rounded-xl p-3 w-full">
          <div className="text-xs text-[#A3A3A3] mb-1">Addresses by Holdings</div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-[#A3A3A3]">$0 - $1k</span>
            <span className="text-[#A3A3A3]">$1k - $100k</span>
            <span className="text-[#A3A3A3]">$100k+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 bg-[#A259FF] rounded-full" style={{ width: `${getBand("less_0001") + getBand("0001_001") + getBand("001_01") + getBand("01_1") + getBand("1_10")}%`, minWidth: 10 }} />
            <div className="h-2 bg-[#F7931A] rounded-full" style={{ width: `${getBand("10_100") + getBand("100_1k")}%`, minWidth: 10 }} />
            <div className="h-2 bg-[#A3A3A3] rounded-full" style={{ width: `${getBand("1k_10k") + getBand("10k_100k") + getBand("above_100k")}%`, minWidth: 10 }} />
          </div>
          <div className="flex items-center gap-6 mt-1 text-xs text-white">
            <span>{(getBand("less_0001") + getBand("0001_001") + getBand("001_01") + getBand("01_1") + getBand("1_10")).toFixed(2)}%</span>
            <span>{(getBand("10_100") + getBand("100_1k")).toFixed(2)}%</span>
            <span>{(getBand("1k_10k") + getBand("10k_100k") + getBand("above_100k")).toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex-1 bg-[#23262F] rounded-xl p-3 w-full">
          <div className="text-xs text-[#A3A3A3] mb-1">Whale Holdings</div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-[#A3A3A3]">Whales</span>
            <span className="text-[#A3A3A3]">Others</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 bg-[#A259FF] rounded-full" style={{ width: `${getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k")}%`, minWidth: 10 }} />
            <div className="h-2 bg-[#A3A3A3] rounded-full" style={{ width: `${100 - (getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k"))}%`, minWidth: 10 }} />
          </div>
          <div className="flex items-center gap-6 mt-1 text-xs text-white">
            <span>{(getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k")).toFixed(2)}%</span>
            <span>{(100 - (getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k"))).toFixed(2)}%</span>
          </div>
        </div>
      </div>
      {/* Social Sentiment */}
      <div className="mt-2">
        <div className="text-[#A259FF] font-semibold mb-2">Social Sentiment</div>
        {tweets.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-gray-500 text-sm">No tweets available for this asset</span>
          </div>
        ) : expandedIndex === null ? (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {tweets.map((tweet, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 border border-transparent bg-[rgba(36,37,42,0.25)] hover:bg-[rgba(50,52,60,0.95)]${expandedIndex === idx ? " shadow-lg" : ""} ${idx === newTweetIndex ? "animate-slideInFromTop" : ""}`}
                style={{ minHeight: 80, maxHeight: 80, overflow: "hidden" }}
                onClick={() => setExpandedIndex(idx)}
              >
                <Image src={tweet.avatar} alt={tweet.name} width={40} height={40} className="rounded-full object-cover mt-1" />
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
              <Image src={tweets[expandedIndex].avatar} alt={tweets[expandedIndex].name} width={48} height={48} className="rounded-full object-cover" />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {sentimentIcon(tweets[expandedIndex].sentiment)}
                    <span className="font-semibold text-sm text-[#A259FF] truncate">{tweets[expandedIndex].name}</span>
                    <span className="text-[#A3A3A3] text-sm truncate">{tweets[expandedIndex].handle}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[#A3A3A3] text-sm">{tweets[expandedIndex].timestamp}</span>
                    <a
                      href={tweets[expandedIndex].tweetUrl}
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
                <span className="text-[#A3A3A3] text-sm mt-0.5">{tweets[expandedIndex].followers} followers</span>
              </div>
            </div>
            <div className="text-sm text-white mt-2 whitespace-pre-line break-words" style={{ lineHeight: "1.6" }}>
              {tweets[expandedIndex].text}
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
              <span className="text-purple-400 animate-pulse text-5xl">.....</span>
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
                          show: false
                        },
                        animations: {
                          enabled: true,
                          speed: 800
                        },
                        height: '100%'
                      },
                      series: [
                        {
                          name: currentChartType === 'price' ? 'Price' : 'Balance Value',                        data: chartData.prices.map((item: { timestamp: number; price: number; balanceValue?: number }) => [
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
                          }
                        },
                        axisBorder: {
                          color: '#23262F'
                        },
                        axisTicks: {
                          color: '#23262F'
                        }
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
                            formatter: (value: number) => `$${value.toLocaleString()}`
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
                          formatter: (value: number) => `$${value.toLocaleString()}`
                        }
                      },
                      legend: {
                        show: false
                      },
                      dataLabels: {
                        enabled: false
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
};

export default Display;

<style jsx global>{`
@keyframes slideInFromTop {
  0% {
    opacity: 0;
    transform: translateY(-40px);
  }
  80% {
    opacity: 1;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slideInFromTop {
  animation: slideInFromTop 1.2s cubic-bezier(0.23, 1, 0.32, 1);
}
`}</style>
