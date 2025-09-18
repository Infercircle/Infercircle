'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiCopy, FiCheckCircle, FiX, FiSearch, FiChevronLeft, FiChevronRight, FiBell, FiBellOff, FiPlay, FiClock, FiFileText, FiUsers, FiMessageSquare, FiSave, FiTrash2, FiEye } from 'react-icons/fi';
import { MdHistory } from "react-icons/md";
import { marked } from 'marked';
import axios from 'axios';

// Typewriter component for animated text display
const Typewriter: React.FC<{ text: string; speed?: number; className?: string; onComplete?: () => void }> = ({ 
  text, 
  speed = 30, 
  className = '', 
  onComplete 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: marked.parse(displayedText) }}
    />
  );
};

interface SummarizationResult {
  summary: string;
  transcript: string;
  duration?: string;
  participants?: number;
  space_id?: string;
  broadcast_id?: string;
  download?: {
    file_path: string;
    file_size: number;
    duration: number;
  };
  metadata?: {
    confidence?: number;
    speakers?: number;
    chapters?: number;
  };
}

interface Task {
  id: string;
  url: string;
  contentType: 'space' | 'broadcast';
  status: 'running' | 'completed' | 'error';
  startTime: number;
  result?: SummarizationResult;
}

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  contentType: 'space' | 'broadcast';
  summary: string;
  transcript: string;
  duration?: string;
  participants?: number;
  space_id?: string;
  broadcast_id?: string;
  createdAt: string;
  metadata?: {
    confidence?: number;
    speakers?: number;
    chapters?: number;
  };
}

