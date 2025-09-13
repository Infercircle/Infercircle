"use client";

import React from "react";
import { FiChevronLeft } from "react-icons/fi";
import { FaSquareXTwitter, FaDiscord, FaTelegram, FaVideo, FaHeart, FaThumbsUp, FaComment, FaShare, FaBookmark } from "react-icons/fa6";
import { FaPodcast } from "react-icons/fa";
import { SiFarcaster } from "react-icons/si";
import { MdOutlineArticle, MdOutlineSchool } from "react-icons/md";
import { HiOutlineDocumentText, HiOutlineMicrophone, HiOutlinePresentationChartLine } from "react-icons/hi";
import { RiGovernmentFill } from "react-icons/ri";
import { AiOutlineHeart } from "react-icons/ai";

const ExternalLinkIcon = () => (
  <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m7-1V7m0 0h-5m5 0L10 17" />
  </svg>
);

const sentimentText = (sentiment: string) => {
  let text = '';
  let textColor = '';
  let bgColor = '';
  
  if (sentiment === "positive") {
    text = 'Positive';
    textColor = 'text-green-400';
    bgColor = 'bg-green-500/20';
  } else if (sentiment === "negative") {
    text = 'Negative';
    textColor = 'text-red-400';
    bgColor = 'bg-red-500/20';
  } else {
    text = 'Neutral';
    textColor = 'text-gray-400';
    bgColor = 'bg-gray-500/20';
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${textColor} ${bgColor}`}>
      {text}
    </span>
  );
};

interface ContentEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
  sourceName: string;
  icon: string;
  avatar?: string;
  attendeeCount: number;
  isExpanded?: boolean;
  sentiment?: string;
  tweetUrl?: string;
  likes?: number;
  replies?: number;
  retweets?: number;
  followers?: string;
}

interface ContentItemProps {
  item: ContentEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'twitter':
      return FaSquareXTwitter;
    case 'farcaster':
      return SiFarcaster;
    case 'governance':
      return RiGovernmentFill;
    case 'vote':
      return HiOutlinePresentationChartLine;
    case 'news':
      return HiOutlineDocumentText;
    case 'twitter-space':
      return HiOutlineMicrophone;
    case 'podcast':
      return FaPodcast;
    case 'medium':
      return MdOutlineArticle;
    case 'research':
      return MdOutlineSchool;
    case 'discord':
      return FaDiscord;
    case 'telegram':
      return FaTelegram;
    default:
      return null;
  }
};

const getEngagementIcon = (source: string) => {
  switch (source) {
    case 'twitter':
      return FaHeart;
    case 'farcaster':
      return FaThumbsUp;
    case 'discord':
      return FaComment;
    case 'telegram':
      return FaThumbsUp;
    case 'medium':
      return FaBookmark;
    case 'news':
      return FaShare;
    default:
      return FaThumbsUp;
  }
};

export default function ContentFeedItem({ item, isExpanded, onToggleExpand, isSelected, onSelect }: ContentItemProps) {
  const SourceIcon = getSourceIcon(item.source);
  const EngagementIcon = getEngagementIcon(item.source);
  return (
    <div 
      className={`cursor-pointer transition-colors -mx-6 px-6 py-4 ${
        isSelected 
          ? "bg-[rgba(36,37,42,0.25)] border-l-4 border-l-purple-500" 
          : "hover:bg-[rgba(36,37,42,0.25)]"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start space-x-4">
        {/* Avatar/Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
          {item.avatar ? (
            <img 
              src={item.avatar} 
              alt={item.title} 
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-sm">${item.icon}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-sm">{item.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Date Row */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 pr-4 min-w-0">
              <h3 className="text-white font-medium text-sm flex items-center gap-2 min-w-0">
                <span className="truncate">{item.title}</span>
                {item.source === 'twitter' && item.followers && (
                  <span className="text-gray-400 text-xs font-normal flex-shrink-0">• {item.followers} followers</span>
                )}
              </h3>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <span className="text-gray-400 text-xs whitespace-nowrap">{item.date}</span>
              {/* External link for tweets */}
              {item.source === 'twitter' && item.tweetUrl && (
                <a
                  href={item.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A259FF] flex items-center"
                  title="View Tweet"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLinkIcon />
                </a>
              )}
              <button
                onClick={onToggleExpand}
                className="p-1 hover:bg-[rgba(36,37,42,0.25)] rounded-full transition-colors cursor-pointer"
              >
                <FiChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-90' : '-rotate-90'
                }`} />
              </button>
            </div>
          </div>
          
          {/* Description - Full Width */}
          <p className="text-gray-300 text-sm mb-2 leading-relaxed">{item.description}</p>
          
          {/* Tags */}
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border text-white ${
              item.source === 'medium' ? 'bg-blue-500/20 border-blue-500/30' :
              item.source === 'research' ? 'bg-green-500/20 border-green-500/30' :
              item.source === 'twitter' ? 'bg-gray-500/20 border-gray-500/30' :
              item.source === 'farcaster' ? 'bg-purple-500/20 border-purple-500/30' :
              item.source === 'discord' ? 'bg-indigo-500/20 border-indigo-500/30' :
              item.source === 'telegram' ? 'bg-blue-500/20 border-blue-500/30' :
              item.source === 'news' ? 'bg-red-500/20 border-red-500/30' :
              item.source === 'twitter-space' ? 'bg-pink-500/20 border-pink-500/30' :
              item.source === 'podcast' ? 'bg-yellow-500/20 border-yellow-500/30' :
              item.source === 'governance' ? 'bg-emerald-500/20 border-emerald-500/30' :
              item.source === 'vote' ? 'bg-rose-500/20 border-rose-500/30' :
              'bg-gray-500/20 border-gray-500/30'
            }`}>
              {SourceIcon && <SourceIcon className={`w-3 h-3 ${
                item.source === 'medium' ? 'text-blue-400' :
                item.source === 'research' ? 'text-green-400' :
                item.source === 'twitter' ? 'text-gray-400' :
                item.source === 'farcaster' ? 'text-purple-400' :
                item.source === 'discord' ? 'text-indigo-400' :
                item.source === 'telegram' ? 'text-blue-400' :
                item.source === 'news' ? 'text-red-400' :
                item.source === 'twitter-space' ? 'text-pink-400' :
                item.source === 'podcast' ? 'text-yellow-400' :
                item.source === 'governance' ? 'text-emerald-400' :
                item.source === 'vote' ? 'text-rose-400' :
                'text-gray-400'
              }`} />}
              <span>
                {item.source === 'twitter-space' ? 'Twitter Space' :
                 item.source === 'twitter' ? 'Twitter' :
                 item.source.charAt(0).toUpperCase() + item.source.slice(1)}
              </span>
            </span>
            <span className="text-gray-400 text-xs">{item.sourceName}</span>
            {/* Show engagement data */}
            {item.source === 'twitter' ? (
              /* Twitter engagement: likes only */
              <div className="flex items-center space-x-1">
                <AiOutlineHeart className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400 text-xs">{item.likes || 0}</span>
              </div>
            ) : (
              /* Other sources engagement */
              <div className="flex items-center space-x-1">
                <EngagementIcon className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400 text-xs">{item.attendeeCount}</span>
              </div>
            )}
            {/* Sentiment indicator for tweets */}
            {item.sentiment && (
              <div className="flex items-center space-x-1">
                {sentimentText(item.sentiment)}
              </div>
            )}
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 p-4 bg-[rgba(24,26,32,0.5)] rounded-lg border border-[#23272b]">
              <div className="text-gray-300 text-sm">
                <p className="mb-3">
                  This is the expanded content for {item.title}. Here you would show additional details, 
                  full description, speaker information, or any other relevant content.
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span>Duration: 45 min</span>
                  <span>Language: English</span>
                  <span>Type: Panel Discussion</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}