import React from "react";

const gaugeValue = 49; // Neutral
const gaugeColor = gaugeValue < 40 ? "#ef4444" : gaugeValue < 60 ? "#f59e42" : "#22c55e";
const gaugeLabel = gaugeValue < 40 ? "Fear" : gaugeValue < 60 ? "Neutral" : "Greed";

const FearGreedIndex: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <h3 className="text-base font-semibold text-gray-200 mb-4">Fear & Greed</h3>
    {/* Gauge */}
    <div className="relative flex items-center justify-center mb-2">
      <svg width="90" height="50" viewBox="0 0 90 50">
        <path
          d="M10 45 A40 40 0 0 1 80 45"
          fill="none"
          stroke="#23272b"
          strokeWidth="10"
        />
        <path
          d="M10 45 A40 40 0 0 1 80 45"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="10"
          strokeDasharray="125"
          strokeDashoffset={125 - (gaugeValue / 100) * 125}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-gray-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">{gaugeValue}</span>
    </div>
    <span className="text-base font-semibold text-gray-300 mb-2">{gaugeLabel}</span>
    {/* Stats */}
    <div className="flex items-center gap-4 text-base">
      <div className="flex flex-col items-center">
        <span className="font-bold text-green-400">54%</span>
        <span className="text-gray-400">Yesterday</span>
        <span className="text-green-400">Greed</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-bold text-red-400">44%</span>
        <span className="text-gray-400">7 days</span>
        <span className="text-red-400">Fear</span>
      </div>
    </div>
  </div>
);

export default FearGreedIndex; 