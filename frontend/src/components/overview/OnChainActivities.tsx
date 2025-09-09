import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { User, AssetSentiMentScore } from "@prisma/client";
import { getAllAssetSentimentScores } from "@/actions/queries";
import { IoInformationCircle } from "react-icons/io5";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { Asset } from "./Dashboard";
import { useWebWorkers } from "@/hooks/useWebWorkers";

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

interface OnChainActivitiesProps { 
  refreshKey?: number; 
  onAssetSelect?: (asset: Asset) => void;
  selectedAsset?: Asset | null;
  onFirstAssetLoad?: (asset: Asset) => void;
  onPriceChartRequest?: (asset: Asset) => void;
  onBalanceChartRequest?: (asset: Asset) => void;
  onSentimentChartRequest?: (asset: Asset) => void;
  onCombinedChartRequest?: (asset: Asset) => void;
  activeChartType?: 'price' | 'balance' | 'sentiment' | 'combined' | null;
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
  // Shared portfolio data from Dashboard Layout
  sharedPortfolioData?: {
    [walletAddress: string]: {
      portfolio: any;
      chains: any;
      positionsChainsDistribution: any;
    };
  };
}

type AssetSentimentArrayMap = {
  [symbol: string]: AssetSentiMentScore[];
};

const OnChainActivities: React.FC<OnChainActivitiesProps> = ({ refreshKey = 0, onAssetSelect, selectedAsset, onFirstAssetLoad, onPriceChartRequest, onBalanceChartRequest, onSentimentChartRequest, onCombinedChartRequest, activeChartType, activeChartAsset, connectedWallets = 0, onLogoCacheUpdate, wallets, sharedPortfolioData }) => {
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
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [hasPersistedData, setHasPersistedData] = useState(false);

  // Initialize Web Workers
  const { startPortfolioSync, isInitialized } = useWebWorkers();

  // Listen for Web Worker portfolio updates
  useEffect(() => {
    if (!isInitialized) return;

    const handlePortfolioUpdate = () => {
      // Check if fresh data is available in session storage
      try {
        const cached = sessionStorage.getItem('portfolio_cache');
        if (cached) {
          const { data } = JSON.parse(cached);
          // Always use fresh data from Web Worker
          console.log('🔄 OnChainActivities: Loading fresh portfolio data from Web Worker');
          setHasPersistedData(true);
          setLoading(false);
          // Process the fresh data...
          // This will be handled by the regular useEffect when portfolio data updates
        }
      } catch (error) {
        console.error('Error loading Web Worker portfolio update:', error);
      }
    };

    // Listen for storage events (when Web Worker updates session storage)
    window.addEventListener('storage', handlePortfolioUpdate);
    
    return () => {
      window.removeEventListener('storage', handlePortfolioUpdate);
    };
  }, [isInitialized]);

  const hiddenAssetsCount = assets.length - filteredAssets.length;

  // Chain summaries from Zerion portfolio data
  const [chainSummaries, setChainSummaries] = useState<Array<{
    chain: string;
    totalValue: number;
    assetCount: number;
    chainName: string;
    iconUrl?: string;
  }>>([]);

  // Filter assets by selected chain
  const chainFilteredAssets = React.useMemo(() => {
    if (selectedChain === 'all') return assets;
    
    // Find the selected chain data to get the proper chain name
    const selectedChainData = chainSummaries.find(c => c.chain === selectedChain);
    if (!selectedChainData) return assets;
    
    return assets.filter(asset => asset.chain.toLowerCase() === selectedChainData.chainName.toLowerCase());
  }, [assets, selectedChain, chainSummaries]);

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

    // Check for cached data first
    const sessionKey = `dashboard_assets_${twitterId}`;
    const persistedData = sessionStorage.getItem(sessionKey);
    
    if (persistedData) {
      try {
        const { assets: cachedAssets, chainSummaries: cachedChainSummaries } = JSON.parse(persistedData);
        // Always use cached data since Web Workers keep it fresh in background
        setAssets(cachedAssets);
        setChainSummaries(cachedChainSummaries);
        setHasPersistedData(true);
        setLoading(false);
        
        if (cachedAssets.length > 0 && onFirstAssetLoad) {
          onFirstAssetLoad(cachedAssets[0]);
        }
        
        // Start background sync with Web Workers to keep data fresh
        if (isInitialized) {
          const allWalletAddresses = [
            ...wallets.eth,
            ...wallets.sol,
            ...wallets.btc,
            ...wallets.tron,
            ...wallets.ton
          ].filter(addr => addr && addr.trim() !== '');
          
          if (allWalletAddresses.length > 0) {
            startPortfolioSync(allWalletAddresses);
          }
        }
        
        return; // Skip API call since we have cached data
      } catch (error) {
        console.error('Error loading persisted OnChainActivities data:', error);
      }
    }

    let retryInterval: NodeJS.Timeout | null = null;
    
    // Fetch balances and chain data from Zerion
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
        
        // Fetch positions data for all wallets (portfolio data comes from shared data)
        let allTokens: Asset[] = [];
        let uniqueSymbols = new Set<string>();
        let aggregatedChainData: { [chainId: string]: { totalValue: number; assetCount: number; chainName: string; iconUrl?: string } } = {};
        
        for (const w of allWallets) {
          if (!w.walletAddress || w.walletAddress.trim() === '') {
            continue;
          }
          
          try {
            // Use shared portfolio data instead of fetching it
            const portfolioData = sharedPortfolioData?.[w.walletAddress]?.portfolio;
            
            // Fetch positions data for detailed asset information
            const positionsRes = await axios.get(`${API_BASE}/balances/positions/${w.walletAddress}`);
            const positionsData = (positionsRes.data as any).data;
            
            // Aggregate chain data across all wallets using shared portfolio data
            if (portfolioData?.chains && portfolioData?.positionsChainsDistribution) {
              for (const [chainId, chainValue] of Object.entries(portfolioData.positionsChainsDistribution)) {
                const chainInfo = portfolioData.chains[chainId];
                const numericChainValue = Number(chainValue);
                if (chainInfo && numericChainValue > 0) {
                  if (!aggregatedChainData[chainId]) {
                    aggregatedChainData[chainId] = {
                      totalValue: 0,
                      assetCount: 0,
                      chainName: chainInfo.name,
                      iconUrl: chainInfo.iconUrl
                    };
                  }
                  aggregatedChainData[chainId].totalValue += numericChainValue;
                }
              }
            }
            
            // Process positions data
            if (positionsData && Array.isArray(positionsData)) {
              for (const position of positionsData) {
                if (position.isDisplayable && position.value > 0) {
                  const asset = position.asset;
                  const chain = position.chain;
                  
                  // Calculate balance from quantity and decimals
                  const decimals = asset.implementations?.[chain.id]?.decimals || 18;
                  const balance = parseFloat(position.quantity) / Math.pow(10, decimals);
                  
                  let assetObj = {
                    name: asset.name,
                    symbol: asset.symbol,
                    chain: chain.name,
                    price: asset.price?.value || 0,
                    balance: balance,
                    value: position.value || 0,
                    priceChange: asset.price?.relativeChange24h ? asset.price.relativeChange24h : 0,
                    sentimentChange: undefined, // Will be populated by our sentiment API
                    sentiment: undefined, // Will be populated by our sentiment API
                    mindShare: undefined, // Will be populated by our sentiment API
                    icon: asset.iconUrl || '',
                    id: asset.name,
                  };
                  

                  
                  allTokens.push(assetObj);
                  if (asset.symbol) uniqueSymbols.add(asset.symbol.toLowerCase());
                  
                  // Update asset count for chain
                  if (aggregatedChainData[chain.id]) {
                    aggregatedChainData[chain.id].assetCount += 1;
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching data for wallet ${w.walletAddress}:`, error);
            // Continue with other wallets even if one fails
          }
        }
        
        // Convert aggregated chain data to array format
        const chainSummariesArray = Object.entries(aggregatedChainData).map(([chainId, data]) => ({
          chain: chainId,
          ...data
        })).sort((a, b) => b.totalValue - a.totalValue);
        
        setChainSummaries(chainSummariesArray);
        
        // Display balances immediately
        allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
        setAssets(allTokens);
        
        // Add only assets without icons to loading state for logos
        const loadingSymbols = new Set(allTokens.filter(token => !token.icon || token.icon === '').map(token => token.symbol.toLowerCase()));
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
          // Keep existing tokens without sentiment data, but remove from loading state
          setLoadingLogos(new Set());
          return;
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
                // Only use database icon if Zerion doesn't have one
                if (!updatedToken.icon || updatedToken.icon === '') {
                  updatedToken.icon = asset.image || "";
                }
                updatedToken.sentiment = parseFloat(asset.sentiment);
                updatedToken.mindShare = parseFloat(((SentimentIndex*50) + 50).toFixed(2));
                updatedToken.id = asset.id;
                break;
              }
            }
          }
          
          // If sentiment data is missing, try to fetch it (but preserve Zerion icon)
          if(updatedToken.sentiment === undefined) {
            // Only fetch if we don't have a Zerion icon, to avoid overwriting it
            // if(!updatedToken.icon || updatedToken.icon === '') {
              fetchMissingSentimentData(updatedToken, totalScore);
            // } else {
            //   // Remove from loading state if we have Zerion icon but no sentiment
            //   setLoadingLogos(prev => {
            //     const newSet = new Set(prev);
            //     newSet.delete(token.symbol.toLowerCase());
            //     return newSet;
            //   });
            // }
          } else {
            // Remove from loading state if we got sentiment data
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
          image: token.icon || '',
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
                    // Only use fallback icon if Zerion doesn't have one
                    icon: (res.image && res.image !== '') ? res.image : (asset.icon || ""),
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
    
    // Start background portfolio sync with Web Workers after initial load
    if (isInitialized) {
      const allWalletAddresses = [
        ...wallets.eth,
        ...wallets.sol,
        ...wallets.btc,
        ...wallets.tron,
        ...wallets.ton
      ].filter(addr => addr && addr.trim() !== '');
      
      if (allWalletAddresses.length > 0) {
        startPortfolioSync(allWalletAddresses);
      }
    }
    
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
    // eslint-disable-next-line
  }, [twitterId, refreshKey, wallets, sharedPortfolioData, isInitialized, startPortfolioSync]);

  // Save assets to session storage when they change
  useEffect(() => {
    if (assets.length > 0 && twitterId) {
      const sessionKey = `dashboard_assets_${twitterId}`;
      const dataToStore = {
        assets,
        chainSummaries,
        timestamp: Date.now()
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(dataToStore));
    }
  }, [assets, chainSummaries, twitterId]);

  // Update assets with sentiment data whenever sentimentCache changes
  useEffect(() => {
    setAssets(prevAssets => prevAssets.map(asset => {
      const sentiment = sentimentCache[asset.symbol.toLowerCase()];
      return sentiment !== undefined ? { ...asset, sentiment } : asset;
    }));
  }, [sentimentCache]);

  // Update filtered assets when showAllAssets, assets, or selectedChain change
  useEffect(() => {
    const filtered = showAllAssets ? chainFilteredAssets : chainFilteredAssets.filter(asset => (asset.value || 0) >= 1);
    setFilteredAssets(filtered);
  }, [showAllAssets, chainFilteredAssets]);

  // Close chain dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.chain-dropdown-container')) {
        setIsChainDropdownOpen(false);
      }
    };

    if (isChainDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChainDropdownOpen]);

  // Listen for portfolio updates from Web Worker
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      // Web Worker has updated portfolio data, reload from session storage
      const cached = sessionStorage.getItem('portfolio_cache');
      if (cached && twitterId) {
        console.log('🔄 Portfolio data updated by Web Worker, refreshing assets...');
        try {
          // Check if we have fresh asset data from Web Worker
          const sessionKey = `dashboard_assets_${twitterId}`;
          const assetData = sessionStorage.getItem(sessionKey);
          if (assetData) {
            const { assets: cachedAssets, chainSummaries: cachedChainSummaries } = JSON.parse(assetData);
            setAssets(cachedAssets);
            setChainSummaries(cachedChainSummaries);
            setHasPersistedData(true);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error refreshing assets from Web Worker update:', error);
        }
      }
    };

    window.addEventListener('portfolio-updated', handlePortfolioUpdate);
    
    return () => {
      window.removeEventListener('portfolio-updated', handlePortfolioUpdate);
    };
  }, [twitterId, wallets]);

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

  const handleCombinedClick = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection
    if (onCombinedChartRequest) {
      onCombinedChartRequest(asset);
    }
  };

  if (connectedWallets === 0) {
    return (
      <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[500px] flex-1 overflow-hidden relative">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-2">
          <div className="text-base font-semibold text-white text-center lg:text-left">Portfolio Overview</div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
            {/* Chain Filter Dropdown */}
            <div className="relative chain-dropdown-container">
                          <button 
                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                className="text-[#A3A3A3] text-sm bg-transparent px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-[#23262b]/20 transition-colors border border-[#23272b] cursor-pointer"
              >
              {selectedChain === 'all' ? (
                <span>All Chains</span>
              ) : (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selectedChainData = chainSummaries.find(c => c.chain === selectedChain);
                    return (
                      <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        {selectedChainData?.iconUrl && selectedChainData.iconUrl.includes("https") ? (
                          <img src={selectedChainData.iconUrl} alt={selectedChain} className="w-4 h-4 rounded-full object-contain" />
                        ) : (
                          <span className="text-white text-xs font-bold">{selectedChainData?.chainName?.charAt(0) || selectedChain.charAt(0)}</span>
                        )}
                      </div>
                    );
                  })()}
                  <span>{chainSummaries.find(c => c.chain === selectedChain)?.chainName || selectedChain}</span>
                </div>
              )}
              <span className={`transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
                         {isChainDropdownOpen && (
               <div className="absolute top-full right-0 mt-1 bg-[rgba(24,26,32,1)] border border-[#23272b] rounded-lg shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto sm:right-0 right-auto left-0">
                <div className="sticky top-0 bg-[rgba(24,26,32,1)] z-10">
                                  <button
                    onClick={() => {
                      setSelectedChain('all');
                      setIsChainDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#23262F] transition-colors first:rounded-t-lg flex items-center justify-between border-b border-[#2a2e35] cursor-pointer ${
                      selectedChain === 'all' ? 'text-[#A259FF]' : 'text-[#A3A3A3]'
                    }`}
                  >
                  <div className="flex items-center justify-between w-full">
                    <span>All Chains</span>
                    <span className="bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{chainSummaries.length}</span>
                  </div>
                </button>
                </div>
                {chainSummaries.map((chain) => (
                  <button
                    key={chain.chain}
                    onClick={() => {
                      setSelectedChain(chain.chain);
                      setIsChainDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#23262F] transition-colors flex items-center justify-between cursor-pointer ${
                      selectedChain === chain.chain ? 'text-[#A259FF]' : 'text-[#A3A3A3]'
                    } ${chain.chain === chainSummaries[chainSummaries.length - 1].chain ? 'last:rounded-b-lg' : ''}`}
                  >
                                          <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                            {chain.iconUrl && chain.iconUrl.includes("https") ? (
                              <img src={chain.iconUrl} alt={chain.chainName} className="w-5 h-5 rounded-full object-contain" />
                            ) : (
                              <span className="text-white text-xs font-bold">{chain.chainName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span>{chain.chainName}</span>
                            <span className="text-xs text-[#666]">${chain.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <span className="bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{chain.assetCount}</span>
                      </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
        <button 
          onClick={() => setShowAllAssets(!showAllAssets)}
          className="text-[#A259FF] text-sm flex items-center gap-1 border border-[#23272b] px-3 py-1 rounded-lg hover:bg-[#23262b]/20 transition-colors cursor-pointer"
        >
          {showAllAssets ? 'Hide Zero Assets' : 'View All Assets'}
          <span className="ml-2 bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">0</span>
        </button>
        </div>
      </div>
        <div className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1">
          <table className="w-full text-sm text-left align-middle table-fixed">
            <thead className="sticky -top-px z-40 bg-[#181A20]">
              <tr className="text-[#A3A3A3] border-b border-[#23262F]">
                  <th className="py-2 px-2 font-medium text-left w-[160px] sticky -left-px bg-[#181A20] z-50">Asset</th>
                  <th className="py-2 px-2 font-medium text-left w-[140px]">
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
                  <th className="py-2 px-2 font-medium text-left w-[130px]">
                      Balance
                  </th>
                  <th className="py-2 px-2 font-medium text-left w-[90px]">
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
                  <th className="py-2 px-2 font-medium text-center w-[90px]">Sentiment</th>
                  <th className="py-2 px-2 font-medium text-center w-[140px]">Sentiment Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500 italic">Add a wallet to get started</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full flex flex-col min-h-[480px] max-h-[500px] flex-1 overflow-hidden relative">
              {/* Preloader overlay - covers entire component */}
        <div className={`absolute inset-0 flex items-center justify-center bg-[#181A20] rounded-2xl transition-opacity duration-500 z-[60] ${loading && !hasPersistedData ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
      
              {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#181A20] z-50">
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
      
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-2">
          <div className="text-base font-semibold text-white text-center lg:text-left">Portfolio Overview</div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
            {/* Chain Filter Dropdown */}
            <div className="relative chain-dropdown-container">
                          <button 
                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                className="text-[#A3A3A3] text-sm bg-transparent px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-[#23262b]/20 transition-colors border border-[#23272b] cursor-pointer"
              >
              {selectedChain === 'all' ? (
                <span>All Chains</span>
              ) : (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selectedChainData = chainSummaries.find(c => c.chain === selectedChain);
                    return (
                      <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        {selectedChainData?.iconUrl && selectedChainData.iconUrl.includes("https") ? (
                          <img src={selectedChainData.iconUrl} alt={selectedChain} className="w-4 h-4 rounded-full object-contain" />
                        ) : (
                          <span className="text-white text-xs font-bold">{selectedChainData?.chainName?.charAt(0) || selectedChain.charAt(0)}</span>
                        )}
                      </div>
                    );
                  })()}
                  <span>{chainSummaries.find(c => c.chain === selectedChain)?.chainName || selectedChain}</span>
                </div>
              )}
              <span className={`transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
                         {isChainDropdownOpen && (
               <div className="absolute top-full right-0 mt-1 bg-[rgba(24,26,32,1)] border border-[#23272b] rounded-lg shadow-lg z-50 min-w-[200px] max-h-60 overflow-y-auto sm:right-0 right-auto left-0">
                <div className="sticky top-0 bg-[rgba(24,26,32,1)] z-10">
                                  <button
                    onClick={() => {
                      setSelectedChain('all');
                      setIsChainDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#23262F] transition-colors first:rounded-t-lg flex items-center justify-between border-b border-[#2a2e35] cursor-pointer ${
                      selectedChain === 'all' ? 'text-[#A259FF]' : 'text-[#A3A3A3]'
                    }`}
                  >
                  <div className="flex items-center justify-between w-full">
                    <span>All Chains</span>
                    <span className="bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{chainSummaries.length}</span>
                  </div>
                </button>
                </div>
                {chainSummaries.map((chain) => (
                  <button
                    key={chain.chain}
                    onClick={() => {
                      setSelectedChain(chain.chain);
                      setIsChainDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#23262F] transition-colors flex items-center justify-between cursor-pointer ${
                      selectedChain === chain.chain ? 'text-[#A259FF]' : 'text-[#A3A3A3]'
                    } ${chain.chain === chainSummaries[chainSummaries.length - 1].chain ? 'last:rounded-b-lg' : ''}`}
                  >
                                          <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                            {chain.iconUrl && chain.iconUrl.includes("https") ? (
                              <img src={chain.iconUrl} alt={chain.chainName} className="w-5 h-5 rounded-full object-contain" />
                            ) : (
                              <span className="text-white text-xs font-bold">{chain.chainName.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span>{chain.chainName}</span>
                            <span className="text-xs text-[#666]">${chain.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <span className="bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{chain.assetCount}</span>
                      </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
        <button 
          onClick={() => setShowAllAssets(!showAllAssets)}
          className="text-[#A259FF] text-sm flex items-center gap-1 border border-[#23272b] px-3 py-1 rounded-lg hover:bg-[#23262b]/20 transition-colors cursor-pointer"
        >
          {showAllAssets ? 'Hide Zero Assets' : 'View All Assets'}
            <span className="ml-2 bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{filteredAssets.length}</span>
        </button>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1">
        <table className="w-full text-sm text-left align-middle table-fixed">
          <thead className="sticky -top-px z-40 bg-[#181A20]">
            <tr className="text-[#A3A3A3] border-b border-[#23262F]">
              <th className="py-2 px-2 font-medium text-left w-[160px] sticky -left-px bg-[#181A20] z-50">Asset</th>
              <th className="py-2 px-2 font-medium text-left w-[160px]">
                    <div className="flex items-center gap-1">
                      Price
                      <Tippy
                        content={
                          <div className="text-xs">
                            <div>Current token price in USD with 24h change</div>
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
                  <th className="py-2 px-2 font-medium text-left w-[130px]">
                      Balance
                  </th>
                  <th className="py-2 px-2 font-medium text-left w-[90px]">
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

                  <th className="py-2 px-2 font-medium text-center w-[90px]">Sentiment%</th>
                  <th className="py-2 px-2 font-medium text-center w-[140px]">
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
                <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                  {hasValidWallets() ? "No assets found in your wallets" : "No wallets connected"}
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset, idx) => (
                <tr 
                  key={asset.symbol + asset.chain + idx} 
                  className={`border-b border-[#23262F] last:border-0 hover:bg-[#23262F] transition-colors duration-150 cursor-pointer group ${selectedAsset?.symbol === asset.symbol && selectedAsset?.chain === asset.chain ? 'bg-[#23262F]' : ''}`}
                  style={{ minHeight: '60px', maxHeight: '60px' }}
                  onClick={() => handleAssetClick(asset)}
                >
                  <td className={`py-2 px-2 w-[160px] sticky -left-px z-20 transition-colors duration-150 ${
                    selectedAsset?.symbol === asset.symbol && selectedAsset?.chain === asset.chain 
                      ? 'bg-[#23262F]' 
                      : 'bg-[#181A20] group-hover:bg-[#23262F]'
                  }`}>
                    <div className="flex items-center gap-2 justify-start min-w-0">
                      <div className="relative flex-shrink-0">
                        {loadingLogos.has(asset.symbol.toLowerCase()) ? (
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                            <div className="flex space-x-0.5">
                              <div className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce"></div>
                              <div className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-0.5 h-0.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        ) : asset.icon && asset.icon.includes("https") ? (
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                            <img src={asset.icon} alt={asset.symbol} className="w-6 h-6 rounded-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{asset.symbol ? asset.symbol[0] : '?'}</span>
                          </div>
                        )}
                        {/* Chain icon overlay */}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-black border border-[#23272b] flex items-center justify-center">
                          {(() => {
                            // Try to find chain by exact name match first, then by partial match
                            let selectedChainData = chainSummaries.find(c => c.chainName?.toLowerCase() === asset.chain.toLowerCase());
                            if (!selectedChainData) {
                              selectedChainData = chainSummaries.find(c => 
                                c.chainName?.toLowerCase().includes(asset.chain.toLowerCase()) || 
                                asset.chain.toLowerCase().includes(c.chainName?.toLowerCase() || '')
                              );
                            }
                            return (
                              <>
                                {selectedChainData?.iconUrl && selectedChainData.iconUrl.includes("https") ? (
                                  <img src={selectedChainData.iconUrl} alt={asset.chain} className="w-2.5 h-2.5 rounded-full object-contain" />
                                ) : (
                                  <span className="text-white text-[8px] font-bold">{asset.chain.charAt(0).toUpperCase()}</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-medium">{asset.name}</div>
                        <div className="text-xs text-[#A3A3A3]">{asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td 
                    className={`py-2 px-2 w-[160px] text-left align-middle cursor-pointer hover:text-[#A259FF] transition-colors ${
                      activeChartType === 'price' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                        ? 'text-[#A259FF]' 
                        : 'text-white'
                    }`}
                    onClick={(e) => handlePriceClick(asset, e)}
                  >
                    <Tippy content="Click to view the Price chart" theme="dark" placement="top">
                      <div>
                        {asset.price !== undefined ? (
                          <span className="flex items-baseline gap-1">
                            <span className="text-base font-medium">
                              ${Number(asset.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {asset.priceChange !== undefined && (
                              <span className={`text-[10px] font-medium ${asset.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {asset.priceChange >= 0 ? '+' : ''}{Number(asset.priceChange).toFixed(2)}%
                              </span>
                            )}
                          </span>
                        ) : '--'}
                      </div>
                    </Tippy>
                  </td>
                  <td className="py-2 px-2 w-[130px] text-white text-left align-middle">
                    {asset.balance !== undefined && asset.symbol ? formatBalance(Number(asset.balance), asset.symbol) : '--'}
                  </td>
                  <td className="py-2 px-2 w-[90px] text-white text-left align-middle">
                    <Tippy content="Click to view the your balance value chart" theme="dark" placement="top">
                      <div                         
                        className={`py-2 px-2 w-[90px] text-left align-middle cursor-pointer hover:text-[#A259FF] transition-colors ${
                          activeChartType === 'balance' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                            ? 'text-[#A259FF]' 
                            : 'text-white'
                        }`}
                        onClick={(e) => handleBalanceClick(asset, e)}>
                        {asset.value !== undefined ? `$${Number(asset.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                      </div>
                    </Tippy>
                  </td>

                  <td className={`py-2 px-2 w-[90px] font-semibold text-center align-middle ${asset.sentiment !== undefined && asset.sentiment > 0 ? 'text-green-400' : asset.sentiment !== undefined && asset.sentiment < 0 ? 'text-red-400' : ''}`}>
                    <Tippy content="Click to view combined Price and Sentiment chart" theme="dark" placement="top">
                      <div onClick={(e) => handleCombinedClick(asset, e)} className="cursor-pointer hover:opacity-80 transition-opacity">
                        {asset.sentiment !== undefined ? `${asset.sentiment >= 0 ? '+' : ''}${asset.sentiment.toFixed(2)}%` : '--'}
                      </div>
                    </Tippy>
                  </td>
                  <td 
                    className={`py-2 px-2 w-[140px] text-center align-middle cursor-pointer hover:opacity-80 transition-opacity ${
                      activeChartType === 'sentiment' && activeChartAsset?.symbol === asset.symbol && activeChartAsset?.chain === asset.chain 
                        ? 'opacity-80' 
                        : ''
                    }`}
                    onClick={(e) => handleSentimentClick(asset, e)}
                  >
                    <Tippy content="Click to view historical sentiment data" theme="dark" placement="top">
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
                        <span className="text-white text-[10px] font-bold z-0">{asset.mindShare !== undefined ? `${asset.mindShare.toFixed(1)}` : '--'}</span>
                      </div>
                    </Tippy>
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
