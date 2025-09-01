import React, { useState, useEffect } from "react";
import ProfileCard from "./ProfileCard";
import OnChainActivities from "./OnChainActivities";
import Display from "./Display";
import Watchlist from "./Watchlist";
import IcoIdo from "./IcoIdo";
// import Suggested from "./Suggested";
import { useSession } from "next-auth/react";

// Helper function to get cached logos from localStorage
const getCachedLogos = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem('logoCache');
    if (!cached) return {};
    
    const parsed = JSON.parse(cached);
    
    // Handle both new format (with timestamp) and legacy format (string only)
    const validEntries: Record<string, string> = {};
    Object.entries(parsed).forEach(([symbol, data]: [string, any]) => {
      if (data && typeof data === 'object' && data.url) {
        // New format: { url: string, timestamp: number }
        validEntries[symbol] = data.url;
      } else if (typeof data === 'string') {
        // Legacy format: direct string
        validEntries[symbol] = data;
      }
    });
    
    return validEntries;
  } catch {
    return {};
  }
};

interface DashboardProps {
  netWorth?: number;
  totalPriceChange?: number;
  refreshKey?: number;
  loadingNetWorth?: boolean;
  connectedWallets?: number;
  // Add wallet data props
  wallets?: {
    eth: string[];
    sol: string[];
    btc: string[];
    tron: string[];
    ton: string[];
  };
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

const Dashboard: React.FC<DashboardProps> = ({ netWorth = 0, totalPriceChange = 0, refreshKey = 0, loadingNetWorth = false, connectedWallets = 0, wallets }) => {
  const { data: session, status } = useSession();
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [showPriceChart, setShowPriceChart] = useState(false);
  const [chartAsset, setChartAsset] = useState<SelectedAsset | null>(null);
  const [chartType, setChartType] = useState<'price' | 'balance' | 'sentiment'>('price');
  const [sharedLogoCache, setSharedLogoCache] = useState<Record<string, string>>(getCachedLogos()); // Initialize from localStorage
  const [allElites, setAllElites] = useState<Set<string>>(new Set());
  const [curatedTweets, setCuratedTweets] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEliteUsers() {
      const res = await fetch('/api/elite');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const eliteSet = new Set(data.map((user: any) => user.username));
        setAllElites(eliteSet);
      }
    }
    fetchEliteUsers();
  }, []);

