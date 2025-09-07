import { Asset } from '@/components/overview/Dashboard';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface WalletData {
  eth: string[];
  sol: string[];
  btc: string[];
  tron: string[];
  ton: string[];
}

interface SharedPortfolioData {
  [walletAddress: string]: {
    portfolio: any;
    chains: any;
    positionsChainsDistribution: any;
  };
}

interface DashboardState {
  // Core financial data
  netWorth: number;
  totalPriceChange: number;
  loadingNetWorth: boolean;
  
  // Wallet data
  wallets: WalletData;
  walletsLoaded: boolean;
  connectedWallets: number;
  sharedPortfolioData: SharedPortfolioData;
  
  // UI state for dashboard
  selectedAsset: Asset | null;
  showPriceChart: boolean;
  chartAsset: Asset | null;
  chartType: 'price' | 'balance' | 'sentiment' | 'combined' | null;
  
  // Logo cache
  sharedLogoCache: Record<string, string>;
  
  // Elite curators data
  allElites: Set<string>;
  curatedTweets: any[];
  
  // Refresh key for triggering re-fetches
  refreshKey: number;
  
  // Loading state management
  isInitialLoad: boolean;
  lastDataFetch: number | null;
  
  // Actions
  setNetWorth: (netWorth: number) => void;
  setTotalPriceChange: (change: number) => void;
  setLoadingNetWorth: (loading: boolean) => void;
  setWallets: (wallets: WalletData) => void;
  setWalletsLoaded: (loaded: boolean) => void;
  setSharedPortfolioData: (data: SharedPortfolioData) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  setShowPriceChart: (show: boolean) => void;
  setChartAsset: (asset: Asset | null) => void;
  setChartType: (type: 'price' | 'balance' | 'sentiment' | 'combined' | null) => void;
  updateLogoCache: (logos: Record<string, string>) => void;
  setAllElites: (elites: Set<string>) => void;
  setCuratedTweets: (tweets: any[]) => void;
  addCuratedTweets: (tweets: any[]) => void;
  incrementRefreshKey: () => void;
  
  // Loading state actions
  setInitialLoadComplete: () => void;
  shouldRefreshData: () => boolean;
  markDataFetched: () => void;
  
  // Computed values
  updateConnectedWallets: () => void;
  
  // Reset functions for when user logs out
  resetDashboardState: () => void;
}

const initialState = {
  netWorth: 0,
  totalPriceChange: 0,
  loadingNetWorth: true,
  wallets: { eth: [], sol: [], btc: [], tron: [], ton: [] },
  walletsLoaded: false,
  connectedWallets: 0,
  sharedPortfolioData: {},
  selectedAsset: null,
  showPriceChart: false,
  chartAsset: null,
  chartType: 'price' as const,
  sharedLogoCache: getCachedLogos(), // Initialize from localStorage
  allElites: new Set<string>(),
  curatedTweets: [],
  refreshKey: 0,
  isInitialLoad: true,
  lastDataFetch: null,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setNetWorth: (netWorth) => set({ netWorth }),
      setTotalPriceChange: (totalPriceChange) => set({ totalPriceChange }),
      setLoadingNetWorth: (loadingNetWorth) => set({ loadingNetWorth }),
      
      setWallets: (wallets) => {
        set({ wallets });
        get().updateConnectedWallets();
      },
      setWalletsLoaded: (walletsLoaded) => set({ walletsLoaded }),
      setSharedPortfolioData: (sharedPortfolioData) => set({ sharedPortfolioData }),
      
      setSelectedAsset: (selectedAsset) => set({ selectedAsset }),
      setShowPriceChart: (showPriceChart) => set({ showPriceChart }),
      setChartAsset: (chartAsset) => set({ chartAsset }),
      setChartType: (chartType) => set({ chartType }),
      
      updateLogoCache: (logos) => 
        set((state) => ({ 
          sharedLogoCache: { ...state.sharedLogoCache, ...logos } 
        })),
      
      setAllElites: (allElites) => set({ allElites }),
      setCuratedTweets: (curatedTweets) => set({ curatedTweets }),
      addCuratedTweets: (newTweets) => 
        set((state) => ({ 
          curatedTweets: [...state.curatedTweets, ...newTweets] 
        })),
      
      incrementRefreshKey: () => 
        set((state) => ({ refreshKey: state.refreshKey + 1 })),
      
      // Loading state actions
      setInitialLoadComplete: () => set({ isInitialLoad: false }),
      
      shouldRefreshData: () => {
        const { lastDataFetch } = get();
        if (!lastDataFetch) return true;
        // Refresh if data is older than 5 minutes
        return Date.now() - lastDataFetch > 5 * 60 * 1000;
      },
      
      markDataFetched: () => set({ lastDataFetch: Date.now() }),
      
      updateConnectedWallets: () => {
        const { wallets } = get();
        const connectedWallets = 
          wallets.eth.length +
          wallets.sol.length +
          wallets.btc.length +
          wallets.tron.length +
          wallets.ton.length;
        set({ connectedWallets });
      },
      
      resetDashboardState: () => set(initialState),
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        // Only persist certain parts of the state
        selectedAsset: state.selectedAsset,
        sharedLogoCache: state.sharedLogoCache,
        allElites: Array.from(state.allElites), // Convert Set to Array for persistence
        curatedTweets: state.curatedTweets,
        lastDataFetch: state.lastDataFetch,
        isInitialLoad: state.isInitialLoad,
        // Don't persist sensitive data like wallets, net worth etc.
      }),
    }
  )
);
