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
  onFirstAssetLoad?: (firstAsset: Asset) => void;
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
  // const [assetSentiMentScoreList, setAssetSentiMentScoreList] = useState<AssetSentimentArrayMap>({});
  const [totalScore, setTotalScore] = useState<number>(0);

  const hiddenAssetsCount = assets.length - filteredAssets.length;


  useEffect(() => {
    if (!twitterId || !wallets) return;
    let retryInterval: NodeJS.Timeout | null = null;
    const fetchAssets = async (assetSentiMentScoreList: AssetSentimentArrayMap, totalScore: number) => {
      let LocalScore = totalScore || 0;
      try {
        if(!assetSentiMentScoreList || Object.keys(assetSentiMentScoreList).length === 0) {
          console.log("No asset sentiment scores found, fetching from API...");
          return;
        }else{
          console.log("Asset Sentiment Score List:", assetSentiMentScoreList['sol']);
        }
        setLoading(true);
// <<<<<<< HEAD
//         // 1. Fetch all wallets for the user
//         const userId = (session?.user as any)?.id || '';
//         const walletsRes = await axios.get(`/api/wallets?user_id=${userId}`);
//         const walletsArr = ((walletsRes.data as any).wallets || []) as Array<{walletAddress: string, chain: string}>;
// =======
        
        // Use the wallets data passed from parent instead of fetching again
        const allWallets = [
          ...wallets.eth.map(walletAddress => ({ walletAddress, chain: 'eth' })),
          ...wallets.sol.map(walletAddress => ({ walletAddress, chain: 'sol' })),
          ...wallets.btc.map(walletAddress => ({ walletAddress, chain: 'btc' })),
          ...wallets.tron.map(walletAddress => ({ walletAddress, chain: 'tron' })),
          ...wallets.ton.map(walletAddress => ({ walletAddress, chain: 'ton' })),
        ];
        
// >>>>>>> 3bd6b8eedb3b14574463e593aa8f758fa01bef8d
        // 2. For each wallet, fetch balances
        let allTokens: Asset[] = [];
        let uniqueSymbols = new Set<string>();
        
        for (const w of allWallets) {
          if (!w.walletAddress || w.walletAddress.trim() === '') {
            continue;
          }
          const balancesRes = await axios.get(`${API_BASE}/balances/address/${w.walletAddress}`);
          const balances = (balancesRes.data as any).balances;
          console.log(assetSentiMentScoreList);
          for (const chain in balances) {
            for (const token of balances[chain]) {
              let notFoundArr: { id: string, name: string, symbol: string, image: string, blockchain: string, address: string }[] = [];
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
              console.log(assetSentiMentScoreList);
              console.log("Asset Object", token);
              console.log(assetSentiMentScoreList[token.symbol.toLowerCase()]);
              if(assetSentiMentScoreList[token.symbol.toLowerCase()]){
                const allAssets = assetSentiMentScoreList[token.symbol.toLowerCase()];
                console.log("Got in Here", allAssets);
                for(const asset of allAssets) {
                  if(asset.name.toLowerCase() == token.name.toLowerCase()){
                    console.log("Found in Asset Sentiment List", token.symbol, token.name);
                    assetObj.icon = asset.image || "";
                    assetObj.sentiment = parseFloat(asset.sentiment).toFixed(2);
                    assetObj.mindShare = (((parseFloat(asset.sentiment) / LocalScore) * 100).toFixed(2));
                    break;
                  }
                }
              }
              if(assetObj.icon == '' || assetObj.sentiment === undefined) {
                console.log("Not Found in Asset Sentiment List", token.symbol.toLowerCase(), token.name.toLowerCase());
                notFoundArr.push({
                  id: token.id,
                  name: token.name,
                  symbol: token.symbol,
                  image: token.image,
                  blockchain: chain,
                  address: token.ethereumAddress,
                });
              }
              if(notFoundArr.length > 0) {
                const missingDataResponse = await fetch(`${API_BASE}/mindshare/addAsset`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ assets: notFoundArr }),
                });
                const missingData = await missingDataResponse.json() as { results: { symbol: string, sentiment: string, image: string }[] };

                missingData.results.forEach((res) => {
                  if (res.symbol.toLowerCase() === token.symbol.toLowerCase()) {
                    LocalScore += parseFloat(res.sentiment);
                    assetObj.icon = res.image || "";
                    assetObj.sentiment = parseFloat(res.sentiment).toFixed(2);
                    assetObj.mindShare = (((parseFloat(res.sentiment) / LocalScore) * 100).toFixed(2));
                  }
                });
              }
              
              allTokens.push(assetObj);
              if (token.symbol) uniqueSymbols.add(token.symbol.toLowerCase());
            }
          }
        }
        console.log("All tokens fetched:", allTokens.length, "Unique symbols:", uniqueSymbols.size);
        // 3. INSTANT DISPLAY: Show balances immediately without waiting for logos
        allTokens.sort((a, b) => (b.value || 0) - (a.value || 0));
        setAssets(allTokens);
        const filteredAssets = showAllAssets ? assets : assets.filter(asset => (asset.value || 0) >= 1);
        setFilteredAssets(filteredAssets);
        setLoading(false); // Stop loading immediately
        
        // 4. Notify parent about first asset immediately
        if (allTokens.length > 0 && onFirstAssetLoad) {
          onFirstAssetLoad(allTokens[0]);
        }
        setTotalScore(LocalScore);
      } catch {
        setAssets([]);
        setLoading(false);
      }
    };

    fetch("/api/sentiments").then(async (res)=>{
      const data = await res.json()
      // setAssetSentiMentScoreList(data.arrayMap);
      // console.log("Asset Sentiment Score List:", assetSentiMentScoreList);
      console.log(data.arrayMap);
      console.log("Total Score:", data.totalScore);
      console.log(!data.arrayMap || Object.keys(data.arrayMap).length === 0);
      setTotalScore(data.totalScore);
      fetchAssets(data.arrayMap, data.totalScore);
    });
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

  // Log cache statistics on mount
  // useEffect(() => {
  //   // Log cache statistics
  //   const cachedLogos = getCachedLogos();
  //   console.log(`Logo cache: ${Object.keys(cachedLogos).length} logos loaded from localStorage`);
  // }, []);

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
              <th className="py-2 px-2 font-medium text-center">Mindshare</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
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
                <td className={`py-2 px-2 font-semibold text-center align-middle`}>{asset.sentiment !== undefined ? asset.sentiment : '--'}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OnChainActivities;