"use client";
import React, { useState, useEffect, useContext } from "react";
import Dashboard from "@/components/overview/Dashboard";
import axios from "axios";
import { useSession } from "next-auth/react";
import { DashboardContext } from './layout';

export default function DashboardPage() {
  const { netWorth, totalPriceChange, refreshKey, loadingNetWorth, connectedWallets, wallets } = useContext(DashboardContext);
  return (
    <Dashboard
      netWorth={netWorth}
      totalPriceChange={totalPriceChange}
      refreshKey={refreshKey}
      loadingNetWorth={loadingNetWorth}
      connectedWallets={connectedWallets}
      wallets={wallets}
    />
  );
}
