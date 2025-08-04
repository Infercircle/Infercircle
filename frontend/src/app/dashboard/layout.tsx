'use client';

import React, { useState, createContext, Suspense, useEffect } from "react";
import Sidebar from "@/components/Sidebar/sidebar";
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

export const DashboardContext = createContext<any>(null);

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentMarginClass = collapsed ? "ml-16" : "ml-60";
  const pathname = usePathname();
  const isInferAI = pathname === "/dashboard/inferai";
  const showSearch = !isInferAI && pathname !== "/dashboard" && pathname !== "/dashboard/spaces-summarizer" && pathname !== "/dashboard/pre-tge" && pathname !== "/dashboard/post-tge-projects" && pathname !== "/dashboard/token-sales";
  const showWallet = !isInferAI && pathname !== "/dashboard/spaces-summarizer";
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as User;
  const searchParams = useSearchParams();
  const [addX, setAddX] = useState<boolean>(searchParams.get('addX') === 'true');
  const [dbUser, setDbUser] = useState<User | null>(user);

  useEffect(() => {
    if(user){
      getUserById(user.id).then((dbUser) => {
        if (dbUser && dbUser.inviteAccepted) {
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
  // Wallets state (object for eth and sol)
  const [wallets, setWallets] = useState<{
    eth: string[];
    sol: string[];
    btc: string[];
    tron: string[];
    ton: string[];
  }>({ eth: [], sol: [], btc: [], tron: [], ton: [] });
  // Compute connectedWallets directly from wallets
  const connectedWallets =
    wallets.eth.length +
    wallets.sol.length +
    wallets.btc.length +
    wallets.tron.length +
    wallets.ton.length;
  // Net worth state
  const [netWorth, setNetWorth] = useState(0);
  // Total price change state
  const [totalPriceChange, setTotalPriceChange] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingNetWorth, setLoadingNetWorth] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  const twitterId = (session?.user as any)?.id || (session?.user as any)?.twitter_id || '';

  // Helper to fetch and sum balances for all wallets and calculate net worth price change
  const fetchAndSumBalances = async () => {
    setLoadingNetWorth(true);
    let total = 0;
    let total24hAgo = 0;
    const allWallets = [
      ...wallets.eth.map(walletAddress => ({ addr: walletAddress, chain: 'eth' })),
      ...wallets.sol.map(walletAddress => ({ addr: walletAddress, chain: 'sol' })),
      ...wallets.btc.map(walletAddress => ({ addr: walletAddress, chain: 'btc' })),
      ...wallets.tron.map(walletAddress => ({ addr: walletAddress, chain: 'tron' })),
      ...wallets.ton.map(walletAddress => ({ addr: walletAddress, chain: 'ton' })),
    ];
    
    for (const { addr } of allWallets) {
      // Skip if addr is undefined or empty
      if (!addr || addr.trim() === '') {
        continue;
      }
      
      try {
        const res = await axios.get(`${API_BASE}/balances/address/${addr}`);
        const data = res.data as any;
        if (data.totalBalance && data.totalBalance24hAgo) {
          // Sum all chains for this wallet
          const walletTotal = Object.values(data.totalBalance).reduce((a: number, b: any) => a + Number(b || 0), 0);
          const walletTotal24hAgo = Object.values(data.totalBalance24hAgo).reduce((a: number, b: any) => a + Number(b || 0), 0);
          total += walletTotal;
          total24hAgo += walletTotal24hAgo;
        } else {
        }
      } catch (error) {
      }
    }
    
    setNetWorth(total);
    // Calculate price change percentage
    let priceChange = 0;
    if (total24hAgo > 0) {
      priceChange = ((total - total24hAgo) / total24hAgo) * 100;
    }
    setTotalPriceChange(priceChange);
    setLoadingNetWorth(false);
  };

  // Add this callback to handle instant balance fetch and net worth update
  const handleWalletAdded = async (addr: string, chain: string) => {
    // Skip if addr is undefined or empty
    if (!addr || addr.trim() === '') {
      return;
    }
    try {
      // proxy for balance fetch
      const res = await axios.get(`${API_BASE}/balances/address/${addr}`);
      const balances = (res.data as any).balances;
      let walletTotal = 0;
      for (const chainKey in balances) {
        for (const token of balances[chainKey]) {
          walletTotal += Number(token.usd || 0);
        }
      }
      setNetWorth(prev => prev + walletTotal);
    } catch {}
  };

  // Fetch wallets from backend on mount and when user logs in
  const refreshWallets = async () => {
    const userId = (user as any)?.id || '';
    
    if (!userId) {
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
    } catch (e) {
      setWallets({ eth: [], sol: [], btc: [], tron: [], ton: [] });
    }
  };

  React.useEffect(() => {
    refreshWallets();
    // eslint-disable-next-line
  }, [twitterId]);

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


  return (
    <div>
      {(!user || !user.username || user.username.length < 0 || !user.email) && (addX == true) && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
          <AddXModal onClose={setAddX} isGoogle={(user && (!user.username || user.username.length < 0)) ? false : true}/>
        </div>
      )}
      <div 
        className={`${((!user || !user.username || user.username.length < 0 || !user.email) 
          || !(session && session.user && (session.user as User).inviteAccepted))  && addX == true
          ? "blur": ""}`}
      >
        <DashboardContext.Provider value={{
          netWorth,
          totalPriceChange,
          refreshKey,
          loadingNetWorth,
          connectedWallets,
          wallets
        }}>
          <ToastProvider>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className={`${contentMarginClass} transition-all duration-300`}>
              <Navbar
                collapsed={collapsed}
                showConnectWallet={showWallet}
                showAuthButtons={false}
                showSearch={showSearch}
                onOpenWalletModal={openWalletModal}
                connectedWallets={connectedWallets}
              />
              <main className="pt-4 px-4">
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
                setWallets={setWallets}
                onWalletAdded={handleWalletAdded}
                refreshWallets={refreshWallets}
                onWalletsChanged={() => setRefreshKey(k => k + 1)}
              />
            </Modal>
          </ToastProvider>
        </DashboardContext.Provider>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
} 