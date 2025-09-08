"use client";

import React, { useState, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ContentFeedItem from "./ContentFeedItem";

interface ContentFeedProps {
  selectedSources: string[];
  selectedItem: string | null;
  onItemSelect: (itemId: string | null) => void;
}

interface ContentEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
  sourceName: string;
  icon: string;
  attendeeCount: number;
  isExpanded?: boolean;
}

const mockContent: ContentEntry[] = [
  {
    id: "1",
    title: "Research Day 2024",
    description: "EIGEN: The Universal Intersubjective Work Token - Soubhik Deb (EigenLayer)",
    date: "May 21, 2024",
    source: "conference",
    sourceName: "Research Day",
    icon: "🧠",
    attendeeCount: 36
  },
  {
    id: "2",
    title: "ETHDenver",
    description: "The 'State of Staking' Panel: Decentralization, Security, and UX | Freddy Zwanzger | Raul Sanchez",
    date: "Feb 28, 2024",
    source: "conference",
    sourceName: "ETHDenver",
    icon: "🔷",
    attendeeCount: 18
  },
  {
    id: "3",
    title: "ETHDenver",
    description: "(Re)Staking In The Modular End Game | Stanley He, Thalita Franklin, Tina Haibody",
    date: "Mar 1, 2024",
    source: "conference",
    sourceName: "ETHDenver",
    icon: "🔷",
    attendeeCount: 9
  },
  {
    id: "4",
    title: "Token2049 Dubai 2024",
    description: "Restaking Revolution: The New Frontier in Hyperscaling - TOKEN2049 Dubai 2024",
    date: "Apr 29, 2024",
    source: "conference",
    sourceName: "Token2049",
    icon: "🪙",
    attendeeCount: 24
  },
  {
    id: "5",
    title: "Sentient",
    description: "Open Source AI: The Survival of the Fittest",
    date: "Apr 7, 2024",
    source: "conference",
    sourceName: "Sentient",
    icon: "👁️",
    attendeeCount: 11
  },
  {
    id: "6",
    title: "Token2049 Dubai 2024",
    description: "The Future of Liquid Staking and Restaking - TOKEN2049 Dubai 2024",
    date: "Apr 27, 2024",
    source: "conference",
    sourceName: "Token2049",
    icon: "🪙",
    attendeeCount: 15
  },
  {
    id: "7",
    title: "DeFi Summit 2024",
    description: "The Evolution of Decentralized Finance: From DeFi 1.0 to DeFi 2.0 | Vitalik Buterin, Hayden Adams",
    date: "Jun 15, 2024",
    source: "conference",
    sourceName: "DeFi Summit",
    icon: "🏦",
    attendeeCount: 42
  },
  {
    id: "8",
    title: "LayerZero Protocol",
    description: "Cross-Chain Interoperability: Building the Internet of Blockchains | Bryan Pellegrino, Ryan Zarick",
    date: "Jun 8, 2024",
    source: "medium",
    sourceName: "LayerZero",
    icon: "🔗",
    attendeeCount: 28
  },
  {
    id: "9",
    title: "Arbitrum Odyssey",
    description: "Scaling Ethereum with Optimistic Rollups: Lessons Learned and Future Roadmap | Steven Goldfeder",
    date: "Jun 3, 2024",
    source: "research",
    sourceName: "Arbitrum",
    icon: "⚡",
    attendeeCount: 33
  },
  {
    id: "11",
    title: "Celestia Modular",
    description: "Data Availability and Modular Blockchain Architecture | Mustafa Al-Bassam, Ismail Khoffi",
    date: "May 25, 2024",
    source: "twitter",
    sourceName: "Celestia",
    icon: "🌙",
    attendeeCount: 25
  },
  {
    id: "12",
    title: "Cosmos Hub",
    description: "Interchain Security: Shared Security Model for Cosmos Ecosystem | Zaki Manian, Ethan Buchman",
    date: "May 18, 2024",
    source: "farcaster",
    sourceName: "Cosmos",
    icon: "🌌",
    attendeeCount: 31
  },
  {
    id: "13",
    title: "Avalanche Subnets",
    description: "Custom Blockchain Networks: Building Application-Specific Chains | Emin Gün Sirer, Kevin Sekniqi",
    date: "May 12, 2024",
    source: "discord",
    sourceName: "Avalanche",
    icon: "🏔️",
    attendeeCount: 22
  },
  {
    id: "14",
    title: "Near Protocol",
    description: "Sharding and Nightshade: Scaling Blockchain Through Parallel Processing | Illia Polosukhin",
    date: "May 5, 2024",
    source: "telegram",
    sourceName: "NEAR",
    icon: "🚀",
    attendeeCount: 27
  },
  {
    id: "15",
    title: "Sui Network",
    description: "Move Programming Language: Building Safe and Efficient Smart Contracts | Evan Cheng, Sam Blackshear",
    date: "Apr 30, 2024",
    source: "news",
    sourceName: "Sui",
    icon: "💧",
    attendeeCount: 35
  },
  {
    id: "16",
    title: "Aptos Blockchain",
    description: "Parallel Execution and Move VM: High-Performance Blockchain Infrastructure | Mo Shaikh, Avery Ching",
    date: "Apr 22, 2024",
    source: "twitter-space",
    sourceName: "Aptos",
    icon: "🟢",
    attendeeCount: 29
  },
  {
    id: "17",
    title: "Solana Labs",
    description: "Proof of History: Verifiable Delay Functions in Blockchain Consensus | Anatoly Yakovenko",
    date: "Apr 15, 2024",
    source: "podcast",
    sourceName: "Solana",
    icon: "☀️",
    attendeeCount: 38
  },
  {
    id: "18",
    title: "Chainlink VRF",
    description: "Verifiable Randomness: Ensuring Fairness in On-Chain Applications | Sergey Nazarov",
    date: "Apr 8, 2024",
    source: "governance",
    sourceName: "Chainlink",
    icon: "🔗",
    attendeeCount: 24
  },
  {
    id: "19",
    title: "The Graph Protocol",
    description: "Decentralized Indexing: Querying Blockchain Data at Scale | Yaniv Tal, Brandon Ramirez",
    date: "Apr 1, 2024",
    source: "vote",
    sourceName: "The Graph",
    icon: "📊",
    attendeeCount: 21
  },
  {
    id: "20",
    title: "Filecoin Storage",
    description: "Decentralized Storage Networks: Building the Web3 Data Layer | Juan Benet, Protocol Labs",
    date: "Mar 25, 2024",
    source: "conference",
    sourceName: "Filecoin",
    icon: "📁",
    attendeeCount: 26
  }
];

