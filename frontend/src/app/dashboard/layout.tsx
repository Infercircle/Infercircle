'use client';

import React, { useState, createContext } from "react";
import Sidebar from "@/components/Sidebar/sidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import { usePathname } from "next/navigation";
import WalletModalContent from "@/components/WalletModalContent";
import { ToastProvider } from "@/components/ToastProvider";
import Dashboard from "@/components/overview/Dashboard";
import axios from "axios";
import { useSession } from "next-auth/react";
import OnChainActivities from "@/components/overview/OnChainActivities";

export const DashboardContext = createContext<any>(null);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentMarginClass = collapsed ? "ml-16" : "ml-60";
  const pathname = usePathname();
  const isInferAI = pathname === "/dashboard/inferai";
  const showSearch = !isInferAI && pathname !== "/dashboard" && pathname !== "/dashboard/spaces-summarizer";
  const showWallet = !isInferAI && pathname !== "/dashboard/spaces-summarizer";

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
  const connectedWallets = wallets.eth.length + wallets.sol.length + wallets.btc.length + wallets.tron.length + wallets.ton.length;

  // Net worth state
  const [netWorth, setNetWorth] = useState(0);
  // Total price change state
  const [totalPriceChange, setTotalPriceChange] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingNetWorth, setLoadingNetWorth] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  const { data: session, status } = useSession();
  const twitterId = (session?.user as any)?.id || (session?.user as any)?.twitter_id || '';

  // Helper to fetch and sum balances for all wallets and calculate net worth price change
  const fetchAndSumBalances = async () => {
    setLoadingNetWorth(true);
    let total = 0;
    let total24hAgo = 0;
    const allWallets = [
      ...wallets.eth.map(addr => ({ addr, chain: 'eth' })),
      ...wallets.sol.map(addr => ({ addr, chain: 'sol' })),
      ...wallets.btc.map(addr => ({ addr, chain: 'btc' })),
      ...wallets.tron.map(addr => ({ addr, chain: 'tron' })),
      ...wallets.ton.map(addr => ({ addr, chain: 'ton' })),
    ];
    for (const { addr } of allWallets) {
      try {
        const res = await axios.get(`${API_BASE}/balances/address/${addr}`);
        const data = res.data as any;
        if (data.totalBalance && data.totalBalance24hAgo) {
          // Sum all chains for this wallet
          total += Object.values(data.totalBalance).reduce((a: number, b: any) => a + Number(b || 0), 0);
          total24hAgo += Object.values(data.totalBalance24hAgo).reduce((a: number, b: any) => a + Number(b || 0), 0);
        }
      } catch {}
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
    try {
      // Always use backend proxy for balance fetch
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
    if (!twitterId) return;
    try {
      const res = await axios.get(`${API_BASE}/userwallets/${twitterId}`);
      const walletsArr = ((res.data as any).wallets || []) as Array<{wallet_address: string, chain: string}>;
      // Group wallets by chain
      const grouped: { eth: string[]; sol: string[]; btc: string[]; tron: string[]; ton: string[] } = { eth: [], sol: [], btc: [], tron: [], ton: [] };
      for (const w of walletsArr) {
        if (grouped[w.chain as keyof typeof grouped]) grouped[w.chain as keyof typeof grouped].push(w.wallet_address);
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
    if (connectedWallets > 0) fetchAndSumBalances();
    else {
      setNetWorth(0);
      setTotalPriceChange(0);
    }
    // eslint-disable-next-line
  }, [wallets, refreshKey]);

  return (
    <DashboardContext.Provider value={{
      netWorth,
      totalPriceChange,
      refreshKey,
      loadingNetWorth
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
          <main className="pt-6 px-6">
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
  );
} 