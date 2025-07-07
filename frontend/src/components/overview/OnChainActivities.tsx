import React from "react";

const mockAssets = [
  {
    name: "Bitcoin",
    ticker: "BTC",
    icon: "🟠",
    price: "$105,640",
    balance: "0.003889",
    priceChange: "+3.65%",
    sentiment: "+3.65%",
    socialIndex: 54,
  },
  // Repeat for demo
  {
    name: "Bitcoin",
    ticker: "BTC",
    icon: "🟠",
    price: "$105,640",
    balance: "0.003889",
    priceChange: "+3.65%",
    sentiment: "+3.65%",
    socialIndex: 54,
  },
  {
    name: "Bitcoin",
    ticker: "BTC",
    icon: "🟠",
    price: "$105,640",
    balance: "0.003889",
    priceChange: "+3.65%",
    sentiment: "+3.65%",
    socialIndex: 54,
  },
  {
    name: "Bitcoin",
    ticker: "BTC",
    icon: "🟠",
    price: "$105,640",
    balance: "0.003889",
    priceChange: "+3.65%",
    sentiment: "+3.65%",
    socialIndex: 54,
  },
  {
    name: "Bitcoin",
    ticker: "BTC",
    icon: "🟠",
    price: "$105,640",
    balance: "0.003889",
    priceChange: "+3.65%",
    sentiment: "+3.65%",
    socialIndex: 54,
  },
  {
    name: "Bitcoin",
    ticker: "BTC",
    icon: "🟠",
    price: "$105,640",
    balance: "0.003889",
    priceChange: "+3.65%",
    sentiment: "+3.65%",
    socialIndex: 54,
  },
];

const OnChainActivities = () => {
  return (
    <div className="bg-[#181A20] border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-white">OnChain Activities</div>
        <button className="text-[#A259FF] text-sm flex items-center gap-1">Activities <span className="ml-1">▼</span></button>
      </div>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1">
        <table className="min-w-full text-sm text-left align-middle">
          <thead>
            <tr className="text-[#A3A3A3] border-b border-[#23262F]">
              <th className="py-2 px-2 font-medium text-center">Asset</th>
              <th className="py-2 px-2 font-medium text-center">Price</th>
              <th className="py-2 px-2 font-medium text-center">Balance</th>
              <th className="py-2 px-2 font-medium text-center">↑ price</th>
              <th className="py-2 px-2 font-medium text-center">Sentiment</th>
              <th className="py-2 px-2 font-medium text-center">Graph</th>
              <th className="py-2 px-2 font-medium text-center">Social Index</th>
            </tr>
          </thead>
          <tbody>
            {mockAssets.map((asset, idx) => (
              <tr key={idx} className="border-b border-[#23262F] last:border-0 hover:bg-[#23262F]/40 transition">
                <td className="py-2 px-2 flex items-center gap-2 justify-center">
                  <span className="text-2xl">{asset.icon}</span>
                  <div>
                    <div className="text-white font-medium">{asset.name}</div>
                    <div className="text-xs text-[#A3A3A3]">{asset.ticker}</div>
                  </div>
                </td>
                <td className="py-2 px-2 text-white text-center align-middle">{asset.price}</td>
                <td className="py-2 px-2 text-white text-center align-middle">{asset.balance}</td>
                <td className="py-2 px-2 text-green-400 font-semibold text-center align-middle">{asset.priceChange}</td>
                <td className="py-2 px-2 text-green-400 font-semibold text-center align-middle">{asset.sentiment}</td>
                <td className="py-2 px-2 text-center align-middle">
                  {/* Placeholder for mini graph */}
                  <div className="w-20 h-6 bg-[#23262F] rounded overflow-hidden flex items-end mx-auto">
                    <div className="w-2 h-3 bg-[#A259FF] mx-0.5 rounded"></div>
                    <div className="w-2 h-5 bg-[#A259FF]/70 mx-0.5 rounded"></div>
                    <div className="w-2 h-2 bg-[#A259FF]/50 mx-0.5 rounded"></div>
                    <div className="w-2 h-4 bg-[#A259FF]/80 mx-0.5 rounded"></div>
                    <div className="w-2 h-3 bg-[#A259FF] mx-0.5 rounded"></div>
                  </div>
                </td>
                <td className="py-2 px-2 text-center align-middle">
                  {/* Placeholder for circular progress */}
                  <div className="relative w-10 h-10 flex items-center justify-center mx-auto">
                    <svg className="absolute top-0 left-0" width="40" height="40">
                      <circle cx="20" cy="20" r="18" stroke="#23262F" strokeWidth="4" fill="none" />
                      <circle cx="20" cy="20" r="18" stroke="#A259FF" strokeWidth="4" fill="none" strokeDasharray="113" strokeDashoffset="{113 - (asset.socialIndex / 100) * 113}" strokeLinecap="round" />
                    </svg>
                    <span className="text-white text-xs font-bold z-10">{asset.socialIndex}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OnChainActivities; 