export default function ContentSummarizer() {
  // Basic state
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<'space' | 'broadcast'>('space');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummarizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [currentMention, setCurrentMention] = useState(0);
  const [copiedParagraphIndex, setCopiedParagraphIndex] = useState<number | null>(null);
  const [isFreshResult, setIsFreshResult] = useState(false);
  const [typewriterShown, setTypewriterShown] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Countdown timer state
  const [countdownActive, setCountdownActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationsEnabledRef = useRef(false);

  // Background processing
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // History management
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: '1',
      title: 'Twitter Space - 12/15/2024',
      url: 'https://twitter.com/i/spaces/1a2b3c4d5e6f',
      contentType: 'space',
      summary: 'This space discussed the latest trends in cryptocurrency and DeFi protocols. Key topics included yield farming strategies, liquidity provision, and risk management in volatile markets. The speakers shared insights on upcoming token launches and provided analysis on market sentiment.',
      transcript: 'Speaker 1: Welcome everyone to today\'s space about crypto trends. Let\'s start with yield farming.\n\nSpeaker 2: Yield farming has evolved significantly. The key is finding sustainable protocols with good tokenomics.\n\nSpeaker 1: Absolutely. Risk management is crucial in this space.\n\nSpeaker 2: I agree. Always DYOR before investing in any protocol.',
      duration: '45:30',
      participants: 2,
      space_id: '1a2b3c4d5e6f',
      createdAt: '2024-12-15T10:30:00Z',
      metadata: {
        confidence: 0.95,
        speakers: 2,
        chapters: 3
      }
    },
    {
      id: '2',
      title: 'Twitter Broadcast - 12/14/2024',
      url: 'https://twitter.com/i/broadcasts/7g8h9i0j1k2l',
      contentType: 'broadcast',
      summary: 'A comprehensive analysis of the current NFT market conditions. The discussion covered floor prices, utility-based NFTs, and the future of digital collectibles. Speakers provided technical analysis and market predictions for the upcoming quarter.',
      transcript: 'Host: Today we\'re diving deep into the NFT market. Let\'s analyze the current trends.\n\nGuest: The market has shown resilience despite recent volatility. Utility-based NFTs are gaining traction.\n\nHost: What about floor prices? Are we seeing stabilization?\n\nGuest: Yes, we\'re seeing more stable floor prices in established collections.',
      duration: '32:15',
      participants: 1,
      broadcast_id: '7g8h9i0j1k2l',
      createdAt: '2024-12-14T15:45:00Z',
      metadata: {
        confidence: 0.92,
        speakers: 2,
        chapters: 4
      }
    },
    {
      id: '3',
      title: 'Twitter Space - 12/13/2024',
      url: 'https://twitter.com/i/spaces/3m4n5o6p7q8r',
      contentType: 'space',
      summary: 'Discussion about Web3 gaming and play-to-earn mechanics. The conversation explored different gaming platforms, token economics in games, and the future of blockchain-based gaming. Speakers shared their experiences with various gaming protocols.',
      transcript: 'Moderator: Welcome to our Web3 gaming discussion. Let\'s start with play-to-earn mechanics.\n\nGamer 1: P2E has evolved beyond simple token rewards. Now we see more sophisticated economic models.\n\nGamer 2: The key is sustainable tokenomics that don\'t lead to inflation.\n\nModerator: What about user experience? How important is gameplay quality?\n\nGamer 1: Gameplay is crucial. Tokens alone won\'t retain players long-term.',
      duration: '58:20',
      participants: 3,
      space_id: '3m4n5o6p7q8r',
      createdAt: '2024-12-13T20:15:00Z',
      metadata: {
        confidence: 0.88,
        speakers: 3,
        chapters: 5
      }
    },
    {
      id: '4',
      title: 'Twitter Broadcast - 12/12/2024',
      url: 'https://twitter.com/i/broadcasts/9s0t1u2v3w4x',
      contentType: 'broadcast',
      summary: 'Technical deep dive into layer 2 scaling solutions. Covered various L2 protocols, their trade-offs, and implementation strategies. The discussion included gas optimization techniques and cross-chain interoperability challenges.',
      transcript: 'Technical Lead: Let\'s discuss L2 scaling solutions. We have several options available.\n\nDeveloper: Each L2 has different trade-offs. Optimistic rollups vs ZK rollups.\n\nTechnical Lead: Gas optimization is crucial for user adoption.\n\nDeveloper: Cross-chain interoperability remains a challenge we need to solve.',
      duration: '41:10',
      participants: 1,
      broadcast_id: '9s0t1u2v3w4x',
      createdAt: '2024-12-12T14:20:00Z',
      metadata: {
        confidence: 0.94,
        speakers: 2,
        chapters: 6
      }
    },
    {
      id: '5',
      title: 'Twitter Space - 12/11/2024',
      url: 'https://twitter.com/i/spaces/5y6z7a8b9c0d',
      contentType: 'space',
      summary: 'Community discussion about DAO governance and voting mechanisms. Explored different governance models, token holder rights, and decision-making processes in decentralized organizations. Speakers shared experiences from various DAOs.',
      transcript: 'DAO Member: Governance is the backbone of any successful DAO.\n\nCommunity Lead: We need better voting mechanisms that prevent whale dominance.\n\nDAO Member: Quadratic voting could help distribute influence more fairly.\n\nCommunity Lead: Transparency in decision-making is also crucial for trust.',
      duration: '37:45',
      participants: 4,
      space_id: '5y6z7a8b9c0d',
      createdAt: '2024-12-11T18:30:00Z',
      metadata: {
        confidence: 0.91,
        speakers: 4,
        chapters: 4
      }
    }
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  // Refs for transcript search
  const transcriptRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Notification functions
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      alert('Please enable notifications in your browser settings to receive alerts when summarization completes.');
      return false;
    }

    // Permission is 'default' - request it
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      return true;
    } else {
      return false;
    }
  };

  const toggleNotifications = async () => {
    if (notificationsEnabledRef.current) {
      // Disable notifications
      setNotificationsEnabled(false);
      notificationsEnabledRef.current = false;
      localStorage.setItem('content_summarizer_notifications', 'false');
    } else {
      // Enable notifications
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission) {
        setNotificationsEnabled(true);
        notificationsEnabledRef.current = true;
        localStorage.setItem('content_summarizer_notifications', 'true');
      }
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (!notificationsEnabledRef.current) {
      return;
    }
    
    if (!('Notification' in window)) {
      return;
    }
    
    if (Notification.permission !== 'granted') {
      return;
    }
    
    // Only send notification if tab is not active (user is in another tab)
    if (!document.hidden) {
      return;
    }
    
    try {
      const notification = new Notification(title, {
        body: body,
        icon: '/icons/image.svg'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
    } catch (error){}
  };

  // Task management
  const saveTaskToStorage = (task: Task) => {
    localStorage.setItem('currentTask', JSON.stringify(task));
  };

  const loadTaskFromStorage = () => {
    const taskData = localStorage.getItem('currentTask');
    if (taskData) {
      const task: Task = JSON.parse(taskData);
      setCurrentTask(task);
      
      if (task.status === 'completed' && task.result) {
        setResult(task.result);
        setIsFreshResult(false);
        setTypewriterShown(true);
        setIsLoading(false);
        setCountdownActive(false);
      } else if (task.status === 'running') {
        setIsLoading(true);
        setCountdownActive(true);
        startProgressSimulation(task);
      }
    }
  };

  const clearTaskFromStorage = () => {
    localStorage.removeItem('currentTask');
    setCurrentTask(null);
  };

  // History management functions
  const saveToHistory = (result: SummarizationResult, url: string, contentType: 'space' | 'broadcast') => {
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      title: `${contentType === 'space' ? 'Twitter Space' : 'Twitter Broadcast'} - ${new Date().toLocaleDateString()}`,
      url,
      contentType,
      summary: result.summary,
      transcript: result.transcript,
      duration: result.duration,
      participants: result.participants,
      space_id: result.space_id,
      broadcast_id: result.broadcast_id,
      createdAt: new Date().toISOString(),
      metadata: result.metadata
    };

    const updatedHistory = [historyItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('content_summarizer_history', JSON.stringify(updatedHistory));
  };

  const loadHistoryFromStorage = () => {
    const historyData = localStorage.getItem('content_summarizer_history');
    if (historyData) {
      try {
        const parsedHistory = JSON.parse(historyData);
        setHistory(parsedHistory);
      } catch (error) {
        console.error('Failed to parse history data:', error);
        setHistory([]);
      }
    }
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('content_summarizer_history', JSON.stringify(updatedHistory));
    
    // If the deleted item was selected, clear selection
    if (selectedHistoryItem?.id === id) {
      setSelectedHistoryItem(null);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setResult({
      summary: item.summary,
      transcript: item.transcript,
      duration: item.duration,
      participants: item.participants,
      space_id: item.space_id,
      broadcast_id: item.broadcast_id,
      metadata: item.metadata
    });
    setActiveTab('summary');
    setShowHistory(false);
    setIsFreshResult(false);
    setTypewriterShown(true);
  };

  const startProgressSimulation = (task: Task) => {
    const expectedDuration = contentType === 'space' ? 15 * 60 : 30 * 60; // 15 or 30 minutes
    const startTime = task.startTime;
    
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / (expectedDuration * 1000)) * 100, 95);
      const remaining = Math.max(expectedDuration - (elapsed / 1000), 0);
      
      setProgress(progressPercent);
      setTimeLeft(Math.ceil(remaining));
      
      if (remaining <= 0) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 1000);
  };

  const startBackgroundTask = async () => {
    // Clear any existing task
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    clearTaskFromStorage();

    // Create new task
    const task: Task = {
      id: Date.now().toString(),
      url,
      contentType,
      status: 'running',
      startTime: Date.now()
    };

    setCurrentTask(task);
    saveTaskToStorage(task);
    setIsLoading(true);
    setCountdownActive(true);
    setResult(null);
    setError(null);
    setIsFreshResult(false);
    setTypewriterShown(false);

    // Start progress simulation
    startProgressSimulation(task);

    // Make API call
    try {
      const endpoint = contentType === 'space' ? '/api/content-summarizer/spaces-chunked' : '/api/content-summarizer/broadcasts';
      const response = await axios.post(endpoint, { 
        space_url: url,
        is_ended: true 
      }, {
        timeout: 1800000, // 30 minutes timeout
        headers: { 'Content-Type': 'application/json' }
      });

      const data = response.data as SummarizationResult;
      
      // Update task as completed
      const completedTask: Task = {
        ...task,
        status: 'completed',
        result: data
      };

      setCurrentTask(completedTask);
      saveTaskToStorage(completedTask);
      setResult(data);
      setIsFreshResult(true);
      setIsLoading(false);
      setCountdownActive(false);

      // Save to history
      saveToHistory(data, url, contentType);

      // Clear progress simulation
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Send notification if in another tab
      const notificationBody = contentType === 'space' 
        ? 'Your Twitter Space has been processed successfully.' 
        : 'Your Twitter Broadcast has been processed successfully.';
      sendNotification('Content Summarization Complete! 🎉', notificationBody);

    } catch (error) {
      console.error('🐢 Slow or no connection detected, please try again:', error);
      
      // Update task as error
      const errorTask: Task = {
        ...task,
        status: 'error'
      };

      setCurrentTask(errorTask);
      saveTaskToStorage(errorTask);
      
      // Handle axios error
      if (error && typeof error === 'object' && 'isAxiosError' in error) {
        const axiosError = error as any;
        setError(`🐢 Slow or no connection detected, please try again: ${axiosError.response?.status || 'Network error'}`);
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
      
      setIsLoading(false);
      setCountdownActive(false);

      // Clear progress simulation
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    startBackgroundTask();
  };

  // Load task on mount
  useEffect(() => {
    loadTaskFromStorage();
    loadHistoryFromStorage();
    
    // Load notification preference - disabled by default
    const notificationSetting = localStorage.getItem('content_summarizer_notifications');
    // Only enable if explicitly set to 'true' in localStorage
    const isEnabled = notificationSetting === 'true';
    setNotificationsEnabled(isEnabled);
    notificationsEnabledRef.current = isEnabled;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Typewriter effect logic
  useEffect(() => {
    if (isFreshResult && !typewriterShown) {
      const duration = result?.summary ? (result.summary.length * 22) : 0;
      const timer = setTimeout(() => {
        setTypewriterShown(true);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isFreshResult, typewriterShown, result?.summary]);

  // Tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTaskFromStorage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!countdownActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownActive]);

  // Utility functions
  const handleCopySummary = async () => {
    if (result?.summary) {
      try {
        await navigator.clipboard.writeText(result.summary);
        // Show copied state briefly
        setTimeout(() => {}, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleCopyTranscript = async () => {
    if (result?.transcript) {
      try {
        await navigator.clipboard.writeText(result.transcript);
        // Show copied state briefly
        setTimeout(() => {}, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleCopyParagraph = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedParagraphIndex(index);
      setTimeout(() => setCopiedParagraphIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy paragraph:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.round(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    
    const contentToCopy = activeTab === 'summary' 
      ? `Content Summary\n\n${result.summary}`
      : `Content Transcript\n\n${result.transcript}`;
    
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleClearStorage = () => {
    // Clear all content summarizer related storage
    localStorage.removeItem('currentTask');
    localStorage.removeItem('content_summarizer_notifications');
    localStorage.removeItem('content_summarizer_history');
    
    // Clear state
    setHistory([]);
    setSelectedHistoryItem(null);
    
    // Refresh the page
    window.location.reload();
  };

  // Transcript search logic
  const transcriptMentions = result?.transcript ? (() => {
    if (!transcriptSearch) return [];
    const regex = new RegExp(transcriptSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const mentions: { paragraph: number; match: number }[] = [];
    const segments = result.transcript.split('\n\n');
    
    segments.forEach((segment, pIdx) => {
      const matches = segment.match(regex);
      if (matches) {
        matches.forEach((_, mIdx) => {
          mentions.push({ paragraph: pIdx, match: mIdx });
        });
      }
    });
    
    return mentions;
  })() : [];

  const goToMention = (direction: 'next' | 'prev') => {
    if (transcriptMentions.length === 0) return;
    
    if (direction === 'next') {
      setCurrentMention(prev => (prev + 1) % transcriptMentions.length);
    } else {
      setCurrentMention(prev => prev === 0 ? transcriptMentions.length - 1 : prev - 1);
    }
  };

  const goToMentionIndex = (index: number) => {
    setCurrentMention(index);
    const mention = transcriptMentions[index];
    if (mention && transcriptRefs.current[mention.paragraph]) {
      transcriptRefs.current[mention.paragraph]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-3xl text-white font-bold">𝕏</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Content Summarizer</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-2 py-1 text-xs bg-[#A259FF] hover:bg-[#8B4DFF] text-white rounded transition-colors cursor-pointer flex items-center gap-1"
                title="View history"
              >
                <MdHistory className="w-3 h-3" />
                History
              </button>
              <button
                onClick={handleClearStorage}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                title="Clear storage and refresh page"
              >
                <FiX className="w-3 h-3" />
                Clear Storage
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Get AI-powered transcriptions and summaries of Twitter Spaces and Broadcasts. Simply paste a URL below.
          </p>
        </div>


        {/* Countdown Timer */}
        {countdownActive && isLoading && !result && (
          <div className="bg-[rgba(24,26,32,0.2)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[4px_0px_6px_#00000040]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#A259FF] rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">
                    <span className="font-bold">{Math.floor(timeLeft / 60)} minutes</span> left to download and transcribe
                  </span>
              </div>
              <button 
                onClick={toggleNotifications}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
              >
                <div className="p-1 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span>{notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
              </button>
                </div>
                <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-2 shadow-inner">
                    <div 
                  className="bg-gradient-to-r from-[#A259FF] to-[#8B4DFF] h-2 rounded-full transition-all duration-2000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div 
                className="absolute top-0 w-2 h-2 bg-[#A259FF] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-2000 ease-out"
                    style={{ left: `calc(${progress}% - 4px)` }}
                  ></div>
            </div>
          </div>
        )}



        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[4px_0px_6px_#00000040]">
            <div className="flex items-center gap-2 text-red-400">
              <FiX className="w-4 h-4" />
              <span className="text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-[rgba(24,26,32,0.2)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-3 sm:p-4 mb-6 sm:mb-8 shadow-[4px_0px_6px_#00000040]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Content Type Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-gray-300">Content Type:</label>
              <div className="flex bg-[#181A20] rounded-lg p-1">
                <button
                  type="button"
                  className="px-3 py-1 rounded text-sm font-medium bg-[#A259FF] text-white cursor-default"
                >
                  Spaces
                </button>
                <button
                  type="button"
                  disabled={true}
                  className="px-3 py-1 rounded text-sm font-medium text-gray-500 cursor-not-allowed opacity-50"
                >
                  Broadcasts
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                {contentType === 'space' ? 'Twitter Space URL' : 'Twitter Broadcast URL'}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={contentType === 'space' 
                    ? "https://twitter.com/i/spaces/... or https://x.com/i/spaces/..."
                    : "https://twitter.com/i/broadcasts/... or https://x.com/i/broadcasts/..."
                  }
                  className="flex-1 px-3 sm:px-4 py-3 border border-[#23272b] bg-[#181A20] text-white rounded-lg placeholder-gray-500 text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="px-3 sm:px-4 py-2 bg-[#A259FF] text-white rounded-lg hover:bg-[#8B4DFF] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-3 h-3" />
                      Summarize {contentType === 'space' ? 'Space' : 'Broadcast'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl overflow-hidden shadow-[4px_0px_6px_#00000040]">
            {/* Space Info Header */}
            <div className="bg-gradient-to-r from-[rgba(24,26,32,0.2)] to-[rgba(42,46,53,0.2)] p-4 sm:p-6 border-b border-[#23272b]">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {contentType === 'space' ? 'Twitter Space' : 'Twitter Broadcast'} Summary
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">

                    {result.download && (
                      <>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{formatDuration(result.download.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiFileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{(result.download.file_size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      </>
                    )}
                    {result.metadata?.speakers && (
                      <div className="flex items-center gap-1">
                        <FiUsers className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{result.metadata.speakers} speakers</span>
                      </div>
                    )}
                    {result.metadata?.chapters && (
                      <div className="flex items-center gap-1">
                        <FiMessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{result.metadata.chapters} chapters</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={handleCopy}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#A259FF] text-white rounded-lg hover:bg-[#8B4DFF] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <FiCopy className="w-3 h-3 sm:w-4 sm:h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#23272b]">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 cursor-pointer ${
                    activeTab === 'summary'
                      ? 'border-[#A259FF] text-[#A259FF]'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 cursor-pointer ${
                    activeTab === 'transcript'
                      ? 'border-[#A259FF] text-[#A259FF]'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Full Transcript
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {activeTab === 'summary' ? (
                <div className="space-y-4">
                  <div className="bg-[rgba(24,26,32,0.2)] border border-[#2a2e35] rounded-lg p-4 sm:p-6">
                    <h3 className="font-semibold text-[#A259FF] mb-3 text-base sm:text-lg">AI Summary</h3>
                    <div className="text-gray-300 text-sm sm:text-base leading-relaxed prose prose-invert max-w-none">
                      {result && result.summary && (
                        isFreshResult && !typewriterShown ? (
                        <Typewriter 
                          text={result.summary} 
                          speed={10} 
                          className="prose prose-invert max-w-none"
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ 
                            __html: marked.parse(result.summary) 
                        }} />
                        )
                      )}
                    </div>
                  </div>
                  {result.metadata && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {result.metadata.confidence && (
                        <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                          <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Confidence</h4>
                          <p className="text-sm sm:text-base text-gray-400">
                            {(result.metadata.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                      {result.metadata.speakers && (
                        <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                          <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Speakers</h4>
                          <p className="text-sm sm:text-base text-gray-400">
                            {result.metadata.speakers} speakers detected
                          </p>
                        </div>
                      )}
                      {result.metadata.chapters && (
                        <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                          <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Chapters</h4>
                          <p className="text-sm sm:text-base text-gray-400">
                            {result.metadata.chapters} chapters identified
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-4 sm:p-6">
                    <h3 className="font-semibold text-white mb-4 text-base sm:text-lg">Full Transcript</h3>
                    {/* Finder UI */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                      <div className="flex items-center gap-2 flex-1">
                        <FiSearch className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={transcriptSearch}
                          onChange={e => setTranscriptSearch(e.target.value)}
                          placeholder="Find in transcript..."
                          className="bg-transparent border border-[#23272b] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none flex-1"
                        />
                      </div>
                      {transcriptSearch && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{transcriptMentions.length > 0 ? `${currentMention + 1} of ${transcriptMentions.length}` : 'No matches'}</span>
                          <button onClick={() => goToMention('prev')} disabled={transcriptMentions.length === 0} className="p-1 rounded hover:bg-[#23272b] disabled:opacity-50"><FiChevronLeft /></button>
                          <button onClick={() => goToMention('next')} disabled={transcriptMentions.length === 0} className="p-1 rounded hover:bg-[#23272b] disabled:opacity-50"><FiChevronRight /></button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 text-sm sm:text-base text-gray-300 leading-relaxed">
                      {(() => {
                        // First, unescape the transcript
                        const unescapedTranscript = result.transcript
                          .replace(/\\n/g, '\n')
                          .replace(/\\r/g, '\r')
                          .replace(/\\t/g, '\t')
                          .replace(/\\"/g, '"');
                        
                        // Parse the transcript into segments and filter out empty ones
                        // Also filter out metadata lines that start with JSON-like content
                        const segments = unescapedTranscript.split('\n\n')
                          .filter(segment => segment.trim())
                          .filter(segment => {
                            const trimmed = segment.trim();
                            // Filter out lines that look like JSON metadata
                            return !trimmed.startsWith('{"success":') && 
                                   !trimmed.startsWith('{"space_id":') && 
                                   !trimmed.startsWith('{"download":') &&
                                   !trimmed.startsWith('Space Transcript:') &&
                                   !trimmed.includes('"formatted_transcript"') &&
                                   !trimmed.includes('"metadata":{') &&
                                   !trimmed.includes('"language":"en"') &&
                                   !trimmed.includes('"segments":') &&
                                   !trimmed.includes('"confidence":null') &&
                                   !trimmed.includes('"speakers":null') &&
                                   !trimmed.includes('"chapters":null');
                          });
                        
                        return segments.map((segment, pIdx) => {
                          // Parse timestamp and speaker info
                          const timestampMatch = segment.match(/\[(\d{2}:\d{2}:\d{2})\]/);
                          const speakerMatch = segment.match(/Speaker:\s*(.+?)(?=\n|$)/);
                          
                          // Clean the content - remove timestamps and speaker labels
                          let cleanContent = segment
                            .replace(/\[\d{2}:\d{2}:\d{2}\]\s*/g, '') // Remove all timestamps
                            .replace(/Speaker:\s*/g, '') // Remove all "Speaker:" labels
                            .replace(/\n+/g, ' ') // Replace multiple newlines with single space
                            .trim();
                          
                          // Skip if content is empty after cleaning
                          if (!cleanContent) return null;
                          
                          let highlighted = cleanContent;
                          if (transcriptSearch) {
                            // Highlight all matches and add a unique class for the current mention
                            const regex = new RegExp(transcriptSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                            let matchIdx = 0;
                            highlighted = cleanContent.replace(regex, (match) => {
                              // Find the global mention index for this match
                              const globalIdx = transcriptMentions.findIndex(m => m.paragraph === pIdx && m.match === matchIdx);
                              const isCurrent = globalIdx === currentMention;
                              matchIdx++;
                              return `<mark class=\"bg-[#A259FF] text-white rounded${isCurrent ? ' outline outline-2 outline-[#A259FF]' : ''}\">${match}</mark>`;
                            });
                          }
                          
                                                      return (
                              <div
                                key={pIdx}
                                ref={el => { transcriptRefs.current[pIdx] = el; }}
                                className={`p-3 sm:p-4 bg-[rgba(24,26,32,0.3)] rounded border border-[#2a2e35] relative group transition-shadow`}
                              >
                                <div className="pr-8">
                                  {(speakerMatch || timestampMatch) && (
                                    <div className="flex items-center gap-2 mb-2 text-xs">
                                      {speakerMatch && (
                                        <span className="text-gray-400 font-medium">
                                          Speaker
                                        </span>
                                      )}
                                      {timestampMatch && (
                                        <span className="text-gray-500 font-mono bg-gray-800 px-2 py-1 rounded">
                                          {timestampMatch[1]}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="text-gray-300">
                                    <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCopyParagraph(cleanContent, pIdx)}
                                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors"
                                  title="Copy paragraph"
                                >
                                  {copiedParagraphIndex === pIdx ? (
                                    <FiCheckCircle className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <FiCopy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            );
                          }).filter(Boolean);
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="bg-[rgba(24,26,32,0.2)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[4px_0px_6px_#00000040]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MdHistory className="w-5 h-5" />
                Transcription History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-8">
                <MdHistory className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No transcriptions saved yet</p>
                <p className="text-gray-500 text-sm">Your processed transcriptions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-[rgba(24,26,32,0.3)] border rounded-lg p-4 transition-colors cursor-pointer ${
                      selectedHistoryItem?.id === item.id 
                        ? 'border-[#A259FF] bg-[rgba(162,89,255,0.1)]' 
                        : 'border-[#2a2e35] hover:border-[#3a3e45]'
                    }`}
                    onClick={() => loadHistoryItem(item)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate mb-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              item.contentType === 'space' ? 'bg-blue-400' : 'bg-green-400'
                            }`}></span>
                            {item.contentType === 'space' ? 'Space' : 'Broadcast'}
                          </span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.metadata?.speakers && (
                            <span className="flex items-center gap-1">
                              <FiUsers className="w-3 h-3" />
                              {item.metadata.speakers} speakers
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {item.summary.substring(0, 150)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadHistoryItem(item);
                          }}
                          className="p-2 text-gray-400 hover:text-[#A259FF] transition-colors"
                          title="View transcription"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete from history"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!result && !isLoading && showInstructions && (
          <div className="bg-[rgba(139,77,255,0.08)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 sm:p-6 shadow-[4px_0px_6px_#00000040] relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-[#A259FF] mb-2 text-sm sm:text-base">How to use:</h3>
            <ol className="text-gray-300 space-y-2 text-xs sm:text-sm">
              <li>1. Choose the content type (Spaces or Broadcasts)</li>
              <li>2. Find a Twitter Space or Broadcast you want to analyze</li>
              <li>3. Copy the URL (e.g., https://twitter.com/i/spaces/1a2b3c4d5e6f or https://x.com/i/broadcasts/1a2b3c4d5e6f)</li>
              <li>4. Paste the URL in the input field above</li>
              <li>5. Click 'Summarize' to get AI-powered transcription and summary</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
} 