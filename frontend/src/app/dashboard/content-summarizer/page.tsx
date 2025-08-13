'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiFileText, FiMessageSquare, FiClock, FiUsers, FiCopy, FiX, FiCheckCircle, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { FaSquareXTwitter } from 'react-icons/fa6';
import { marked } from 'marked';

interface SpaceResult {
  space_id?: string;
  broadcast_id?: string;
  summary: string;
  transcript: string;
  metadata?: {
    confidence?: number;
    speakers?: number;
    chapters?: number;
  };
  download?: {
    file_path: string;
    file_size: number;
    duration: number;
  };
}

// Typewriter component
function Typewriter({ text, speed = 25, className = "" }: { text: string; speed?: number; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const type = () => {
      const currentText = text.slice(0, i + 1);
      setDisplayed(currentText);
      i++;
      if (i < text.length) {
        setTimeout(type, speed);
      }
    };
    type();
    return () => {};
  }, [text, speed]);
  
  // Configure marked options for better rendering
  marked.setOptions({
    breaks: true,
    gfm: true
  });
  
  // Render markdown for the displayed text
  const renderedContent = marked.parse(displayed);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

export default function ContentSummarizerPage() {
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<'space' | 'broadcast'>('space');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('summary');
  const [result, setResult] = useState<SpaceResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [persistedSummary, setPersistedSummary] = useState<string>("");
  const [transcriptFadeKey, setTranscriptFadeKey] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [copiedParagraphIndex, setCopiedParagraphIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Finder state for per-mention navigation
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [transcriptMentions, setTranscriptMentions] = useState<{ paragraph: number; match: number; }[]>([]);
  const [currentMention, setCurrentMention] = useState(0);
  const transcriptRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Countdown timer state
  const [countdownActive, setCountdownActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setResult(null); // Clear previous result immediately
    setPersistedSummary(""); // Clear persisted summary
    setError(null); // Clear previous errors
    setIsLoading(true);
    
    // Start countdown timer
    const totalTime = 2 * 60; // 2 minutes in seconds
    setTimeLeft(totalTime);
    setProgress(0);
    setCountdownActive(true);
    
    // Simulate API delay (2 minutes for testing)
    await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
    
    // Mock data for development
    const mockData: SpaceResult = {
      space_id: 'mock-space-123',
      summary: `# 🚀 Crypto Market Analysis & Future Trends

## Introduction
This Twitter Space featured **@crypto_analyst** and **@defi_builder** discussing the current state of the crypto market, emerging trends, and what to expect in the coming months. The session was highly informative with deep insights into DeFi protocols and market dynamics.

## 🧠 Key Insights

- **Market Sentiment**: The overall sentiment remains cautiously optimistic despite recent volatility
- **Institutional Adoption**: Major institutions are quietly accumulating Bitcoin and Ethereum
- **DeFi Innovation**: New protocols are emerging that solve real-world problems
- **Regulatory Landscape**: Clearer regulations are expected in Q2 2024

## 📚 Terminology Explained

- **MEV (Maximal Extractable Value)**: The maximum value that can be extracted from block production in excess of the standard block reward and gas fees
- **Layer 2 Scaling**: Solutions built on top of existing blockchains to improve transaction throughput
- **Yield Farming**: The practice of lending or staking crypto assets to earn rewards

## ⚠️ Problems Identified

- **High Gas Fees**: Ethereum network congestion continues to be a major concern
- **Centralization Risks**: Some DeFi protocols are becoming increasingly centralized
- **Security Vulnerabilities**: Smart contract exploits remain a significant threat
- **User Experience**: Complex interfaces are still a barrier to mainstream adoption

## 💡 Proposed Solutions

- **Layer 2 Adoption**: Encouraging users to migrate to L2 solutions for lower fees
- **Cross-Chain Bridges**: Improving interoperability between different blockchains
- **Better UX Design**: Simplifying DeFi interfaces for non-technical users
- **Enhanced Security**: Implementing more robust security measures and audits

## 🔮 What's Coming Next

- **Ethereum 2.0**: Full transition to proof-of-stake expected by end of 2024
- **CBDCs**: Central Bank Digital Currencies will likely impact the crypto landscape
- **Web3 Gaming**: Gaming tokens and NFTs are expected to see significant growth
- **DeFi 2.0**: Next generation of DeFi protocols with improved efficiency

## 🎯 Final Takeaways

1. **Long-term Perspective**: Focus on fundamentals rather than short-term price movements
2. **Diversification**: Spread investments across different sectors and protocols
3. **Education**: Continuous learning is crucial in this rapidly evolving space
4. **Risk Management**: Never invest more than you can afford to lose

The session concluded with a Q&A where participants discussed specific investment strategies and upcoming projects to watch.`,
      transcript: `[00:00:00] Speaker: Welcome everyone to today's crypto market analysis session. I'm @crypto_analyst and I'm joined by @defi_builder. We'll be discussing the current state of the market and what we can expect in the coming months.

[00:00:15] Speaker: Thanks for having me. The market has been quite volatile lately, but I think we're seeing some interesting patterns emerge.

[00:00:30] Speaker: Absolutely. Let's start with the overall sentiment. Despite the recent price fluctuations, institutional adoption is quietly accelerating behind the scenes.

[00:00:45] Speaker: That's a great point. We're seeing major players like BlackRock and Fidelity entering the space, which is a strong signal for long-term growth.

[00:01:00] Speaker: The DeFi space is particularly interesting right now. New protocols are emerging that actually solve real problems, not just copy existing solutions.

[00:01:15] Speaker: I agree. The innovation in DeFi is incredible. We're seeing protocols that address issues like MEV, cross-chain interoperability, and user experience.

[00:01:30] Speaker: Let's talk about some of the challenges we're facing. Gas fees on Ethereum are still a major concern for users.

[00:01:45] Speaker: Yes, that's why Layer 2 solutions are so important. We need to encourage more users to migrate to L2s for their daily transactions.

[00:02:00] Speaker: Security is another critical issue. Smart contract exploits are still happening too frequently.

[00:02:15] Speaker: That's why proper auditing and security measures are essential. Users should always DYOR and understand the risks.

[00:02:30] Speaker: Looking ahead, what are your thoughts on Ethereum 2.0 and the transition to proof-of-stake?

[00:02:45] Speaker: The transition is going well so far. We should see the full implementation by the end of 2024, which will significantly reduce energy consumption.

[00:03:00] Speaker: And what about regulatory developments? How do you see that affecting the market?

[00:03:15] Speaker: Regulation is inevitable and actually necessary for mainstream adoption. We need clear guidelines to protect users while fostering innovation.

[00:03:30] Speaker: Great insights everyone. Let's open it up for questions from the audience.

[00:03:45] Speaker: Thanks for the comprehensive overview. This has been very informative for our community.`,
      metadata: {
        confidence: 0.95,
        speakers: 2,
        chapters: 6
      },
      download: {
        file_path: '/tmp/mock_audio.mp3',
        file_size: 15728640, // 15MB
        duration: 225 // 3 minutes 45 seconds
      }
    };
    
    setResult(mockData);
      setIsLoading(false);
    setCountdownActive(false); // Stop countdown when done
  };

  // When a new result is set, update persistedSummary
  useEffect(() => {
    console.log('Result changed:', result);
    if (result && result.summary) {
      setPersistedSummary("");
      // Use a timeout to allow the typewriter to animate, then persist the summary
      setTimeout(() => setPersistedSummary(result.summary), result.summary.length * 22 + 500);
    }
  }, [result]);

  // When switching to transcript tab, increment the fade key to re-trigger fade-in
  useEffect(() => {
    if (activeTab === 'transcript') {
      setTranscriptFadeKey((k) => k + 1);
    }
  }, [activeTab]);

  // Update mentions when search or transcript changes
  useEffect(() => {
    if (!result || !transcriptSearch) {
      setTranscriptMentions([]);
      setCurrentMention(0);
      return;
    }
    const mentions: { paragraph: number; match: number; }[] = [];
    
    // Use the same parsing logic as the display
    const unescapedTranscript = result.transcript
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"');
    
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
    
    segments.forEach((segment, pIdx) => {
      // Clean the content the same way as display
      const cleanContent = segment
        .replace(/\[\d{2}:\d{2}:\d{2}\]\s*/g, '')
        .replace(/Speaker:\s*/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      
      if (cleanContent) {
        const regex = new RegExp(transcriptSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;
        let matchIdx = 0;
        while ((match = regex.exec(cleanContent)) !== null) {
          mentions.push({ paragraph: pIdx, match: matchIdx });
          matchIdx++;
          // Prevent infinite loop for zero-width matches
          if (regex.lastIndex === match.index) regex.lastIndex++;
        }
      }
    });
    
    setTranscriptMentions(mentions);
    setCurrentMention(mentions.length > 0 ? 0 : -1);
  }, [transcriptSearch, result]);

  // Scroll to current mention
  useEffect(() => {
    if (transcriptMentions.length > 0 && transcriptRefs.current[transcriptMentions[currentMention]?.paragraph]) {
      transcriptRefs.current[transcriptMentions[currentMention].paragraph]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMention, transcriptMentions]);

  // Countdown timer effect
  useEffect(() => {
    if (!countdownActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCountdownActive(false);
          return 0;
        }
        return prev - 1;
      });
      
          // Update progress
    const totalTime = 2 * 60; // 2 minutes in seconds
    const newProgress = ((totalTime - timeLeft + 1) / totalTime) * 100;
      setProgress(newProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownActive, timeLeft, contentType]);

  const handleNextMention = () => {
    if (transcriptMentions.length === 0) return;
    setCurrentMention((prev) => (prev + 1) % transcriptMentions.length);
  };
  const handlePrevMention = () => {
    if (transcriptMentions.length === 0) return;
    setCurrentMention((prev) => (prev - 1 + transcriptMentions.length) % transcriptMentions.length);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
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

  const handleCopyParagraph = async (paragraph: string, index: number) => {
    try {
      await navigator.clipboard.writeText(paragraph);
      setCopiedParagraphIndex(index);
      setTimeout(() => setCopiedParagraphIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy paragraph: ', err);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <span className="text-xl sm:text-3xl text-white font-bold">𝕏</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Content Summarizer</h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Get AI-powered transcriptions and summaries of Twitter Spaces and Broadcasts. Simply paste a URL below.
          </p>
        </div>

        {/* Development Banner */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[4px_0px_6px_#00000040]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐒</span>
            <div className="flex-1">
              <p className="text-yellow-300 font-medium text-sm sm:text-base">
                This feature is still under development. The tech monkeys are working hard to fix it! Feel free to test with any URL to see the mock data and preview what to expect.
              </p>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        {countdownActive && (
          <div className="bg-[rgba(24,26,32,0.2)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[4px_0px_6px_#00000040]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-[#A259FF] rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">
                    <span className="font-bold">{Math.floor(timeLeft / 60)} minutes</span> left to download and transcribe
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-700 rounded-full h-2 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-[#A259FF] to-[#8B4DFF] h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div 
                    className="absolute top-0 w-2 h-2 bg-[#A259FF] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all duration-1000 ease-out"
                    style={{ left: `calc(${progress}% - 4px)` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 ml-4">
                <div className="p-1 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span>{notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
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
                  onClick={() => !isLoading && setContentType('space')}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer ${
                    contentType === 'space'
                      ? 'bg-[#A259FF] text-white'
                      : isLoading 
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Spaces
                </button>
                <button
                  type="button"
                  onClick={() => !isLoading && setContentType('broadcast')}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer ${
                    contentType === 'broadcast'
                      ? 'bg-[#A259FF] text-white'
                      : isLoading 
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-gray-400 hover:text-gray-300'
                  }`}
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
                  <div className="fade-in bg-[rgba(24,26,32,0.2)] border border-[#2a2e35] rounded-lg p-4 sm:p-6">
                    <h3 className="font-semibold text-[#A259FF] mb-3 text-base sm:text-lg">AI Summary</h3>
                    <div className="text-gray-300 text-sm sm:text-base leading-relaxed prose prose-invert max-w-none">
                      {result && !persistedSummary ? (
                        <Typewriter 
                          text={result.summary} 
                          speed={22} 
                          className="prose prose-invert max-w-none"
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ 
                          __html: marked.parse(persistedSummary) 
                        }} />
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
                  <div key={transcriptFadeKey} className="fade-in bg-[rgba(24,26,32,0.2)] rounded-lg p-4 sm:p-6">
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
                          <button onClick={handlePrevMention} disabled={transcriptMentions.length === 0} className="p-1 rounded hover:bg-[#23272b] disabled:opacity-50"><FiChevronUp /></button>
                          <button onClick={handleNextMention} disabled={transcriptMentions.length === 0} className="p-1 rounded hover:bg-[#23272b] disabled:opacity-50"><FiChevronDown /></button>
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
                                <div className="pr-12">
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
                                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
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