import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

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

// Throttle helper: runs async tasks with a concurrency limit
async function throttleAll<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  const run = async () => {
    while (i < tasks.length) {
      const cur = i++;
      try {
        results[cur] = await tasks[cur]();
      } catch (e) {
        results[cur] = undefined as any;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, run));
  return results;
}

// Helper to format balances (e.g., 10000 -> 10K, 0.058 -> 0.058)
function formatBalance(balance: number, symbol: string) {
  if (balance >= 10000) return `${(balance / 1000).toFixed(0)}K ${symbol}`;
  if (balance >= 1) return `${balance.toFixed(3)} ${symbol}`;
  if (balance > 0) return `${balance.toPrecision(3)} ${symbol}`;
  return `0 ${symbol}`;
}

interface Asset {
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

interface OnChainActivitiesProps { 
  refreshKey?: number; 
  onAssetSelect?: (asset: Asset) => void;
  selectedAsset?: Asset | null;
  onFirstAssetLoad?: (firstAsset: Asset) => void;
  onPriceChartRequest?: (asset: Asset) => void;
  onBalanceChartRequest?: (asset: Asset) => void;
  activeChartType?: 'price' | 'balance' | null;
  activeChartAsset?: Asset | null;
  connectedWallets?: number;
  onLogoCacheUpdate?: (logoCache: Record<string, string>) => void;
}

const OnChainActivities: React.FC<OnChainActivitiesProps> = ({ refreshKey = 0, onAssetSelect, selectedAsset, onFirstAssetLoad, onPriceChartRequest, onBalanceChartRequest, activeChartType, activeChartAsset, connectedWallets = 0, onLogoCacheUpdate }) => {
  const { data: session } = useSession();
  const twitterId = (session?.user as any)?.id || (session?.user as any)?.twitter_id || '';
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoCache, setLogoCache] = useState<Record<string, string>>({});
  const [showAllAssets, setShowAllAssets] = useState(false);
  const fetchingSymbols = useRef<Set<string>>(new Set());
  const [sentimentCache, setSentimentCache] = useState<Record<string, number>>({});

  // Filter assets based on showAllAssets state
  const filteredAssets = showAllAssets ? assets : assets.filter(asset => (asset.value || 0) >= 1);
  const hiddenAssetsCount = assets.length - filteredAssets.length;

