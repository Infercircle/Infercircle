import React, { useState } from "react";
import ProfileCard from "./ProfileCard";
import OnChainActivities from "./OnChainActivities";
import Display from "./Display";
import Watchlist from "./Watchlist";
import IcoIdo from "./IcoIdo";
// import Suggested from "./Suggested";
import { useSession } from "next-auth/react";

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
  const [chartType, setChartType] = useState<'price' | 'balance'>('price');
  const [sharedLogoCache, setSharedLogoCache] = useState<Record<string, string>>({});

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

  const handleLogoCacheUpdate = (logoCache: Record<string, string>) => {
    setSharedLogoCache(prev => ({ ...prev, ...logoCache }));
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full w-full pb-4">
      {/* Top Row: Profile Card (full width) */}
      <div className="col-span-12">
        <ProfileCard netWorth={netWorth} totalPriceChange={totalPriceChange} loadingNetWorth={loadingNetWorth} connectedWallets={connectedWallets} />
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
        activeChartType={showPriceChart ? chartType : null}
        activeChartAsset={showPriceChart ? chartAsset : null}
        connectedWallets={connectedWallets}
        onLogoCacheUpdate={handleLogoCacheUpdate}
        wallets={wallets}
      />
    </div>
    <div className="col-span-12 md:col-span-5 flex flex-col">
      <Display selectedAsset={selectedAsset} showPriceChart={showPriceChart} chartAsset={chartAsset} onCloseChart={() => setShowPriceChart(false)} chartType={chartType} connectedWallets={connectedWallets} sharedLogoCache={sharedLogoCache} />
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