"use client"
import React, { useState } from "react";
import Tabs from "./Tabs";
import CryptoTable from "./CryptoTable";

const allCoins = [
  {
    rank: 1,
    name: "Bitcoin",
    symbol: "BTC",
    price: "$67,000",
    change1h: "+0.10%",
    change24h: "-0.11%",
    change7d: "+0.10%",
    marketCap: "$2,131,033,264,787",
    volume24h: "$44,542,594,240",
    supply: "19.88M BTC",
    icon: "bitcoin",
    type: "crypto",
  },
  {
    rank: 2,
    name: "Pengu",
    symbol: "PENGU",
    price: "$0.01085",
    change1h: "+0.10%",
    change24h: "-0.11%",
    change7d: "+0.10%",
    marketCap: "$1,000,000,000",
    volume24h: "$10,000,000",
    supply: "1.00B PENGU",
    icon: "pengu",
    type: "social",
  },
  // Add more coins with different types for demo
];

const tabMap = [
  { label: "All Crypto", filter: () => true },
  { label: "Socials", filter: (coin: any) => coin.type === "social" },
  { label: "Gainers", filter: () => true }, // Placeholder
  { label: "Losers", filter: () => true }, // Placeholder
  { label: "ATH", filter: () => true }, // Placeholder
  { label: "Ecosystems", filter: () => true }, // Placeholder
];

const AssetTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const filteredCoins = allCoins.filter(tabMap[activeTab].filter);

  return (
    <div>
      <Tabs onTabChange={setActiveTab} />
      <CryptoTable coins={filteredCoins} />
    </div>
  );
};

export default AssetTable; 