'use client';

import React, { useState, createContext, Suspense, useEffect } from "react";
import Sidebar from "@/components/Sidebar/sidebar";
import MobileSidebar from "@/components/Sidebar/MobileSidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import { usePathname, useSearchParams } from "next/navigation";
import WalletModalContent from "@/components/WalletModalContent";
import { ToastProvider } from "@/components/ToastProvider";
import axios from "axios";
import { useSession } from "next-auth/react";
import { AddXModal } from "@/components/AddXModal";
import { useRouter } from "next/navigation";
import { getUserById } from "@/actions/queries";
import { User } from "@prisma/client";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useWebWorkers } from "@/hooks/useWebWorkers";

export const DashboardContext = createContext<any>(null);

// Separate component to handle search params
function SearchParamsHandler({ onAddXChange }: { onAddXChange: (addX: boolean) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const addX = searchParams.get('addX') === 'true';
    onAddXChange(addX);
  }, [searchParams, onAddXChange]);
  
  return null;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const contentMarginClass = collapsed ? "ml-0 md:ml-14" : "ml-0 md:ml-56";

  const pathname = usePathname();
  const isInferAI = pathname === "/dashboard/inferai";
  const isOverviewPage = pathname === "/dashboard";
  const showSearch = !isInferAI && pathname !== "/dashboard" && pathname !== "/dashboard/content-summarizer" && pathname !== "/dashboard/pre-tge" && pathname !== "/dashboard/post-tge-projects" && pathname !== "/dashboard/token-sales";
  const showWallet = !isInferAI && pathname !== "/dashboard/content-summarizer";
  const showMobileMenu = pathname.startsWith("/dashboard");
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as User;
  const [addX, setAddX] = useState<boolean>(false);
  const [dbUser, setDbUser] = useState<User | null>(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use Zustand store instead of local state
  const {
    netWorth,
    totalPriceChange,
    loadingNetWorth,
    wallets,
    walletsLoaded,
    connectedWallets,
    sharedPortfolioData,
    refreshKey,
    setNetWorth,
    setTotalPriceChange,
    setLoadingNetWorth,
    setWallets,
    setWalletsLoaded,
    setSharedPortfolioData,
    incrementRefreshKey,
    resetDashboardState
  } = useDashboardStore();
  
  // Initialize Web Workers for background data fetching
  const { startPortfolioSync, isInitialized } = useWebWorkers();
  
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (session && session.user) {
      const user = session.user as User;
      if (!user) {
        router.push("/");
      }
    } else if (status === "unauthenticated") {
      router.push("/");
    }
  },[session]);

  // Disable page scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if(user){
      getUserById(user.id).then((dbUser) => {
        if (dbUser) {
          router.push('/');
        }
        setDbUser(dbUser);
      });
    }
  },[user]);
  
  // Wallet modal state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const openWalletModal = () => setWalletModalOpen(true);
  const closeWalletModal = () => setWalletModalOpen(false);
  
  const shouldShowFocusEffect = isOverviewPage && walletsLoaded && connectedWallets === 0 && status === "authenticated";

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  const twitterId = (session?.user as any)?.id || (session?.user as any)?.twitter_id || '';

  // Helper to fetch portfolio data from Zerion for all wallets and calculate net worth
  const fetchAndSumBalances = async () => {
    setLoadingNetWorth(true);
    let totalValue = 0;
    let weightedPriceChange = 0;
    const allWallets = [
      ...wallets.eth.map(walletAddress => ({ addr: walletAddress, chain: 'eth' })),
      ...wallets.sol.map(walletAddress => ({ addr: walletAddress, chain: 'sol' })),
      ...wallets.btc.map(walletAddress => ({ addr: walletAddress, chain: 'btc' })),
      ...wallets.tron.map(walletAddress => ({ addr: walletAddress, chain: 'tron' })),
      ...wallets.ton.map(walletAddress => ({ addr: walletAddress, chain: 'ton' })),
    ];
    
    const newSharedPortfolioData: { [walletAddress: string]: any } = {};
    
    for (const { addr } of allWallets) {
      // Skip if addr is undefined or empty
      if (!addr || addr.trim() === '') {
        continue;
      }
      
      try {
        // Use Zerion portfolio endpoint to get total value and 24h change
        const res = await axios.get(`${API_BASE}/balances/portfolio/${addr}`);
        const data = res.data as any;
        if (data.data && data.data.totalValue !== undefined) {
          const walletValue = data.data.totalValue;
          totalValue += walletValue;
          
          // Store portfolio data for OnChainActivities
          newSharedPortfolioData[addr] = {
            portfolio: data.data,
            chains: data.data.chains,
            positionsChainsDistribution: data.data.positionsChainsDistribution
          };
          
          // Calculate weighted price change (wallet value * relative change)
          if (data.data.change24h && data.data.change24h.relative !== undefined) {
            // relative is already a percentage (e.g., -1.229 for -122.9%)
            weightedPriceChange += walletValue * data.data.change24h.relative;
          }
        }
      } catch (error) {
        console.error(`Error fetching portfolio for ${addr}:`, error);
      }
    }
    
    // Update shared portfolio data
    setSharedPortfolioData(newSharedPortfolioData);
    
    setNetWorth(totalValue);
    
    // Calculate weighted average price change using the formula: (Σ(Vi × ri)) / Σ(Vi)
    let aggregatePriceChange = 0;
    if (totalValue > 0) {
      aggregatePriceChange = weightedPriceChange / totalValue; // Already in percentage
    }
    setTotalPriceChange(aggregatePriceChange);
    setLoadingNetWorth(false);
  };

  // Add this callback to handle instant portfolio fetch and net worth update
  const handleWalletAdded = async (addr: string, chain: string) => {
    // Skip if addr is undefined or empty
    if (!addr || addr.trim() === '') {
      return;
    }
    try {
      // Use Zerion portfolio endpoint for instant net worth update
      const res = await axios.get(`${API_BASE}/balances/portfolio/${addr}`);
      const data = res.data as any;
      if (data.data && data.data.totalValue !== undefined) {
        setNetWorth(netWorth + data.data.totalValue);
      }
    } catch (error) {
      console.error(`Error fetching portfolio for newly added wallet ${addr}:`, error);
    }
  };

  // Fetch wallets from backend on mount and when user logs in
  const refreshWallets = async () => {
    const userId = (user as any)?.id || '';
    
    if (!userId) {
      setWalletsLoaded(true);
      return;
    }
    
    try {
      const res = await axios.get(`/api/wallets?user_id=${userId}`);
      const walletsArr = ((res.data as any).wallets || []) as Array<{walletAddress: string, chain: string}>;
      
      // Group wallets by chain
      const grouped: { eth: string[]; sol: string[]; btc: string[]; tron: string[]; ton: string[] } = { eth: [], sol: [], btc: [], tron: [], ton: [] };
      
      for (const w of walletsArr) {
        // Skip if walletAddress is undefined or empty
        if (!w.walletAddress || w.walletAddress.trim() === '') {
          continue;
        }
        
        if (grouped[w.chain as keyof typeof grouped]) {
          grouped[w.chain as keyof typeof grouped].push(w.walletAddress);
        } else {
        }
      }
      
      setWallets(grouped);
      setWalletsLoaded(true);
    } catch (e) {
      setWallets({ eth: [], sol: [], btc: [], tron: [], ton: [] });
      setWalletsLoaded(true);
    }
  };

  React.useEffect(() => {
    if (status === "authenticated" && user?.id) {
      setWalletsLoaded(false); // Reset to false before fetching
      refreshWallets();
    } else if (status === "unauthenticated") {
      setWalletsLoaded(true); // Set to true for unauthenticated users
      resetDashboardState(); // Clear dashboard state when user logs out
    }
    // eslint-disable-next-line
  }, [twitterId, status, user?.id]);

  // Recalculate net worth and price change when wallets or refreshKey change
  React.useEffect(() => {
    if (connectedWallets > 0) {
      fetchAndSumBalances();
    } else {
      setNetWorth(0);
      setTotalPriceChange(0);
    }
    // eslint-disable-next-line
  }, [wallets, refreshKey]);

  // Start Web Workers background sync when wallets are loaded and workers are initialized
  React.useEffect(() => {
    if (isInitialized && walletsLoaded && connectedWallets > 0 && twitterId) {
      // Convert wallets to format expected by Web Worker
      const allWalletAddresses = [
        ...wallets.eth,
        ...wallets.sol,
        ...wallets.btc,
        ...wallets.tron,
        ...wallets.ton
      ].filter(addr => addr && addr.trim() !== '');

      if (allWalletAddresses.length > 0) {
        console.log('🚀 Starting Web Workers background sync with', allWalletAddresses.length, 'wallets');
        startPortfolioSync(allWalletAddresses);
      }
    }
  }, [isInitialized, walletsLoaded, connectedWallets, twitterId, wallets, startPortfolioSync]);


  return (
    <div>
      <Suspense fallback={null}>
        <SearchParamsHandler onAddXChange={setAddX} />
      </Suspense>
      {(!user || !user.username || user.username.length < 0 || !user.email) && (addX == true) && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
          <AddXModal onClose={setAddX} isGoogle={(user && (!user.username || user.username.length < 0)) ? false : true}/>
        </div>
      )}
      <div 
        className={`${((!user || !user.username || user.username.length < 0 || !user.email) 
          || !(session && session.user && (session.user as User)))  && addX == true
          ? "blur": ""}`}
      >
        <DashboardContext.Provider value={{
          netWorth,
          totalPriceChange,
          refreshKey,
          loadingNetWorth,
          connectedWallets,
          wallets,
          sharedPortfolioData
        }}>
          <ToastProvider>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            
            <div className={`${contentMarginClass} transition-all duration-300 ${mobileMenuOpen ? 'opacity-20' : 'opacity-100'}`}>
              <Navbar
                collapsed={collapsed}
                showConnectWallet={showWallet}
                showAuthButtons={false}
                showSearch={showSearch}
                onOpenWalletModal={openWalletModal}
                connectedWallets={connectedWallets}
                onToggleMobileMenu={showMobileMenu ? toggleMobileMenu : undefined}
                shouldShowFocusEffect={shouldShowFocusEffect}
              />
              <main className={`pt-4 px-4 transition-all duration-300 ${shouldShowFocusEffect ? 'opacity-30' : 'opacity-100'}`}>
                {children}
              </main>
            </div>
            <Modal isOpen={walletModalOpen} onClose={closeWalletModal}>
              <WalletModalContent
                eth={wallets.eth}
                sol={wallets.sol}
                btc={wallets.btc}
                tron={wallets.tron}
                ton={wallets.ton}
                setWallets={setWallets as any}
                onWalletAdded={handleWalletAdded}
                refreshWallets={refreshWallets}
                onWalletsChanged={incrementRefreshKey}
              />
            </Modal>
            
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                {/* Transparent backdrop for click-outside functionality */}
                <div 
                  className="absolute inset-0"
                  onClick={closeMobileMenu}
                />
                
                {/* Mobile Sidebar - Same size as desktop */}
                <div className="absolute left-0 top-0 h-full w-56 bg-[rgba(24,26,32,0.98)] border-r border-[#23272b] shadow-[4px_0px_6px_#00000040]">
                  <MobileSidebar onClose={closeMobileMenu} />
                </div>
              </div>
            )}
          </ToastProvider>
        </DashboardContext.Provider>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
} 