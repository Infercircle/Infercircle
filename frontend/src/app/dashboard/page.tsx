"use client";
import React, { useState, useEffect } from "react";
import Dashboard from "@/components/overview/Dashboard";
import axios from "axios";
import { useSession } from "next-auth/react";

export default function OverviewPage() {
  const [wallets, setWallets] = useState<{
    eth: string[];
    sol: string[];
    btc: string[];
    tron: string[];
    ton: string[];
  }>({ eth: [], sol: [], btc: [], tron: [], ton: [] });
  const [netWorth, setNetWorth] = useState(0);
  const [totalPriceChange, setTotalPriceChange] = useState(0);

  const { data: session } = useSession();
  const twitterId = (session?.user as any)?.id || (session?.user as any)?.twitter_id || '';
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

  // Fetch wallets from backend on mount and when user logs in
  useEffect(() => {
    if (!twitterId) return;
    const fetchWallets = async () => {
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
    fetchWallets();
    // eslint-disable-next-line
  }, [twitterId]);

  // Helper to fetch and sum balances for all wallets
  const fetchAndSumBalances = async () => {
    // Aggregate balances and net worth across all user wallets to compute the overall net worth and 24h price change
    try {
      // For each wallet, fetch balances and sum totalBalance and totalBalance24hAgo across all wallets
      const allWallets = [
        ...wallets.eth,
        ...wallets.sol,
        ...wallets.btc,
        ...wallets.tron,
        ...wallets.ton,
      ];
      if (allWallets.length === 0) {
        setNetWorth(0);
        setTotalPriceChange(0);
        return;
      }
      let totalBalanceSum = 0;
      let totalBalance24hAgoSum = 0;
      for (const addr of allWallets) {
        const res = await axios.get(`${API_BASE}/balances/address/${addr}`);
        const data = res.data as any;
        totalBalanceSum += data.totalBalance ? Object.values(data.totalBalance).reduce((acc: number, val: any) => acc + Number(val), 0) : 0;
        totalBalance24hAgoSum += data.totalBalance24hAgo ? Object.values(data.totalBalance24hAgo).reduce((acc: number, val: any) => acc + Number(val), 0) : 0;
      }
      setNetWorth(Number(totalBalanceSum));
      // Calculate percentage change in net worth over the last 24 hours
      let priceChange = 0;
      if (totalBalance24hAgoSum > 0) {
        priceChange = ((Number(totalBalanceSum) - Number(totalBalance24hAgoSum)) / Number(totalBalance24hAgoSum)) * 100;
      }
      setTotalPriceChange(priceChange);
    } catch {
      setNetWorth(0);
      setTotalPriceChange(0);
    }
  };

  // Recalculate net worth when wallets change
  useEffect(() => {
    const connectedWallets = wallets.eth.length + wallets.sol.length + wallets.btc.length + wallets.tron.length + wallets.ton.length;
    if (connectedWallets > 0) fetchAndSumBalances();
    else setNetWorth(0);
    // eslint-disable-next-line
  }, [wallets]);

  return (
    <div>
      <Dashboard netWorth={netWorth} totalPriceChange={totalPriceChange} />
    </div>
  );
}
