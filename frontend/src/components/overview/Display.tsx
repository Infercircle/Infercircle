"use client";

import React from "react";

const Display = () => {
  return (
    <div className="bg-[#181A20] border border-[#23272b]  rounded-2xl p-6 shadow-lg w-full h-full flex flex-col min-h-[320px]">
      {/* Asset Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🟠</span>
          <div>
            <div className="text-white font-semibold text-lg flex items-center gap-2">
              Bitcoin <span className="text-xs text-[#A3A3A3] font-normal">BTC</span>
              <span className="bg-[#23262F] text-xs px-2 py-0.5 rounded-full ml-2">#1</span>
            </div>
          </div>
        </div>
        <button className="text-[#A3A3A3] text-xs bg-[#23262F] px-3 py-1 rounded-lg">View Asset</button>
      </div>
      {/* Price and change */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-2xl font-bold text-white">$107,030.45</div>
        <div className="text-green-400 font-semibold text-sm">0.27% (1d) ▲</div>
      </div>
      {/* Holdings */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-[#23262F] rounded-xl p-3">
          <div className="text-xs text-[#A3A3A3] mb-1">Addresses by Holdings</div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-[#A3A3A3]">$0 - $1k</span>
            <span className="text-[#A3A3A3]">$1k - $100k</span>
            <span className="text-[#A3A3A3]">$100k+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2/5 h-2 bg-[#A259FF] rounded-full" style={{ width: '40%' }} />
            <div className="w-1/4 h-2 bg-[#F7931A] rounded-full" style={{ width: '21%' }} />
            <div className="w-1/6 h-2 bg-[#A3A3A3] rounded-full" style={{ width: '2%' }} />
          </div>
          <div className="flex items-center gap-6 mt-1 text-xs text-white">
            <span>76.84%</span>
            <span>21.21%</span>
            <span>1.95%</span>
          </div>
        </div>
        <div className="flex-1 bg-[#23262F] rounded-xl p-3">
          <div className="text-xs text-[#A3A3A3] mb-1">Whale Holdings</div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-[#A3A3A3]">Whales</span>
            <span className="text-[#A3A3A3]">Others</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1/6 h-2 bg-[#A259FF] rounded-full" style={{ width: '12%' }} />
            <div className="w-4/5 h-2 bg-[#A3A3A3] rounded-full" style={{ width: '88%' }} />
          </div>
          <div className="flex items-center gap-6 mt-1 text-xs text-white">
            <span>1.25%</span>
            <span>98.75%</span>
          </div>
        </div>
      </div>
      {/* Social Sentiment */}
      <div className="mt-2">
        <div className="text-[#A259FF] font-semibold mb-2">Social Sentiment</div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🧑‍💻</span>
              <span className="text-white font-medium text-sm">Crypto.Andy</span>
            </div>
            <div className="text-xs text-[#A3A3A3] mb-1">
              <span className="text-[#F7931A] font-bold">$BTC</span> is holding above $106K, but indicators show indecision. Will we see a breakout above $111K or a new pullback? 📈
            </div>
          </div>
          {/* Chart placeholder */}
          <div className="w-28 h-16 bg-[#23262F] rounded-lg flex items-center justify-center">
            <span className="text-[#A259FF] text-2xl">📊</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Display;
