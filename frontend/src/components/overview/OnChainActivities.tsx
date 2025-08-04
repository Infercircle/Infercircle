import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { User, AssetSentiMentScore } from "@prisma/client";
import { getAllAssetSentimentScores } from "@/actions/queries";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

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
  mindShare?: number;
  icon: string;
}

interface OnChainActivitiesProps { 
  refreshKey?: number; 
  onAssetSelect?: (asset: Asset) => void;
  selectedAsset?: Asset | null;
  onFirstAssetLoad?: (asset: Asset) => void;
  onPriceChartRequest?: (asset: Asset) => void;
  onBalanceChartRequest?: (asset: Asset) => void;
  activeChartType?: 'price' | 'balance' | null;
  activeChartAsset?: Asset | null;
  connectedWallets?: number;
  onLogoCacheUpdate?: (logoCache: Record<string, string>) => void;
  // Add wallet data props to avoid duplicate fetching
  wallets?: {
    eth: string[];
    sol: string[];
    btc: string[];
    tron: string[];
    ton: string[];
  };
}

type AssetSentimentArrayMap = {
  [symbol: string]: AssetSentiMentScore[];
};

const OnChainActivities: React.FC<OnChainActivitiesProps> = ({ refreshKey = 0, onAssetSelect, selectedAsset, onFirstAssetLoad, onPriceChartRequest, onBalanceChartRequest, activeChartType, activeChartAsset, connectedWallets = 0, onLogoCacheUpdate, wallets }) => {
  const { data: session } = useSession();
  const twitterId = (session?.user as any)?.id || (session?.user as any)?.twitter_id || '';
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(assets);
  const [loading, setLoading] = useState(true);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const fetchingSymbols = useRef<Set<string>>(new Set());
  const [sentimentCache, setSentimentCache] = useState<Record<string, number>>({});
  const [totalScore, setTotalScore] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const hiddenAssetsCount = assets.length - filteredAssets.length;

  // Helper function to check if wallets are actually populated
  const hasValidWallets = () => {
    if (!wallets) return false;
    return (
      wallets.eth.length > 0 ||
      wallets.sol.length > 0 ||
      wallets.btc.length > 0 ||
      wallets.tron.length > 0 ||
      wallets.ton.length > 0
    );
  };

  useEffect(() => {
    if (!twitterId) {
      setLoading(false);
      return;
    }

    if (!wallets) {
      setLoading(false);
      return;
    }

    if (!hasValidWallets()) {
      setAssets([]);
      setFilteredAssets([]);
      setLoading(false);
      return;
    }

    let retryInterval: NodeJS.Timeout | null = null;
    
    // Fetch balances immediately without waiting for sentiment data
    const fetchBalances = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the wallets data passed from parent instead of fetching again
        const allWallets = [
          ...wallets.eth.map(walletAddress => ({ walletAddress, chain: 'eth' })),
          ...wallets.sol.map(walletAddress => ({ walletAddress, chain: 'sol' })),
          ...wallets.btc.map(walletAddress => ({ walletAddress, chain: 'btc' })),
          ...wallets.tron.map(walletAddress => ({ walletAddress, chain: 'tron' })),
          ...wallets.ton.map(walletAddress => ({ walletAddress, chain: 'ton' })),
        ];
        
        // Fetch balances for all wallets
        let allTokens: Asset[] = [];
        let uniqueSymbols = new Set<string>();
        
        for (const w of allWallets) {
          if (!w.walletAddress || w.walletAddress.trim() === '') {
            continue;
          }
          
          try {
            const balancesRes = await axios.get(`${API_BASE}/balances/address/${w.walletAddress}`);
            const balances = (balancesRes.data as any).balances;
            
            for (const chain in balances) {
              for (const token of balances[chain]) {
                let assetObj = {
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
                  mindShare: token.mindShare !== undefined ? token.mindShare : undefined,
                  icon: '', // Will be filled progressively
                };
                
                allTokens.push(assetObj);
                if (token.symbol) uniqueSymbols.add(token.symbol.toLowerCase());
              }
            }
          } catch (error) {
            // Continue with other wallets even if one fails
          }
        }
        
        // Display balances immediately
        allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
        setAssets(allTokens);
        setLoading(false);
        
        // Notify parent about first asset immediately
        if (allTokens.length > 0 && onFirstAssetLoad) {
          onFirstAssetLoad(allTokens[0]);
        }
        
        // Now fetch sentiment data in background and update assets
        fetchSentimentDataAndUpdate(allTokens);
        
      } catch (error) {
        setError("Failed to fetch asset data");
        setAssets([]);
        setLoading(false);
      }
    };

    // Fetch sentiment data and update assets with sentiment info
    const fetchSentimentDataAndUpdate = async (existingTokens: Asset[]) => {
      try {
        const sentimentResponse = await fetch("/api/sentiments");
        
        if (!sentimentResponse.ok) {
          return; // Keep existing tokens without sentiment data
        }
        
        const data = await sentimentResponse.json();
        const assetSentiMentScoreList = data.arrayMap;
        const totalScore = data.totalScore;
        
        setTotalScore(totalScore);
        
        // Update existing tokens with sentiment data
        const updatedTokens = existingTokens.map(token => {
          const updatedToken = { ...token };
          
          if(assetSentiMentScoreList && assetSentiMentScoreList[token.symbol.toLowerCase()]){
            const allAssets = assetSentiMentScoreList[token.symbol.toLowerCase()];
            
            for(const asset of allAssets) {
              if(asset.name.toLowerCase() == token.name.toLowerCase()){
                updatedToken.icon = asset.image || "";
                updatedToken.sentiment = parseFloat(asset.sentiment);
                updatedToken.mindShare = parseFloat(((parseFloat(asset.sentiment) / totalScore) * 100).toFixed(2));
                break;
              }
            }
          }
          
          // If still no sentiment data, try to fetch it
          if(updatedToken.icon == '' || updatedToken.sentiment === undefined) {
            fetchMissingSentimentData(updatedToken, totalScore);
          }
          
          return updatedToken;
        });
        
        setAssets(updatedTokens);
        
      } catch (error) {
        // Keep existing tokens without sentiment data
      }
    };

    // Fetch missing sentiment data for individual tokens
    const fetchMissingSentimentData = async (token: Asset, totalScore: number) => {
      try {
        const notFoundArr = [{
          id: token.symbol,
          name: token.name,
          symbol: token.symbol,
          image: '',
          blockchain: token.chain.toLowerCase(),
          address: '',
        }];
        
        const missingDataResponse = await fetch(`${API_BASE}/mindshare/addAsset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assets: notFoundArr }),
        });
        
        if (missingDataResponse.ok) {
          const missingData = await missingDataResponse.json() as { results: { symbol: string, sentiment: string, image: string }[] };
          
          missingData.results.forEach((res) => {
            if (res.symbol.toLowerCase() === token.symbol.toLowerCase()) {
              setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.symbol === token.symbol && asset.name === token.name) {
                  return {
                    ...asset,
                    icon: res.image || "",
                    sentiment: parseFloat(res.sentiment),
                    mindShare: parseFloat(((parseFloat(res.sentiment) / totalScore) * 100).toFixed(2))
                  };
                }
                return asset;
              }));
            }
          });
        }
      } catch (error) {
        // Continue without sentiment data if API fails
      }
    };

    fetchBalances();
    
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
    // eslint-disable-next-line
  }, [twitterId, refreshKey, wallets]);

  // Update assets with sentiment data whenever sentimentCache changes
  useEffect(() => {
    setAssets(prevAssets => prevAssets.map(asset => {
      const sentiment = sentimentCache[asset.symbol.toLowerCase()];
      return sentiment !== undefined ? { ...asset, sentiment } : asset;
    }));
  }, [sentimentCache]);

  // Update filtered assets when showAllAssets or assets change
  useEffect(() => {
    const filtered = showAllAssets ? assets : assets.filter(asset => (asset.value || 0) >= 1);
    setFilteredAssets(filtered);
  }, [showAllAssets, assets]);

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
        <div className="text-base font-semibold text-white">Portfolio Overview</div>
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
                <th className="py-2 px-2 font-medium text-center">Mindshare</th>
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
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#181A20] z-20">
          <div className="text-center">
            <div className="text-red-400 text-lg font-semibold mb-2">Error Loading Assets</div>
            <div className="text-[#666] text-sm">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-[#A259FF] text-white rounded-lg hover:bg-[#8B4DFF] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div className="text-base font-semibold text-white">Portfolio Overview</div>
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
              <th className="py-2 px-2 font-medium text-center">Mindshare</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                  {hasValidWallets() ? "No assets found in your wallets" : "No wallets connected"}
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset, idx) => (
                <tr 
                  key={asset.symbol + asset.chain + idx} 
                  className={`border-b border-[#23262F] last:border-0 hover:bg-[#23262F]/40 transition cursor-pointer ${selectedAsset?.symbol === asset.symbol && selectedAsset?.chain === asset.chain ? 'bg-[#23262F]/60' : ''}`}
                  onClick={() => handleAssetClick(asset)}
                >
                  <td className="py-2 px-2 flex items-center gap-2 justify-start">
                    {asset.icon && asset.icon.includes("https") ? (
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
                  <td className={`py-2 px-2 font-semibold text-center align-middle ${asset.sentiment !== undefined && asset.sentiment > 0 ? 'text-green-400' : asset.sentiment !== undefined && asset.sentiment < 0 ? 'text-red-400' : ''}`}>{asset.sentiment !== undefined ? `${asset.sentiment >= 0 ? '+' : ''}${asset.sentiment.toFixed(2)}%` : '--'}</td>
                  <td className="py-2 px-2 text-center align-middle">
                    {/* Placeholder for circular progress */}
                    <div className="relative w-10 h-10 flex items-center justify-center m-auto">
                      <svg className="absolute top-0 left-0" width="40" height="40">
                        <circle cx="20" cy="20" r="18" stroke="#23262F" strokeWidth="4" fill="none" />
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          stroke={asset.mindShare !== undefined && asset.mindShare >= 50 ? '#22c55e' : '#ef4444'}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={113}
                          strokeDashoffset={asset.mindShare !== undefined ? 113 - (asset.mindShare / totalScore) * 113 : 113}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-white text-xs font-bold z-10">{asset.mindShare !== undefined ? `${asset.mindShare}%` : '--'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OnChainActivities;