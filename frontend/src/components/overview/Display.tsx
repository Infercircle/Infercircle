"use client";

import React, { useEffect, useState } from "react";

// Import ApexCharts with proper typing
let Chart: any = null;
if (typeof window !== 'undefined') {
  Chart = require('react-apexcharts').default;
}

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

const MOCK_TWEETS = [
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
    sentiment: "positive",
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
  }
];

const sentimentIcon = (sentiment: string) => {
  let icon = null;
  if (sentiment === "positive") {
    icon = <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7 7 7M12 3v18" /></svg>;
  } else if (sentiment === "negative") {
    icon = <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7-7-7M12 21V3" /></svg>;
  } else {
    icon = <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
  }
  return <span>{icon}</span>;
};

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m7-1V7m0 0h-5m5 0L10 17" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface DisplayProps {
  selectedAsset?: SelectedAsset | null;
  showPriceChart?: boolean;
  chartAsset?: SelectedAsset | null;
  onCloseChart?: () => void;
  chartType?: 'price' | 'balance';
}

const CHART_FILTERS = [
  { label: '30M', days: '1', interval: 'minutely' }, // CoinGecko only supports minutely for 1 day
  { label: '1D', days: '1', interval: 'hourly' },
  { label: '1W', days: '7', interval: 'hourly' },
  { label: '1M', days: '30', interval: 'daily' },
  { label: '3M', days: '90', interval: 'daily' },
  { label: '1Y', days: '365', interval: 'daily' },
];

