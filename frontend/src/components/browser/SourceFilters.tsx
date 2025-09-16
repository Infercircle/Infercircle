"use client";

import React from "react";
import { FaSquareXTwitter, FaDiscord, FaTelegram, FaVideo } from "react-icons/fa6";
import { FaPodcast } from "react-icons/fa";
import { SiFarcaster } from "react-icons/si";
import { MdOutlineArticle, MdOutlineSchool } from "react-icons/md";
import { HiOutlineDocumentText, HiOutlineMicrophone, HiOutlinePresentationChartLine } from "react-icons/hi";
import { RiGovernmentFill } from "react-icons/ri";

interface SourceFiltersProps {
  selectedSources: string[];
  setSelectedSources: (sources: string[]) => void;
}

const availableSources = [
  { id: "all", name: "All Sources", icon: null },
  { id: "twitter", name: "Twitter", icon: FaSquareXTwitter },
  { id: "farcaster", name: "Farcaster", icon: SiFarcaster },
  { id: "governance", name: "Governance", icon: RiGovernmentFill },
  { id: "vote", name: "Vote", icon: HiOutlinePresentationChartLine },
  { id: "news", name: "News", icon: HiOutlineDocumentText },
  { id: "twitter-space", name: "Twitter Space", icon: HiOutlineMicrophone },
  { id: "podcast", name: "Podcast", icon: FaPodcast },
  { id: "medium", name: "Medium", icon: MdOutlineArticle },
  { id: "research", name: "Research", icon: MdOutlineSchool },
  { id: "discord", name: "Discord", icon: FaDiscord },
  { id: "telegram", name: "Telegram", icon: FaTelegram },
];

export default function SourceFilters({
  selectedSources,
  setSelectedSources
}: SourceFiltersProps) {
  const handleSourceToggle = (sourceId: string) => {
    if (sourceId === "all") {
      setSelectedSources(["all"]);
    } else {
      const newSources = selectedSources.includes(sourceId)
        ? selectedSources.filter(id => id !== sourceId && id !== "all")
        : [...selectedSources.filter(id => id !== "all"), sourceId];
      
      if (newSources.length === 0) {
        setSelectedSources(["all"]);
      } else {
        setSelectedSources(newSources);
      }
    }
  };

  const isSourceSelected = (sourceId: string) => {
    return selectedSources.includes(sourceId);
  };

  return (
    <div className="px-3 py-4">
      <div className="flex items-start justify-between">
        {/* Source Filter Buttons */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {availableSources.map((source) => (
              <button
                key={source.id}
                onClick={() => handleSourceToggle(source.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 group ${
                  isSourceSelected(source.id)
                    ? "bg-purple-500/60 text-white border border-purple-400/30"
                    : "bg-purple-500/20 text-gray-300 border border-purple-400/30 hover:bg-purple-500/60 hover:text-gray-100"
                }`}
              >
                <span className="text-sm font-medium">{source.name}</span>
                {source.icon && (
                  <source.icon className={`w-3 h-3 ${
                    isSourceSelected(source.id) ? "text-white" : "text-gray-400 group-hover:text-gray-100"
                  }`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}