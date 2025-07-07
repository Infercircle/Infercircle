import React from "react";
import TrendingCoins from "./widgets/TrendingCoins";
import PopularListings from "./widgets/PopularListings";
import FearGreedIndex from "./widgets/FearGreedIndex";
import BitcoinDominance from "./widgets/BitcoinDominance";

const cardClass =
  "bg-[#181A20] border border-[#23272b] rounded-2xl shadow-lg p-4 sm:p-4 min-h-0 transition-all duration-200 hoverflex flex-col";

const AssetCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-8">
      <div className={cardClass}>
        <TrendingCoins />
      </div>
      <div className={cardClass}>
        <PopularListings />
      </div>
      <div className={cardClass}>
        <FearGreedIndex />
      </div>
      <div className={cardClass}>
        <BitcoinDominance />
      </div>
    </div>
  );
};

export default AssetCards; 