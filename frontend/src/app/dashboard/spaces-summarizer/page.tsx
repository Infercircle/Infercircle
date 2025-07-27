'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiFileText, FiMessageSquare, FiClock, FiUsers, FiCopy, FiX, FiCheckCircle, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { FaSquareXTwitter } from 'react-icons/fa6';

interface SpaceResult {
  id: string;
  title: string;
  host: string;
  participants: number;
  duration: string;
  transcript: string;
  summary: string;
  timestamp: string;
  speakers: Array<{
    name: string;
    handle: string;
    pfp: string;
  }>;
}

// Typewriter component
function Typewriter({ text, speed = 25, className = "" }: { text: string; speed?: number; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const type = () => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i < text.length) {
        setTimeout(type, speed);
      }
    };
    type();
    return () => {};
  }, [text, speed]);
  return <span className={className}>{displayed}</span>;
}

export default function SpacesSummarizerPage() {
  const [spaceUrl, setSpaceUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('summary');
  const [result, setResult] = useState<SpaceResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [persistedSummary, setPersistedSummary] = useState<string>("");
  const [transcriptFadeKey, setTranscriptFadeKey] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [copiedParagraphIndex, setCopiedParagraphIndex] = useState<number | null>(null);
  // Finder state for per-mention navigation
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [transcriptMentions, setTranscriptMentions] = useState<{ paragraph: number; match: number; }[]>([]);
  const [currentMention, setCurrentMention] = useState(0);
  const transcriptRefs = useRef<(HTMLDivElement | null)[]>([]);

  const mockSpaceResult: SpaceResult = {
    id: '1a2b3c4d5e6f',
    title: 'The Future of Web3 and DeFi in 2024',
    host: '@crypto_expert',
    participants: 1250,
    duration: '1h 23m',
    transcript: `[00:00:00] Host: Welcome everyone to today's space about the future of Web3 and DeFi in 2024. We have some amazing speakers joining us today.

[00:02:15] Speaker 1: Thanks for having me. I think 2024 is going to be a pivotal year for DeFi. We're seeing institutional adoption like never before.

[00:05:30] Speaker 2: Absolutely agree. The regulatory clarity we're getting is really helping with mainstream adoption. But we need to focus on user experience.

[00:08:45] Host: Great point about UX. What specific trends are you seeing in the DeFi space right now?

[00:12:20] Speaker 1: Real yield farming is making a comeback, but with much better risk management. We're also seeing a lot of innovation in cross-chain solutions.

[00:15:10] Speaker 2: And let's not forget about the rise of social DeFi. Platforms that combine social features with DeFi are gaining traction.

[00:18:30] Host: What about the challenges? What should developers and users be aware of?

[00:22:15] Speaker 1: Security remains the biggest concern. We need better auditing standards and insurance solutions.

[00:25:40] Speaker 2: And scalability. Layer 2 solutions are helping, but we need more innovation here.

[00:28:55] Host: Excellent insights everyone. Let's take some questions from the audience...`,
    summary: `This Twitter Space discussed the future of Web3 and DeFi in 2024, featuring insights from industry experts. Key topics included:

• Institutional adoption reaching new heights in 2024
• Regulatory clarity driving mainstream adoption
• Focus on improving user experience in DeFi platforms
• Real yield farming making a comeback with better risk management
• Innovation in cross-chain solutions
• Rise of social DeFi platforms combining social features with DeFi
• Security and scalability as major challenges
• Need for better auditing standards and insurance solutions
• Layer 2 solutions helping with scalability but requiring more innovation

The discussion highlighted both opportunities and challenges facing the DeFi ecosystem as it moves toward mainstream adoption.`,
    timestamp: '2024-01-15T14:30:00Z',
    speakers: [
      {
        name: 'Crypto Expert',
        handle: '@crypto_expert',
        pfp: 'https://pbs.twimg.com/profile_images/1875319786856427520/727-k6ov.jpg'
      },
      {
        name: 'DeFi Analyst',
        handle: '@defi_analyst',
        pfp: 'https://pbs.twimg.com/profile_images/1875319786856427520/727-k6ov.jpg'
      },
      {
        name: 'Web3 Builder',
        handle: '@web3_builder',
        pfp: 'https://pbs.twimg.com/profile_images/1875319786856427520/727-k6ov.jpg'
      }
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceUrl.trim()) return;

    setResult(null); // Clear previous result immediately
    setPersistedSummary(""); // Clear persisted summary
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setResult(mockSpaceResult);
      setIsLoading(false);
    }, 2000);
  };

  // When a new result is set, update persistedSummary
  useEffect(() => {
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
    result.transcript.split('\n\n').forEach((paragraph, pIdx) => {
      const regex = new RegExp(transcriptSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match;
      let matchIdx = 0;
      while ((match = regex.exec(paragraph)) !== null) {
        mentions.push({ paragraph: pIdx, match: matchIdx });
        matchIdx++;
        // Prevent infinite loop for zero-width matches
        if (regex.lastIndex === match.index) regex.lastIndex++;
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

  const handleNextMention = () => {
    if (transcriptMentions.length === 0) return;
    setCurrentMention((prev) => (prev + 1) % transcriptMentions.length);
  };
  const handlePrevMention = () => {
    if (transcriptMentions.length === 0) return;
    setCurrentMention((prev) => (prev - 1 + transcriptMentions.length) % transcriptMentions.length);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleCopy = async () => {
    if (!result) return;
    
    const contentToCopy = activeTab === 'summary' 
      ? `Space Summary: ${result.title}\n\n${result.summary}`
      : `Space Transcript: ${result.title}\n\n${result.transcript}`;
    
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
            <span className="text-2xl sm:text-4xl text-white font-bold">𝕏</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Space Summarizer</h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Get AI-powered transcriptions and summaries of Twitter Spaces. Simply paste a Twitter Space URL below.
          </p>
        </div>

                {/* Input Form */}
        <div className="bg-[rgba(24,26,32,0.2)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[4px_0px_6px_#00000040]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="spaceUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Twitter Space URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  id="spaceUrl"
                  value={spaceUrl}
                  onChange={(e) => setSpaceUrl(e.target.value)}
                  placeholder="https://twitter.com/i/spaces/..."
                  className="flex-1 px-3 sm:px-4 py-3 border border-[#23272b] bg-[#181A20] text-white rounded-lg placeholder-gray-500 text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || !spaceUrl.trim()}
                  className="px-4 sm:px-6 py-3 bg-[#A259FF] text-white rounded-lg hover:bg-[#8B4DFF] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-4 h-4" />
                      Summarize Space
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
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">{result.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <FaSquareXTwitter className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{result.host}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiUsers className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{result.participants.toLocaleString()} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{result.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiFileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{formatTimestamp(result.timestamp)}</span>
                      <span className="sm:hidden">{new Date(result.timestamp).toLocaleDateString()}</span>
                    </div>
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
                    <p className="text-gray-300 whitespace-pre-line text-sm sm:text-base leading-relaxed">
                      {result && !persistedSummary ? (
                        <Typewriter text={result.summary} speed={22} />
                      ) : (
                        <span>{persistedSummary}</span>
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Key Topics</h4>
                      <ul className="text-sm sm:text-base text-gray-400 space-y-1">
                        <li>• Web3 & DeFi Trends</li>
                        <li>• Institutional Adoption</li>
                        <li>• Regulatory Clarity</li>
                        <li>• User Experience</li>
                      </ul>
                    </div>
                    <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Speakers</h4>
                      <div className="space-y-2">
                        {result.speakers && result.speakers.map((speaker, index) => (
                          <a
                            key={index}
                            href={`https://twitter.com/${speaker.handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[rgba(139,77,255,0.1)] transition-colors cursor-pointer"
                          >
                            <img
                              src={speaker.pfp}
                              alt={speaker.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-sm text-gray-300 hover:text-white transition-colors">
                              {speaker.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {speaker.handle}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Duration</h4>
                      <p className="text-sm sm:text-base text-gray-400">{result.duration}</p>
                    </div>
                  </div>
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
                      {result.transcript.split('\n\n').map((paragraph, pIdx) => {
                        let highlighted = paragraph;
                        if (transcriptSearch) {
                          // Highlight all matches and add a unique class for the current mention
                          const regex = new RegExp(transcriptSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                          let matchIdx = 0;
                          highlighted = paragraph.replace(regex, (match) => {
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
                              <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                            </div>
                            <button
                              onClick={() => handleCopyParagraph(paragraph, pIdx)}
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
                      })}
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
              <li>1. Find a recorded Twitter Space you want to analyze (live or unrecorded spaces are not supported)</li>
              <li>2. Copy the URL from the space (e.g., https://twitter.com/i/spaces/1a2b3c4d5e6f)</li>
              <li>3. Paste the URL in the input field above</li>
              <li>4. Click 'Analyze Space' to get AI-powered transcription and summary</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
} 