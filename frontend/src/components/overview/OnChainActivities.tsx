import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { User, AssetSentiMentScore } from "@prisma/client";
import { getAllAssetSentimentScores } from "@/actions/queries";
import { IoInformationCircle } from "react-icons/io5";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

// Helper to format balances (e.g., 10000 -> 10K, 0.058 -> 0.058)
function formatBalance(balance: number, symbol: string) {
  if (balance >= 10000) return `${(balance / 1000).toFixed(0)}K ${symbol}`;
  if (balance >= 1) return `${balance.toFixed(3)} ${symbol}`;
  if (balance > 0) return `${balance.toPrecision(3)} ${symbol}`;
  return `0 ${symbol}`;
}

// Helper to get color based on mindShare value (0-100)
function getMindShareColor(mindShare: number): string {
  if (mindShare >= 70) {
    // From 70 to 100: yellow to pure green (30% range for green dominance)
    const ratio = (mindShare - 70) / 30; // 0 to 1
    const red = Math.round(255 * (1 - ratio >= 0.2? ratio: ratio+0.2)); // Fade out red component
    const green = 255;
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  } else if (mindShare >= 50) {
    // From 30 to 70: red to yellow (40% range for yellow transition)
    const ratio = (mindShare - 50) / 20; // 0 to 1
    const red = 255;
    const green = Math.round(128 + (127 * ratio)); // Start from darker yellow and go to bright yellow
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // From 0 to 30: pure red to red-orange (30% range for red dominance)
    const ratio = mindShare / 30; // 0 to 1
    const red = 255;
    const green = Math.round(64 * ratio); // Very little green component
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }
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
  onSentimentChartRequest?: (asset: Asset) => void;
  activeChartType?: 'price' | 'balance' | 'sentiment' | null;
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

const OnChainActivities: React.FC<OnChainActivitiesProps> = ({ refreshKey = 0, onAssetSelect, selectedAsset, onFirstAssetLoad, onPriceChartRequest, onBalanceChartRequest, onSentimentChartRequest, activeChartType, activeChartAsset, connectedWallets = 0, onLogoCacheUpdate, wallets }) => {
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
  const [loadingLogos, setLoadingLogos] = useState<Set<string>>(new Set());

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
        
        // Add all assets to loading state for logos
        const loadingSymbols = new Set(allTokens.map(token => token.symbol.toLowerCase()));
        setLoadingLogos(loadingSymbols);
        
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
        const assetSentiMentScoreList = data.arrayMap as AssetSentimentArrayMap;
        const totalScore = data.totalScore;
        
        setTotalScore(totalScore);
        
        // Update existing tokens with sentiment data
        const updatedTokens = existingTokens.map(token => {
          const updatedToken = { ...token };
          
          if(assetSentiMentScoreList && assetSentiMentScoreList[token.symbol.toLowerCase()]){
            const allAssets = assetSentiMentScoreList[token.symbol.toLowerCase()];
            
            for(const asset of allAssets) {
              if(asset.name.toLowerCase() == token.name.toLowerCase()){
                const SentimentIndex = (asset.positiveTweets - asset.negativeTweets) / (asset.positiveTweets + asset.neutralTweets + asset.negativeTweets);
                updatedToken.icon = asset.image || "";
                updatedToken.sentiment = parseFloat(asset.sentiment);
                updatedToken.mindShare = parseFloat(((SentimentIndex*50) + 50).toFixed(2));
                break;
              }
            }
          }
          
          // If still no sentiment data, try to fetch it
          if(updatedToken.icon == '' || updatedToken.sentiment === undefined) {
            fetchMissingSentimentData(updatedToken, totalScore);
          } else {
            // Remove from loading state if we got a logo
            setLoadingLogos(prev => {
              const newSet = new Set(prev);
              newSet.delete(token.symbol.toLowerCase());
              return newSet;
            });
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
      // Add to loading set
      setLoadingLogos(prev => new Set(prev).add(token.symbol.toLowerCase()));
      
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
          const missingData = await missingDataResponse.json() as { results: {symbol: string, sentiment: string, image: string, positiveTweets: number, negativeTweets: number, neutralTweets: number }[] };
          
          missingData.results.forEach((res) => {
            if (res.symbol.toLowerCase() === token.symbol.toLowerCase()) {
              setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.symbol === token.symbol && asset.name === token.name) {
                  let SentimentIndex = (res.positiveTweets - res.negativeTweets) / (res.positiveTweets + res.neutralTweets + res.negativeTweets);
                  return {
                    ...asset,
                    icon: res.image || "",
                    sentiment: parseFloat(res.sentiment),
                    mindShare: parseFloat(((SentimentIndex*50) + 50).toFixed(2))
                  };
                }
                return asset;
              }));
            }
          });
        }
      } catch (error) {
        // Continue without sentiment data if API fails
      } finally {
        // Remove from loading set
        setLoadingLogos(prev => {
          const newSet = new Set(prev);
          newSet.delete(token.symbol.toLowerCase());
          return newSet;
        });
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

  const handleSentimentClick = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection
    if (onSentimentChartRequest) {
      onSentimentChartRequest(asset);
    }
  };

  if (connectedWallets === 0) {
    return (
      <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[320px] relative">
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
        <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1 relative">
          <table className="w-full text-sm text-left align-middle table-fixed">
            <thead className="sticky -top-px z-40 bg-[#181A20]">
              <tr className="text-[#A3A3A3] border-b border-[#23262F]">
                  <th className="py-2 px-2 font-medium text-left w-[200px] sticky -left-px bg-[#181A20] z-50">Asset</th>
                  <th className="py-2 px-2 font-medium text-left w-[100px]">
                    <div className="flex items-center gap-1">
                      Price
                      <Tippy
                        content={
                          <div className="text-xs">
                            <div>Current token price in USD</div>
                            <div className="text-[#A259FF]">Click to view price chart</div>
                          </div>
                        }
                        placement="top"
                        arrow={true}
                        theme="custom"
                      >
                        <IoInformationCircle className="w-4 h-4 text-[#666]" />
                      </Tippy>
                    </div>
                  </th>
                  <th className="py-2 px-2 font-medium text-left w-[150px]">
                      Balance
                  </th>
                  <th className="py-2 px-2 font-medium text-left w-[100px]">
                    <div className="flex items-center gap-1">
                      Value
                      <Tippy
                        content={
                          <div className="text-xs">
                            <div>Value of your current holdings</div>
                            <div className="text-[#A259FF]">Click to view balance chart</div>
                          </div>
                        }
                        placement="top"
                        arrow={true}
                        theme="custom"
                      >
                        <IoInformationCircle className="w-4 h-4 text-[#666]" />
                      </Tippy>
                    </div>
                  </th>
                  <th className="py-2 px-2 font-medium text-left w-[100px]">Value</th>
                  <th className="py-2 px-2 font-medium text-center w-[80px]">Price</th>
                  <th className="py-2 px-2 font-medium text-center w-[80px]">Sentiment</th>
                  <th className="py-2 px-2 font-medium text-center w-[150px]">Sentiment Score</th>
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
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[320px] relative">
      {/* Preloader overlay - only covers table area */}
      <div className={`absolute top-[60px] left-0 right-0 bottom-0 flex items-center justify-center bg-[#181A20] rounded-b-2xl transition-opacity duration-500 z-20 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
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
      <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1 relative">
        <table className="w-full text-sm text-left align-middle table-fixed">
          <thead className="sticky -top-px z-40 bg-[#181A20]">
            <tr className="text-[#A3A3A3] border-b border-[#23262F]">
              <th className="py-2 px-2 font-medium text-left w-[180px] sticky -left-px bg-[#181A20] z-50">Asset</th>
              <th className="py-2 px-2 font-medium text-left w-[110px]">
                <div className="flex items-center gap-1">
                  Price
                  <Tippy
                    content={
                      <div className="text-xs">
                        <div>Current token price in USD</div>
                        <div className="text-[#A259FF]">Click to view price chart</div>
                      </div>
                    }
                    placement="top"
                    arrow={true}
                    theme="custom"
                  >
                    <IoInformationCircle className="w-4 h-4 text-[#666]" />
                  </Tippy>
                </div>
              </th>
              <th className="py-2 px-2 font-medium text-left w-[150px]">
                  Balance
              </th>
              <th className="py-2 px-2 font-medium text-left w-[100px]">
                <div className="flex items-center gap-1">
                  Value
                  <Tippy
                    content={
                      <div className="text-xs">
                        <div>Value of your current holdings</div>
                        <div className="text-[#A259FF]">Click to view balance chart</div>
                      </div>
                    }
                    placement="top"
                    arrow={true}
                    theme="custom"
                  >
                    <IoInformationCircle className="w-4 h-4 text-[#666]" />
                  </Tippy>
                </div>
              </th>
              <th className="py-2 px-2 font-medium text-center w-[80px]">Price</th>
              <th className="py-2 px-2 font-medium text-center w-[80px]">Sentiment</th>
              <th className="py-2 px-2 font-medium text-center w-[135px]">
                <div className="flex items-center justify-center gap-1">
                  Sentiment Score
                  <Tippy
                    content={
                      <div className="text-xs">
                        <div>Community sentiment score (0-100)</div>
                        <div className="text-[#A259FF]">Click to view sentiment chart</div>
                      </div>
                    }
                    placement="top"
                    arrow={true}
                    theme="custom"
                  >
                    <IoInformationCircle className="w-4 h-4 text-[#666]" />
                  </Tippy>
                </div>
              </th>
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
                  className={`border-b border-[#23262F] last:border-0 hover:bg-[#23262F] transition-colors duration-150 cursor-pointer group ${selectedAsset?.symbol === asset.symbol && selectedAsset?.chain === asset.chain ? 'bg-[#23262F]' : ''}`}
                  onClick={() => handleAssetClick(asset)}
                >
                  <td className={`py-2 px-2 w-[200px] sticky -left-px z-20 transition-colors duration-150 ${
                    selectedAsset?.symbol === asset.symbol && selectedAsset?.chain === asset.chain 
                      ? 'bg-[#23262F]' 
                      : 'bg-[#181A20] group-hover:bg-[#23262F]'
                  }`}>
                    <div className="flex items-center gap-2 justify-start min-w-0">
                    {loadingLogos.has(asset.symbol.toLowerCase()) ? (
                      <div className="w-6 h-6 rounded-full bg-[#23262F] flex items-center justify-center flex-shrink-0">
                        <div className="flex space-x-0.5">
                          <div className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    ) : asset.icon && asset.icon.includes("https") ? (
                        <img src={asset.icon} alt={asset.symbol} className="w-6 h-6 rounded-full object-contain flex-shrink-0" />
                      ) : (
                        <span className="text-2xl flex-shrink-0">{asset.symbol ? asset.symbol[0] : '?'}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-medium">{asset.name}</div>
                        <div className="text-xs text-[#A3A3A3]">{asset.symbol} <span className="text-[#666]">({asset.chain})</span></div>
                      </div>
                    </div>
                  </td>
                  <td 
                    className={`py-2 px-2 w-[100px] text-left align-middle cursor-pointer hover:text-[#A259FF] transition-colors ${
                      activeChartType === 'price' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                        ? 'text-[#A259FF]' 
                        : 'text-white'
                    }`}
                    onClick={(e) => handlePriceClick(asset, e)}
                  >
                    {asset.price !== undefined ? `$${Number(asset.price).toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '--'}
                  </td>
                  <td className="py-2 px-2 w-[100px] text-white text-left align-middle">
                    {asset.balance !== undefined && asset.symbol ? formatBalance(Number(asset.balance), asset.symbol) : '--'}
                  </td>
                  <td className="py-2 px-2 w-[100px] text-white text-left align-middle">
                    <div                         
                      className={`py-2 px-2 w-[100px] text-left align-middle cursor-pointer hover:text-[#A259FF] transition-colors ${
                        activeChartType === 'balance' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                          ? 'text-[#A259FF]' 
                          : 'text-white'
                      }`}
                      onClick={(e) => handleBalanceClick(asset, e)}>
                      {asset.value !== undefined ? `$${Number(asset.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                    </div>
                  </td>
                  <td className={`py-2 px-2 w-[80px] font-semibold text-center align-middle ${asset.priceChange !== undefined && asset.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div>
                      {asset.priceChange !== undefined ? `${asset.priceChange >= 0 ? '+' : ''}${Number(asset.priceChange).toFixed(2)}%` : '--'}
                    </div>
                  </td>
                  <td className={`py-2 px-2 w-[80px] font-semibold text-center align-middle ${asset.sentiment !== undefined && asset.sentiment > 0 ? 'text-green-400' : asset.sentiment !== undefined && asset.sentiment < 0 ? 'text-red-400' : ''}`}>
                    <div>
                      {asset.sentiment !== undefined ? `${asset.sentiment >= 0 ? '+' : ''}${asset.sentiment.toFixed(2)}%` : '--'}
                    </div>
                  </td>
                  <td 
                    className={`py-2 px-2 w-[120px] text-center align-middle cursor-pointer hover:opacity-80 transition-opacity ${
                      activeChartType === 'sentiment' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                        ? 'opacity-80' 
                        : ''
                    }`}
                    onClick={(e) => handleSentimentClick(asset, e)}
                  >
                    {/* Placeholder for circular progress */}
                    <div className="relative w-10 h-10 flex items-center justify-center m-auto">
                      <svg className="absolute top-0 left-0" width="40" height="40">
                        <circle cx="20" cy="20" r="18" stroke="#23262F" strokeWidth="4" fill="none" />
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          stroke={asset.mindShare !== undefined ? getMindShareColor(asset.mindShare) : '#666666'}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={113}
                          strokeDashoffset={asset.mindShare !== undefined ? 113 - (asset.mindShare/100) * 113 : 113}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-white text-[10px] font-bold z-0">{asset.mindShare !== undefined ? `${asset.mindShare.toFixed(1)}%` : '--'}</span>
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