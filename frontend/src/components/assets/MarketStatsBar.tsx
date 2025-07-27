import React from "react";

const stats = [
  { label: "Cryptos", value: "17.8M" },
  { label: "Exchanges", value: "828" },
  { label: "Market Cap", value: "$3.29T", change: "+0.20%", changeColor: "text-green-400" },
  { label: "24h Vol", value: "$94.42B", change: "-7.59%", changeColor: "text-red-400" },
  { label: "Dominance", value: "BTC: 64.9% ETH: 8.9%" },
  { label: "ETH Gas", value: "0.35 Gwei" },
];

const MarketStatsBar: React.FC = () => (
  <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400 px-2 py-2 pb-6">
    {stats.map((stat, idx) => (
      <span key={idx} className="flex items-center gap-1">
        <span className="font-semibold text-gray-300">{stat.label}:</span>
        <span className="font-mono text-gray-100">{stat.value}</span>
        {stat.change && (
          <span className={`ml-1 font-semibold ${stat.changeColor}`}>{stat.change}</span>
        )}
      </span>
    ))}
  </div>
);

export default MarketStatsBar; 
