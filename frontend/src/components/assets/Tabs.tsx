"use client"
import React, { useState } from "react";

const tabLabels = [
  "All Crypto",
  "Socials",
  "Gainers",
  "Losers",
  "ATH",
  "Ecosystems",
];

interface TabsProps {
  onTabChange?: (tabIndex: number) => void;
}

const Tabs: React.FC<TabsProps> = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
    if (onTabChange) onTabChange(idx);
  };

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto">
      {tabLabels.map((label, idx) => (
        <button
          key={label}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150 focus:outline-none whitespace-nowrap
            ${activeTab === idx
              ? "bg-violet-500 text-white shadow"
              : "bg-[#23272b] text-gray-400 hover:bg-[#23272b]/80"}
          `}
          onClick={() => handleTabClick(idx)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default Tabs; 