useEffect(()=> {
  const BATCH_SIZE = 10;
  async function processInBatches(usernames: string[]) {
    const results = [];

    for (let i = 0; i < usernames.length; i += BATCH_SIZE) {
      const batch = usernames.slice(i, i + BATCH_SIZE);

      // Process each batch concurrently
      const batchResults = await Promise.all(
        batch.map(async (username) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/twitter/elite/tweets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, limit: 10 }),
            });
            
            if (!res.ok) {
              console.warn(`Failed to fetch tweets for ${username}: ${res.status}`);
              return [];
            }
            
            const data = await res.json();
            const tweets = data.data || [];
            
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`📊 Fetched ${tweets.length} tweets for @${username}`);
            }
            
            return tweets;
          } catch (error) {
            console.error(`Error fetching tweets for ${username}:`, error);
            return [];
          }
        })
      );

      setTimeout(() => {}, 1000); // Small delay to avoid rate limiting

      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(usernames.length / BATCH_SIZE)}`);
      }
      
      const flattenedBatchResults = batchResults.flat();
      results.push(...flattenedBatchResults);
      
      // Update curatedTweets immediately after each batch for real-time UI updates
      setCuratedTweets(prev => {
        const newTweets = [...prev, ...flattenedBatchResults];
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Updated curatedTweets: ${newTweets.length} total tweets`);
        }
        
        return newTweets;
      });
    }
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🏁 Finished processing all batches. Total tweets: ${results.length}`);
    }
  }
  
  if(allElites.size > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Starting to process ${allElites.size} elite users`);
    }
    const usernames = Array.from(allElites);
    processInBatches(usernames);
  }
}, [allElites]);

  // Debug effect to monitor curatedTweets changes
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 curatedTweets updated: ${curatedTweets.length} tweets`);
    }
  }, [curatedTweets]);

  // Background processing for elite curators on login (only once per session)
  useEffect(() => {
    async function processEliteCurators() {
      if (!session || status !== "authenticated") return;
      const user = session.user as any;
      if (!user || !user.id) return;
      
      // Skip processing if user doesn't have Twitter account
      if (!user.twitterId) {
        console.log('User has no Twitter ID, skipping elite curators processing');
        return;
      }
      
      // Check if we've already processed this user in this session
      const sessionKey = `elite_processed_${user.id}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already processed in this session
      }
      
      try {
        // Check if user has already been processed in database
        const statusRes = await fetch(`/api/elite-curators/status?user_id=${user.id}`);
        const statusData = await statusRes.json();
        
        if (statusRes.ok && statusData.hasBeenProcessed) {
          // User already processed, mark session as processed
          sessionStorage.setItem(sessionKey, 'true');
          return;
        }
        
        // Process elite curators in background (fire and forget)
        fetch('/api/elite-curators/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        }).then(res => res.json())
          .then(data => {
            if (data.count > 0) {
              console.log(`Found ${data.count} elite curators for user`);
            }
            // Mark as processed in session storage
            sessionStorage.setItem(sessionKey, 'true');
            
            // Dispatch background completion event
            window.dispatchEvent(new CustomEvent('eliteBackgroundComplete', { 
              detail: { userId: user.id } 
            }));
          })
          .catch(error => {
            console.error('Error processing elite curators:', error);
          });
      } catch (error) {
        console.error('Error in elite curators processing:', error);
      }
    }
    
    processEliteCurators();
  }, [session, status]);

  if(!session || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">
          Please <a
            href="/"
            className="px-1 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border border-transparent"
            style={{ textDecoration: 'none', borderRadius: '6px' }}
          >
            sign in
          </a> to view your dashboard.
        </p>
      </div>
    );
  }

  const user = session.user;

  const handleAssetSelect = (asset: SelectedAsset) => {
    setSelectedAsset(asset);
    setShowPriceChart(false); // Close chart view when selecting new asset
  };

  const handleFirstAssetLoad = (firstAsset: SelectedAsset) => {
    // Only set the first asset if no asset is currently selected
    if (!selectedAsset) {
      setSelectedAsset(firstAsset);
    }
  };

  const handlePriceChartRequest = (asset: SelectedAsset) => {
    setChartAsset(asset);
    setChartType('price');
    setShowPriceChart(true);
  };

  const handleBalanceChartRequest = (asset: SelectedAsset) => {
    setChartAsset(asset);
    setChartType('balance');
    setShowPriceChart(true);
  };

  const handleSentimentChartRequest = (asset: SelectedAsset) => {
    setChartAsset(asset);
    setChartType('sentiment');
    setShowPriceChart(true);
  };

  const handleLogoCacheUpdate = (logoCache: Record<string, string>) => {
    setSharedLogoCache(prev => ({ ...prev, ...logoCache }));
  };

  return (
          <div className="grid grid-cols-12 gap-4 h-full w-full pb-4">
      {/* Top Row: Profile Card (full width) */}
      <div className="col-span-12">
        <ProfileCard 
          netWorth={netWorth} 
          totalPriceChange={totalPriceChange} 
          loadingNetWorth={loadingNetWorth} 
          connectedWallets={connectedWallets} />
      </div>
    {/* Second Row: Suggested (full width, prominent) */}
    {/* <div className="col-span-12">
      <Suggested />
    </div> */}
    {/* Third Row: OnChain Activities & Display */}
    <div className="col-span-12 md:col-span-7 flex flex-col">
      <OnChainActivities
        refreshKey={refreshKey}
        onAssetSelect={handleAssetSelect}
        selectedAsset={selectedAsset}
        onFirstAssetLoad={handleFirstAssetLoad}
        onPriceChartRequest={handlePriceChartRequest}
        onBalanceChartRequest={handleBalanceChartRequest}
        onSentimentChartRequest={handleSentimentChartRequest}
        activeChartType={showPriceChart ? chartType : null}
        activeChartAsset={showPriceChart ? chartAsset : null}
        connectedWallets={connectedWallets}
        onLogoCacheUpdate={handleLogoCacheUpdate}
        wallets={wallets}
      />
    </div>
    <div className="col-span-12 md:col-span-5 flex flex-col">
      <Display selectedAsset={selectedAsset} showPriceChart={showPriceChart} chartAsset={chartAsset} onCloseChart={() => setShowPriceChart(false)} chartType={chartType} connectedWallets={connectedWallets} sharedLogoCache={sharedLogoCache} curatedTweets={curatedTweets} />
    </div>
    {/* Bottom Row: Watchlist, ICO/IDO */}
    {/* <div className="col-span-12 md:col-span-6">
      <Watchlist />
    </div> */}
    <div className="col-span-12">
      <IcoIdo />
    </div>
  </div>
)};

export default Dashboard; 
