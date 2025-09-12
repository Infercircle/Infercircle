"use client";
import React, { useContext, useEffect } from "react";
import Dashboard from "@/components/overview/Dashboard";
import { useSession } from "next-auth/react";
import { DashboardContext } from './layout';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useWebWorkers } from '@/hooks/useWebWorkers';

export default function DashboardPage() {
  const { netWorth, totalPriceChange, refreshKey, loadingNetWorth, connectedWallets, wallets, sharedPortfolioData } = useContext(DashboardContext);
  
  const { 
    isInitialLoad, 
    setInitialLoadComplete,
    markDataFetched 
  } = useDashboardStore();

  // Initialize Web Workers for the dashboard
  const { isInitialized } = useWebWorkers();

  // Mark initial load as complete when data is ready
  useEffect(() => {
    if (!loadingNetWorth && connectedWallets !== undefined && isInitialLoad) {
      setInitialLoadComplete();
      markDataFetched();
    }
  }, [loadingNetWorth, connectedWallets, isInitialLoad, setInitialLoadComplete, markDataFetched]);
  
  return (
    <Dashboard
      netWorth={netWorth}
      totalPriceChange={totalPriceChange}
      refreshKey={refreshKey}
      loadingNetWorth={loadingNetWorth && isInitialLoad} // Only show loading on initial load
      connectedWallets={connectedWallets}
      wallets={wallets}
      sharedPortfolioData={sharedPortfolioData}
    />
  );
}
