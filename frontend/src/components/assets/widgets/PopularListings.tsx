"use client";
import React, { useState } from "react";
import { FaBitcoin } from "react-icons/fa";

const popularCoins = [
  { rank: 1, name: "Bitcoin", symbol: "BTC", price: "$67,000", change: "+0.03%", icon: <FaBitcoin className="text-yellow-400" />, changeColor: "text-green-400" },
  { rank: 2, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-4 h-4" />, changeColor: "text-green-400" },
  { rank: 3, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-4 h-4" />, changeColor: "text-green-400" },
  { rank: 4, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-4 h-4" />, changeColor: "text-green-400" },
  { rank: 5, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-4 h-4" />, changeColor: "text-green-400" },
];

const newListings = [
  { rank: 1, name: "Solana", symbol: "SOL", price: "$167", change: "+0.03%", icon: <FaBitcoin className="text-yellow-400" />, changeColor: "text-green-400" },
  { rank: 2, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
  { rank: 3, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
  { rank: 4, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
  { rank: 5, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
];

const tabs = [
  { label: "Popular", data: popularCoins },
  { label: "New Listings", data: newListings },
];

const PopularListings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-200 mb-4">Popular</h3>

      <div className="flex space-x-2 mb-3">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150 focus:outline-none ${
              activeTab === idx
                ? "bg-violet-500 text-white"
                : "bg-[#23272b] text-gray-400 hover:bg-[#23272b]/80"
            }`}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2 max-h-32 overflow-y-auto pr-1">
        {tabs[activeTab].data.map((coin) => (
          <li
            key={coin.rank}
            className="flex items-center gap-3 text-xs px-3 py-2"
          >
            <span className="text-gray-400 w-4 font-semibold">{coin.rank}</span>
            <span className="w-4 h-4 flex items-center justify-center">{coin.icon}</span>
            <span className="text-gray-100 font-medium w-12">{coin.symbol}</span>
            <span className="text-gray-400 w-16">{coin.price}</span>
            <span className={`ml-auto font-semibold ${coin.changeColor}`}>
              {coin.change}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PopularListings;

