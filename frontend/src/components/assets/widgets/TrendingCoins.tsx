"use client";
import React from "react";
import { FaBitcoin } from "react-icons/fa";

const trendingCoins = [
  { rank: 1, name: "Bitcoin", symbol: "BTC", price: "$67,000", change: "+0.03%", icon: <FaBitcoin className="text-yellow-400" />, changeColor: "text-green-400" },
  { rank: 2, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
  { rank: 3, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
  { rank: 4, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
  { rank: 5, name: "Pengu", symbol: "PENGU", price: "$0.01085", change: "+0.03%", icon: <img src="/icons/logo.svg" alt="PENGU" className="w-5 h-5" />, changeColor: "text-green-400" },
];

const TrendingCoins: React.FC = () => (
  <div>
    <h3 className="text-sm font-bold text-white mb-2">Trending Coins</h3>
    <div className="h-[170px] overflow-y-scroll pr-1 custom-scrollbar">
      <ul className="space-y-2">
        {trendingCoins.map((coin) => (
          <li
            key={coin.rank}
            className="flex items-center gap-3 text-sm  rounded-md px-3 py-2"
          >
            <span className="w-4 text-gray-400 font-semibold">{coin.rank}</span>
            <span className="w-5 h-5 flex items-center justify-center">{coin.icon}</span>
            <span className="font-semibold text-white">{coin.symbol}</span>
            <span className="text-gray-400">{coin.price}</span>
            <span className={`ml-auto font-semibold ${coin.changeColor}`}>{coin.change}</span>
          </li>
        ))}
      </ul>
    </div>

    <style jsx>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #a78bfa;
        border-radius: 6px;
      }
      .custom-scrollbar {
        scrollbar-width: auto;
        scrollbar-color: #a78bfa transparent;
      }
    `}</style>
  </div>
);

export default TrendingCoins;