const Display: React.FC<DisplayProps> = ({ selectedAsset, showPriceChart = false, chartAsset, onCloseChart, chartType = 'price' }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loadingRank, setLoadingRank] = useState(false);
  const [rankRetryCount, setRankRetryCount] = useState(0);
  const [rankCache, setRankCache] = useState<Record<string, number>>({});
  const [logoCache, setLogoCache] = useState<Record<string, string>>({});
  const [logoRetryCount, setLogoRetryCount] = useState(0);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentChartType, setCurrentChartType] = useState<'price' | 'balance'>(chartType);
  const [addressDist] = useState<any>({
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
  const [whaleDist] = useState<any>({
    "1k_10k": 0.05,
    "10k_100k": 0.03,
    above_100k: 0.02,
  });
  const [tweets] = useState<any[]>(MOCK_TWEETS);
  const [activeFilter, setActiveFilter] = useState(CHART_FILTERS[5]); // Default to 1Y

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  // Update currentChartType when chartType prop changes
  useEffect(() => {
    setCurrentChartType(chartType);
  }, [chartType]);

  // Symbol mapping for tokens that have changed their symbols
  const SYMBOL_MAPPINGS: Record<string, string> = {
    'matic': 'pol', // MATIC rebranded to POL
    'polygon': 'pol',
  };

  // Helper function to get the correct symbol for API calls
  const getApiSymbol = (symbol: string): string => {
    const lowerSymbol = symbol.toLowerCase();
    return SYMBOL_MAPPINGS[lowerSymbol] || lowerSymbol;
  };

  // Logo fetch/retry logic for chartAsset
  useEffect(() => {
    if (!chartAsset?.symbol) return;
    let isMounted = true;
    const symbol = chartAsset.symbol.toLowerCase();
    const apiSymbol = getApiSymbol(symbol);
    if (!logoCache[symbol]) {
      const fetchLogo = async () => {
        try {
          const res = await fetch(`${API_BASE}/tokens/cmc?symbol=${apiSymbol}`);
          const data = await res.json();
          if (data.logo && isMounted) {
            setLogoCache(prev => ({ ...prev, [symbol]: data.logo }));
            setLogoRetryCount(0);
          } else {
            throw new Error('No logo');
          }
        } catch {
          if (isMounted && logoRetryCount < 3) {
            setTimeout(() => setLogoRetryCount(c => c + 1), 3000);
          }
        }
      };
      fetchLogo();
    }
    return () => { isMounted = false; };
  }, [chartAsset?.symbol, logoCache, logoRetryCount, API_BASE]);

  // Fetch rank data when selectedAsset changes
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

    const fetchRank = async () => {
      setLoadingRank(true);
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
        }
      } catch (error) {
        setRank(null);
        // Increment retry count for failed attempts
        setRankRetryCount(prev => prev + 1);
    } finally {
        setLoadingRank(false);
      }
    };

    fetchRank();
  }, [selectedAsset?.symbol, API_BASE, rankCache]);

  // Retry logic for failed rank fetches
  useEffect(() => {
    if (rankRetryCount > 0 && rankRetryCount <= 3 && selectedAsset?.symbol) {
      const retryTimeout = setTimeout(() => {
        const fetchRank = async () => {
          setLoadingRank(true);
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
            }
          } catch (error) {
            setRank(null);
            // Continue retrying if we haven't reached max attempts
            if (rankRetryCount < 3) {
              setRankRetryCount(prev => prev + 1);
            }
          } finally {
            setLoadingRank(false);
          }
        };

        fetchRank();
      }, 5000); // Retry every 5 seconds

      return () => clearTimeout(retryTimeout);
    }
  }, [rankRetryCount, selectedAsset?.symbol, API_BASE]);

  // Fetch chart data when chart view is active or filter changes
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
                prices: data.prices.map((item: any) => ({
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
      fetchChartData();
    }
  }, [showPriceChart, chartAsset?.symbol, API_BASE, activeFilter, currentChartType]);

  // Helper for address bands
  const getBand = (band: string) => {
    if (!addressDist) return 0;
    return (addressDist[band] ?? 0) * 100;
  };
  // Helper for whale bands
  const getWhale = (band: string) => {
    if (!whaleDist) return 0;
    return (whaleDist[band] ?? 0) * 100;
  };

  // Use selected asset data if available, otherwise show loading state
  const displayName = selectedAsset ? selectedAsset.name : "Loading...";
  const displaySymbol = selectedAsset ? selectedAsset.symbol : "";
  const displayPrice = selectedAsset ? selectedAsset.price : null;
  const displayChange = selectedAsset ? selectedAsset.priceChange : null;
  const displayLogo = selectedAsset?.icon || null;
  const displayRank = loadingRank ? "Loading..." : rank !== null ? `#${rank}` : null;

  // Chart asset data
  const chartName = chartAsset ? chartAsset.name : "";
  const chartSymbol = chartAsset ? chartAsset.symbol : "";
  const chartPrice = chartAsset ? chartAsset.price : null;
  const chartChange = chartAsset ? chartAsset.priceChange : null;
  const chartLogo = chartAsset?.icon || null;

  // Show loading state if no asset is selected
  if (!selectedAsset) {
    return (
      <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-6 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-x-auto">
        <div className="flex items-center justify-center h-full">
          <span className="text-purple-400 animate-pulse text-5xl">.....</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-6 shadow-lg w-full flex flex-col min-h-[480px] max-h-[400px] flex-1 overflow-hidden relative">
      {/* Main Content */}
      <div className={`transition-opacity duration-500 overflow-y-auto ${showPriceChart ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-2 lg:gap-0">
        <div className="flex items-center gap-3">
            {displayLogo ? (
              <img src={displayLogo} alt={displaySymbol} className="w-8 h-8 rounded-full" />
          ) : (
              <span className="text-3xl">{displaySymbol ? displaySymbol[0] : "🟠"}</span>
          )}
          <div>
            <div className="text-white font-semibold text-lg flex items-center gap-2">
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
        {expandedIndex === null ? (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {tweets.map((tweet, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 border border-transparent bg-[rgba(36,37,42,0.25)] hover:bg-[rgba(50,52,60,0.95)]${expandedIndex === idx ? " shadow-lg" : ""}`}
                style={{ minHeight: 80, maxHeight: 80, overflow: "hidden" }}
                onClick={() => setExpandedIndex(idx)}
              >
                <img src={tweet.avatar} alt={tweet.name} className="w-10 h-10 rounded-full object-cover mt-1" />
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {sentimentIcon(tweet.sentiment)}
                      <span className="font-semibold text-sm text-white truncate">{tweet.name}</span>
                      <span className="text-[#A3A3A3] text-sm truncate">{tweet.handle}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto items-center">
                      <span className="text-[#A3A3A3] text-sm">{tweet.timestamp}</span>
                      <a
                        href={tweet.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A259FF] flex items-center"
                        title="View Tweet"
                        onClick={e => e.stopPropagation()}
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
              <img src={tweets[expandedIndex].avatar} alt={tweets[expandedIndex].name} className="w-12 h-12 rounded-full object-cover" />
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {sentimentIcon(tweets[expandedIndex].sentiment)}
                    <span className="font-semibold text-sm text-[#A259FF] truncate">{tweets[expandedIndex].name}</span>
                    <span className="text-[#A3A3A3] text-sm truncate">{tweets[expandedIndex].handle}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto items-center">
                    <span className="text-[#A3A3A3] text-sm">{tweets[expandedIndex].timestamp}</span>
                    <a
                      href={tweets[expandedIndex].tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A259FF] flex items-center"
                      title="View Tweet"
                      onClick={e => e.stopPropagation()}
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
                <div className="text-red-400 text-lg font-semibold mb-2">Chart Error</div>
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
                          easing: 'easeinout',
                          speed: 800
                        },
                        height: '100%'
                      },
                      series: [
                        {
                          name: currentChartType === 'price' ? 'Price' : 'Balance Value',
                          data: chartData.prices.map(item => [
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
                        data: chartData.prices.map(item => [
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
                      <div className="text-[#A259FF] text-lg font-semibold mb-2">No Chart Data</div>
                      <div className="text-[#666] text-sm">Unable to load price data for this asset</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-[#A259FF] text-lg font-semibold mb-2">Price Chart</div>
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
