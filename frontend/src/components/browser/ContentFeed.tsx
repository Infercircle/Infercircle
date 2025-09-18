"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ContentFeedItem from "./ContentFeedItem";

interface Project {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  key: string;
  category?: string;
}

interface Tweet {
  sentiment: string;
  avatar: string;
  name: string;
  handle: string;
  timestamp: string;
  followers: string;
  tweetUrl: string;
  text: string;
  rawTimestamp: number;
  id: string;
  likes: number;
  replies: number;
  retweets: number;
}

interface ContentFeedProps {
  selectedSources: string[];
  selectedItem: string | null;
  onItemSelect: (itemId: string | null) => void;
  selectedProjectData?: Project | null;
  onResultsCountChange?: (count: number) => void;
  timeRange?: string;
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
  sentiment?: string;
  tweetUrl?: string;
  likes?: number;
  replies?: number;
  retweets?: number;
}

const mockContent: ContentEntry[] = [
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
];

export default function ContentFeed({ selectedSources, selectedItem, onItemSelect, selectedProjectData, onResultsCountChange, timeRange = "Last 24h" }: ContentFeedProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loadingTweets, setLoadingTweets] = useState(false);
  const [tweetCache, setTweetCache] = useState<Record<string, { tweets: Tweet[]; timestamp: number }>>({});
  const [isEliteMode, setIsEliteMode] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
  const TWEET_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // Calculate dynamic source counts
  const getSourceCounts = () => {
    const counts: Record<string, number> = {};
    
    // Count mock content
    mockContent.forEach(item => {
      counts[item.source] = (counts[item.source] || 0) + 1;
    });
    
    // Count tweets
    counts.twitter = (counts.twitter || 0) + tweets.length;
    
    return counts;
  };

  const sourceCounts = getSourceCounts();

  const sourceTabs = [
    { id: "all", name: "All", count: Object.values(sourceCounts).reduce((a, b) => a + b, 0) },
    { id: "twitter", name: "Twitter", count: sourceCounts.twitter || 0 },
    { id: "farcaster", name: "Farcaster", count: sourceCounts.farcaster || 0 },
    { id: "governance", name: "Governance", count: sourceCounts.governance || 0 },
    { id: "vote", name: "Vote", count: sourceCounts.vote || 0 },
    { id: "news", name: "News", count: sourceCounts.news || 0 },
    { id: "twitter-space", name: "Twitter Space", count: sourceCounts["twitter-space"] || 0 },
    { id: "podcast", name: "Podcast", count: sourceCounts.podcast || 0 },
    { id: "medium", name: "Medium", count: sourceCounts.medium || 0 },
    { id: "research", name: "Research", count: sourceCounts.research || 0 },
    { id: "discord", name: "Discord", count: sourceCounts.discord || 0 },
    { id: "telegram", name: "Telegram", count: sourceCounts.telegram || 0 }
  ];

  // Function to format timestamp to relative time
  const formatRelativeTime = useCallback((timestamp: string | number | Date): string => {
    try {
      const now = new Date();
      const tweetTime = new Date(timestamp);
      
      if (isNaN(tweetTime.getTime())) {
        return 'now';
      }
      
      const diffInSeconds = Math.floor((now.getTime() - tweetTime.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}min`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d`;
      } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}mo`;
      } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years}y`;
      }
    } catch (error) {
      return 'now';
    }
  }, []);

  // Function to get cache key for a project
  const getCacheKey = useCallback((project: Project): string => {
    const symbol = project.symbol || 'no-symbol';
    return Buffer.from(`${symbol.toLowerCase()}-${project.name.toLowerCase()}-${project.key}`).toString('base64');
  }, []);

  // Function to check if cached data is still fresh
  const isCacheFresh = useCallback((cacheEntry: any): boolean => {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return (Date.now() - cacheEntry.timestamp) < TWEET_CACHE_DURATION;
  }, [TWEET_CACHE_DURATION]);

  // Function to load tweets from cache
  const loadFromCache = useCallback((project: Project): boolean => {
    const cacheKey = getCacheKey(project);
    const cacheEntry = tweetCache[cacheKey];
    
    if (cacheEntry && isCacheFresh(cacheEntry)) {
      const projectIdentifier = project.symbol || project.name;
      console.log(`📱 Loading ${cacheEntry.tweets.length} tweets from cache for ${projectIdentifier}`);
      setTweets(cacheEntry.tweets);
      return true;
    }
    
    const projectIdentifier = project.symbol || project.name;
    console.log(`❌ Cache miss for ${projectIdentifier}: ${!cacheEntry ? 'no entry' : 'stale data'}`);
    return false;
  }, [tweetCache, getCacheKey, isCacheFresh]);

  // Function to save tweets to cache
  const saveToCache = useCallback((project: Project, tweetsData: Tweet[]) => {
    const cacheKey = getCacheKey(project);
    const cacheEntry = {
      tweets: tweetsData,
      timestamp: Date.now()
    };
    
    setTweetCache(prev => ({ ...prev, [cacheKey]: cacheEntry }));
    
    if (process.env.NODE_ENV === 'development') {
      const projectIdentifier = project.symbol || project.name;
      console.log(`💾 Saved ${tweetsData.length} tweets to cache for ${projectIdentifier}`);
    }
  }, [getCacheKey]);

  // Function to fetch tweets for a project
  const fetchTweets = useCallback(async (project: Project) => {
    if (!project.name) return;
    
    setLoadingTweets(true);
    
    try {
      const projectIdentifier = project.symbol || project.name;
      console.log(`🔄 Fetching tweets for ${projectIdentifier}`);
      
      // Check cache first
      const cached = loadFromCache(project);
      if (cached) {
        setLoadingTweets(false);
        return;
      }
      
      // Create search queries based on project type
      const searchQueries: string[] = [];
      
      if (project.symbol) {
        // For coins/tokens with symbols
        searchQueries.push(
          `${project.name} $${project.symbol}`,
          `$${project.symbol}`,
          project.name
        );
      } else {
        // For non-coin projects (funds, exchanges, categories, etc.)
        searchQueries.push(
          project.name,
          `${project.name} crypto`,
          `${project.name} blockchain`
        );
      }
      
      const allTweets: Tweet[] = [];
      
      // Fetch from multiple queries
      for (const query of searchQueries) {
        try {
          const response = await fetch(`${API_BASE}/twitter/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query: query, 
              limit: 40,
              product: 'Latest'
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
              console.log(`✅ Got ${data.data.length} tweets from "${query}"`);
              
              data.data.forEach((tweet: any) => {
                const rawTimestamp = Date.now() - (allTweets.length * 1000);
                const uniqueId = `${tweet.id || tweet.handle}-${rawTimestamp}`;
                
                const transformedTweet: Tweet = {
                  sentiment: tweet.sentiment || 'neutral',
                  avatar: tweet.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
                  name: tweet.name || 'Unknown',
                  handle: tweet.handle || '@unknown',
                  timestamp: tweet.timestamp || formatRelativeTime(rawTimestamp),
                  followers: tweet.followers ? `${Math.floor(tweet.followers / 1000)}K` : '0',
                  tweetUrl: tweet.tweetUrl || 'https://twitter.com',
                  text: tweet.text || '',
                  rawTimestamp,
                  id: uniqueId,
                  likes: tweet.likes || 0,
                  replies: tweet.replies || 0,
                  retweets: tweet.retweets || 0
                };
                
                // Filter out very short tweets
                if (transformedTweet.text.length > 10 && transformedTweet.name !== 'Unknown') {
                  allTweets.push(transformedTweet);
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching tweets for "${query}":`, error);
        }
        
        // Small delay between queries
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Remove duplicates based on text content
      const uniqueTweets = allTweets.filter((tweet, index, arr) => {
        const duplicateIndex = arr.findIndex(t => t.text === tweet.text && t.handle === tweet.handle);
        return duplicateIndex === index;
      }).sort((a, b) => a.rawTimestamp - b.rawTimestamp);
      
      console.log(`📝 Processed ${uniqueTweets.length} unique tweets for ${projectIdentifier}`);
      
      // Update state
      setTweets(uniqueTweets);
      
      // Cache the results
      if (uniqueTweets.length > 0) {
        saveToCache(project, uniqueTweets);
      }
      
    } catch (error) {
      console.error('Error in fetchTweets:', error);
    } finally {
      setLoadingTweets(false);
    }
  }, [API_BASE, loadFromCache, saveToCache, formatRelativeTime]);

  // Fetch tweets when project changes
  useEffect(() => {
    if (selectedProjectData?.name) {
      const projectIdentifier = selectedProjectData.symbol || selectedProjectData.name;
      console.log(`🔄 Project changed to: ${projectIdentifier} (${selectedProjectData.name})`);
      
      // Try to load from cache first for instant display
      const cached = loadFromCache(selectedProjectData);
      
      if (!cached) {
        console.log(`❌ No cache for ${projectIdentifier}, fetching fresh tweets`);
        // Clear tweets and fetch new ones
        setTweets([]);
        fetchTweets(selectedProjectData);
      }
    } else {
      console.log(`🧹 Clearing tweets - no project selected`);
      setTweets([]);
    }
  }, [selectedProjectData?.name, selectedProjectData?.symbol, selectedProjectData?.key, fetchTweets, loadFromCache]);

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

  // Convert tweets to content entries
  const tweetContentEntries: ContentEntry[] = tweets.map((tweet, index) => ({
    id: `tweet-${tweet.id}`,
    title: `${tweet.name} (@${tweet.handle.replace('@', '')})`,
    description: tweet.text,
    date: tweet.timestamp,
    source: "twitter",
    sourceName: "Twitter",
    icon: "🐦",
    avatar: tweet.avatar,
    attendeeCount: parseInt(tweet.followers.replace('K', '')) || 0,
    sentiment: tweet.sentiment,
    tweetUrl: tweet.tweetUrl,
    likes: tweet.likes,
    replies: tweet.replies,
    retweets: tweet.retweets,
    followers: tweet.followers
  }));

  // Combine mock content with tweet content
  const allContent = [...mockContent, ...tweetContentEntries];

  // Helper function to check if content is within time range
  const isWithinTimeRange = (item: ContentEntry): boolean => {
    if (timeRange === "All Time") return true;
    
    const now = new Date();
    let cutoffTime: Date;
    
    switch (timeRange) {
      case "Last 24h":
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "Last 48h":
        cutoffTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        break;
      case "Last 7d":
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "Last 30d":
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "Last 3m":
        cutoffTime = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000); // ~90 days
        break;
      case "Last 6m":
        cutoffTime = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000); // ~180 days
        break;
      case "Last 12m":
        cutoffTime = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // ~365 days
        break;
      default:
        return true;
    }
    
    // For tweets, we need to parse the timestamp
    if (item.source === 'twitter') {
      // Parse relative time like "2h", "1d", "3min" back to actual time
      const parseRelativeTime = (timeStr: string): Date => {
        if (timeStr === 'now') return now;
        
        const match = timeStr.match(/^(\d+)(s|min|h|d|mo|y)$/);
        if (!match) return now;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        let milliseconds = 0;
        switch (unit) {
          case 's': milliseconds = value * 1000; break;
          case 'min': milliseconds = value * 60 * 1000; break;
          case 'h': milliseconds = value * 60 * 60 * 1000; break;
          case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
          case 'mo': milliseconds = value * 30 * 24 * 60 * 60 * 1000; break;
          case 'y': milliseconds = value * 365 * 24 * 60 * 60 * 1000; break;
        }
        
        return new Date(now.getTime() - milliseconds);
      };
      
      const tweetTime = parseRelativeTime(item.date);
      return tweetTime >= cutoffTime;
    }
    
    // For other content types, assume they're recent (within time range)
    return true;
  };

  const filteredContent = allContent.filter(item => {
    // Filter by selected sources from SourceFilters
    const sourceMatch = selectedSources.includes("all") || selectedSources.includes(item.source);
    
    // Filter by active tab
    const tabMatch = activeTab === "all" || activeTab === item.source;
    
    // Filter by time range
    const timeMatch = isWithinTimeRange(item);
    
    return sourceMatch && tabMatch && timeMatch;
  });

  // Report the filtered content count to parent
  useEffect(() => {
    onResultsCountChange?.(filteredContent.length);
  }, [filteredContent.length, onResultsCountChange]);

  return (
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded shadow-lg flex flex-col h-[800px]">
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
          {loadingTweets && tweets.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                <span className="text-sm">Loading tweets...</span>
              </div>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <span className="text-gray-500 text-sm">
                  {selectedProjectData 
                    ? `No content found for ${selectedProjectData.name}` 
                    : "Select a project to view content"
                  }
                </span>
                {selectedProjectData && tweets.length === 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Try selecting a different project or check back later
                  </div>
                )}
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
  );
}