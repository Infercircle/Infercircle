import React from "react";
import { FaBitcoin } from "react-icons/fa";
import { SiEthereum } from "react-icons/si";

const btcDominance = 64.7;
const ethDominance = 8.9;
const btcSeason = 19; // out of 100

const BitcoinDominance: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <h3 className="text-sm font-semibold text-gray-200 mb-3">Bitcoin Dominance</h3>
    <div className="flex items-center gap-4 mb-2">
      <div className="flex flex-col items-center">
        <FaBitcoin className="text-yellow-400 w-5 h-5 mb-1" />
        <span className="text-lg font-bold text-gray-100">{btcDominance}%</span>
        <span className="text-base text-green-400 font-semibold">+0.03%</span>
        <span className="text-base text-gray-400">Bitcoin</span>
      </div>
      <div className="flex flex-col items-center">
        <SiEthereum className="text-blue-400 w-5 h-5 mb-1" />
        <span className="text-lg font-bold text-gray-100">{ethDominance}%</span>
        <span className="text-base text-green-400 font-semibold">+0.03%</span>
        <span className="text-base text-gray-400">Ethereum</span>
      </div>
    </div>
    {/* Slider for Bitcoin/Altcoin season */}
    <div className="w-full mt-2">
      <div className="flex justify-between text-base text-gray-400 mb-1">
        <span>Bitcoin</span>
        <span>Altcoin</span>
      </div>
      <div className="relative h-2 bg-[#23272b] rounded-full">
        <div
          className="absolute top-0 left-0 h-2 bg-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${btcSeason}%` }}
        />
        <div
          className="absolute top-0 left-0 h-2 w-full flex justify-center items-center"
          style={{ pointerEvents: 'none' }}
        >
          <span className="absolute left-1/2 -translate-x-1/2 -top-5 text-sm font-semibold text-gray-200">
            {btcSeason} / 100 Bitcoin Season
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default BitcoinDominance; 