  // Fetch sentiment for all assets in batches of 5
  const fetchAssetSentiment = async (assetList: Asset[]) => {
    if (assetList.length === 0) return;

    try {
      const uniqueAssets = assetList.filter((asset, index, self) => 
        index === self.findIndex(a => a.symbol.toLowerCase() === asset.symbol.toLowerCase())
      );

      // Process in batches of 5
      const batchSize = 5;
      const newSentimentCache: Record<string, number> = {};
      
      for (let i = 0; i < uniqueAssets.length; i += batchSize) {
        const batch = uniqueAssets.slice(i, i + batchSize);
        
        try {
          const response = await axios.post(`${API_BASE}/twitter/sentiment-batch`, {
            assets: batch.map(asset => ({ symbol: asset.symbol, name: asset.name }))
          });

          if (response.data && typeof response.data === 'object' && 'results' in response.data) {
            Object.entries(response.data.results as Record<string, any>).forEach(([symbol, data]: [string, any]) => {
              if (data.sentiment !== undefined && data.error === null) {
                newSentimentCache[symbol.toLowerCase()] = data.sentiment;
              }
            });
          }
          
          // Update cache after each batch
          setSentimentCache(prev => ({ ...prev, ...newSentimentCache }));
          
          // Small delay between batches to be respectful to API
          if (i + batchSize < uniqueAssets.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error fetching sentiment for batch ${i / batchSize + 1}:`, error);
        }
      }
    } catch (error) {
      console.error('Error fetching asset sentiment:', error);
    }
  };

  useEffect(() => {
    if (!twitterId) return;
    let retryInterval: NodeJS.Timeout | null = null;
    const fetchAssets = async () => {
      try {
        setLoading(true);
        // 1. Fetch all wallets for the user
        const userId = (session?.user as any)?.id || '';
        const walletsRes = await axios.get(`/api/wallets?user_id=${userId}`);
        const walletsArr = ((walletsRes.data as any).wallets || []) as Array<{walletAddress: string, chain: string}>;
        
        // 2. For each wallet, fetch balances
        let allTokens: Asset[] = [];
        let uniqueSymbols = new Set<string>();
        
        for (const w of walletsArr) {
          if (!w.walletAddress || w.walletAddress.trim() === '') {
            continue;
          }
          const balancesRes = await axios.get(`${API_BASE}/balances/address/${w.walletAddress}`);
          const balances = (balancesRes.data as any).balances;
          for (const chain in balances) {
            for (const token of balances[chain]) {
              allTokens.push({
                name: token.name,
                symbol: token.symbol,
                chain: chain.charAt(0).toUpperCase() + chain.slice(1),
                price: token.price,
                balance: token.balance,
                value: token.usd,
                priceChange: token.priceChange24hPercent,
                balanceChange: token.balanceChange24h !== undefined ? token.balanceChange24h : undefined,
                sentimentChange: token.sentimentChange24h !== undefined ? token.sentimentChange24h : undefined,
                sentiment: token.sentiment !== undefined ? token.sentiment : undefined,
                icon: '', // Will be filled progressively
              });
              if (token.symbol) uniqueSymbols.add(token.symbol.toLowerCase());
            }
          }
        }
        
        // 3. INSTANT DISPLAY: Show balances immediately without waiting for logos
        allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
        setAssets(allTokens);
        setLoading(false); // Stop loading immediately
        
        // 4. Notify parent about first asset immediately
        if (allTokens.length > 0 && onFirstAssetLoad) {
          onFirstAssetLoad(allTokens[0]);
        }
        
        // 5. BACKGROUND PROCESSING: Load logos progressively
        const newLogoCache: Record<string, string> = { ...logoCache };
        const toFetch = Array.from(uniqueSymbols).filter(symbol => !newLogoCache[symbol]);
        
        // Process logos in background without blocking UI
        throttleAll(
          toFetch.map((symbol) => async () => {
            try {
              const apiSymbol = getApiSymbol(symbol);
              const logoRes = await axios.get(`${API_BASE}/tokens/cmc?symbol=${apiSymbol}`);
              if (logoRes.data && typeof logoRes.data === 'object' && 'logo' in logoRes.data && typeof (logoRes.data as any).logo === 'string' && (logoRes.data as any).logo) {
                newLogoCache[symbol] = (logoRes.data as any).logo;
                setLogoCache(prev => ({ ...prev, [symbol]: (logoRes.data as any).logo }));
                // Share logo cache with parent component for Display
                if (onLogoCacheUpdate) {
                  onLogoCacheUpdate({ ...newLogoCache, [symbol]: (logoRes.data as any).logo });
                }
              }
            } catch {}
          }),
          5
        );
        
        // 6. BACKGROUND PROCESSING: Load sentiment progressively
        fetchAssetSentiment(allTokens);
        
        // 7. Periodic retry for missing icons every 5 seconds
        if (retryInterval) clearInterval(retryInterval);
        retryInterval = setInterval(async () => {
          const missingSymbols = Array.from(uniqueSymbols).filter(symbol => !newLogoCache[symbol]);
          if (missingSymbols.length === 0) return;
          await throttleAll(
            missingSymbols.map(symbol => async () => {
              try {
                const apiSymbol = getApiSymbol(symbol);
                const logoRes = await axios.get(`${API_BASE}/tokens/cmc?symbol=${apiSymbol}`);
                if (logoRes.data && typeof logoRes.data === 'object' && 'logo' in logoRes.data && typeof (logoRes.data as any).logo === 'string' && (logoRes.data as any).logo) {
                  newLogoCache[symbol] = (logoRes.data as any).logo;
                  setLogoCache(prev => ({ ...prev, [symbol]: (logoRes.data as any).logo }));
                  // Share logo cache with parent component for Display
                  if (onLogoCacheUpdate) {
                    onLogoCacheUpdate({ ...newLogoCache, [symbol]: (logoRes.data as any).logo });
                  }
                }
              } catch {}
            }),
            5
          );
        }, 5000);
      } catch {
        setAssets([]);
        setLoading(false);
      }
    };
    fetchAssets();
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
    // eslint-disable-next-line
  }, [twitterId, refreshKey]);

  // Recompute assets with new logos whenever logoCache changes
  useEffect(() => {
    setAssets(prevAssets => prevAssets.map(t => ({ ...t, icon: logoCache[t.symbol?.toLowerCase()] || '' })));
  }, [logoCache]);

  // Update assets with sentiment data whenever sentimentCache changes
  useEffect(() => {
    setAssets(prevAssets => prevAssets.map(asset => {
      const sentiment = sentimentCache[asset.symbol.toLowerCase()];
      return sentiment !== undefined ? { ...asset, sentiment } : asset;
    }));
  }, [sentimentCache]);

  const handleAssetClick = (asset: Asset) => {
    if (onAssetSelect) {
      onAssetSelect(asset);
    }
  };

  const handlePriceClick = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection
    if (onPriceChartRequest) {
      onPriceChartRequest(asset);
    }
  };

  const handleBalanceClick = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection
    if (onBalanceChartRequest) {
      onBalanceChartRequest(asset);
    }
  };

  if (connectedWallets === 0) {
    return (
      <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[320px] relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold text-white">Portfolio Overview</div>
          <button 
            onClick={() => setShowAllAssets(!showAllAssets)}
            className="text-[#A259FF] text-sm flex items-center gap-1 border border-[#23272b] px-3 py-1 rounded-lg hover:bg-[#23262b]/20 transition-colors cursor-pointer"
          >
            {showAllAssets ? 'Hide Small Assets' : 'View All Assets'}
            <span className="ml-2 bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">0</span>
          </button>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1">
          <table className="min-w-full text-sm text-left align-middle">
            <thead>
              <tr className="text-[#A3A3A3] border-b border-[#23262F]">
                <th className="py-2 px-2 font-medium text-left">Asset</th>
                <th className="py-2 px-2 font-medium text-left">Price</th>
                <th className="py-2 px-2 font-medium text-left">Balance</th>
                <th className="py-2 px-2 font-medium text-left">Value</th>
                <th className="py-2 px-2 font-medium text-center">Price</th>
                <th className="py-2 px-2 font-medium text-center">Sentiment</th>
                <th className="py-2 px-2 font-medium text-center">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 italic">Add a wallet to get started</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[320px] relative">
      {/* Preloader overlay */}
      <div className={`absolute inset-0 flex items-center justify-center bg-[#181A20] transition-opacity duration-500 z-20 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <span className="text-purple-400 animate-pulse text-5xl">.....</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-white">Portfolio Overview</div>
        <button 
          onClick={() => setShowAllAssets(!showAllAssets)}
          className="text-[#A259FF] text-sm flex items-center gap-1 border border-[#23272b] px-3 py-1 rounded-lg hover:bg-[#23262b]/20 transition-colors cursor-pointer"
        >
          {showAllAssets ? 'Hide Small Assets' : 'View All Assets'}
          <span className="ml-2 bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{assets.length}</span>
        </button>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1">
        <table className="min-w-full text-sm text-left align-middle">
          <thead>
            <tr className="text-[#A3A3A3] border-b border-[#23262F]">
              <th className="py-2 px-2 font-medium text-left">Asset</th>
              <th className="py-2 px-2 font-medium text-left">Price</th>
              <th className="py-2 px-2 font-medium text-left">Balance</th>
              <th className="py-2 px-2 font-medium text-left">Value</th>
              <th className="py-2 px-2 font-medium text-center">Price</th>
              <th className="py-2 px-2 font-medium text-center">Sentiment</th>
              <th className="py-2 px-2 font-medium text-center">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset, idx) => (
              <tr 
                key={asset.symbol + asset.chain + idx} 
                className={`border-b border-[#23262F] last:border-0 hover:bg-[#23262F]/40 transition cursor-pointer ${selectedAsset?.symbol === asset.symbol && selectedAsset?.chain === asset.chain ? 'bg-[#23262F]/60' : ''}`}
                onClick={() => handleAssetClick(asset)}
              >
                <td className="py-2 px-2 flex items-center gap-2 justify-start">
                  {asset.icon ? (
                    <img src={asset.icon} alt={asset.symbol} className="w-6 h-6 rounded-full object-contain" />
                  ) : (
                    <span className="text-2xl">{asset.symbol ? asset.symbol[0] : '?'}</span>
                  )}
                  <div>
                    <div className="text-white font-medium">{asset.name}</div>
                    <div className="text-xs text-[#A3A3A3]">{asset.symbol} <span className="text-[#666]">({asset.chain})</span></div>
                  </div>
                </td>
                <td 
                  className={`py-2 px-2 text-white text-left align-middle cursor-pointer hover:text-[#A259FF] transition-colors ${
                    activeChartType === 'price' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                      ? 'text-[#A259FF]' 
                      : ''
                  }`}
                  onClick={(e) => handlePriceClick(asset, e)}
                  title="Click to view price chart"
                >
                  {asset.price !== undefined ? `$${Number(asset.price).toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '--'}
                </td>
                <td 
                  className={`py-2 px-2 text-white text-left align-middle cursor-pointer hover:text-[#A259FF] transition-colors ${
                    activeChartType === 'balance' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                      ? 'text-[#A259FF]' 
                      : ''
                  }`}
                  onClick={(e) => handleBalanceClick(asset, e)}
                  title="Click to view balance chart"
                >
                  {asset.balance !== undefined && asset.symbol ? formatBalance(Number(asset.balance), asset.symbol) : '--'}
                </td>
                <td className="py-2 px-2 text-white text-left align-middle">{asset.value !== undefined ? `$${Number(asset.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}</td>
                <td className={`py-2 px-2 font-semibold text-center align-middle ${asset.priceChange !== undefined && asset.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>{asset.priceChange !== undefined ? `${asset.priceChange >= 0 ? '+' : ''}${Number(asset.priceChange).toFixed(2)}%` : '--'}</td>
                <td className={`py-2 px-2 font-semibold text-center align-middle`}>{asset.sentimentChange !== undefined ? asset.sentimentChange : '--'}</td>
                <td className="py-2 px-2 text-center align-middle">
                  {/* Placeholder for circular progress */}
                  <div className="relative w-10 h-10 flex items-center justify-center m-auto">
                    <svg className="absolute top-0 left-0" width="40" height="40">
                      <circle cx="20" cy="20" r="18" stroke="#23262F" strokeWidth="4" fill="none" />
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke={asset.sentiment !== undefined && asset.sentiment >= 50 ? '#22c55e' : '#ef4444'}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="113"
                        strokeDashoffset={asset.sentiment !== undefined ? 113 - (asset.sentiment / 100) * 113 : 113}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-white text-xs font-bold z-10">{asset.sentiment !== undefined ? `${asset.sentiment}%` : '--'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OnChainActivities;