const sourceTabs = [
  { id: "all", name: "All", count: 19 },
  { id: "twitter", name: "Twitter", count: 1 },
  { id: "farcaster", name: "Farcaster", count: 1 },
  { id: "governance", name: "Governance", count: 1 },
  { id: "vote", name: "Vote", count: 1 },
  { id: "news", name: "News", count: 1 },
  { id: "twitter-space", name: "Twitter Space", count: 1 },
  { id: "podcast", name: "Podcast", count: 1 },
  { id: "conference", name: "Conference", count: 8 },
  { id: "medium", name: "Medium", count: 1 },
  { id: "research", name: "Research", count: 1 },
  { id: "discord", name: "Discord", count: 1 },
  { id: "telegram", name: "Telegram", count: 1 }
];

export default function ContentFeed({ selectedSources, selectedItem, onItemSelect }: ContentFeedProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleExpandToggle = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      const currentScroll = tabsRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount;
      
      tabsRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const filteredContent = mockContent.filter(item => {
    // Filter by selected sources from SourceFilters
    const sourceMatch = selectedSources.includes("all") || selectedSources.includes(item.source);
    
    // Filter by active tab
    const tabMatch = activeTab === "all" || activeTab === item.source;
    
    return sourceMatch && tabMatch;
  });

  return (
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded shadow-lg flex flex-col h-[700px]">
        {/* Header Section - Fixed */}
        <div className="px-1 pt-4 pb-1 flex-shrink-0 border-b border-[#23272b]">
          {/* Top Navigation Tabs */}
          <div className="flex items-center space-x-1 mb-4">
          <button 
            onClick={() => scrollTabs('left')}
            className="px-1 py-2 hover:bg-[rgba(36,37,42,0.25)] rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <FiChevronLeft className="w-4 h-4 text-gray-400" />
          </button>
          
          <div 
            ref={tabsRef}
            className="flex items-center space-x-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {sourceTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-gray-400 hover:text-white hover:bg-[rgba(36,37,42,0.25)]"
                }`}
              >
                <span className="text-sm font-medium">{tab.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? "bg-purple-500 text-white" : "bg-gray-600 text-gray-300"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => scrollTabs('right')}
            className="px-1 py-2 hover:bg-[rgba(36,37,42,0.25)] rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <FiChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          </div>

      

        </div>

        {/* Content List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <div className="space-y-4">
          {filteredContent.map((item) => (
            <ContentFeedItem
              key={item.id}
              item={item}
              isExpanded={expandedItems.has(item.id)}
              onToggleExpand={() => handleExpandToggle(item.id)}
              isSelected={selectedItem === item.id}
              onSelect={() => onItemSelect(selectedItem === item.id ? null : item.id)}
            />
          ))}
          </div>
        </div>
      </div>
  );
}