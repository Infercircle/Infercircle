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
  metadata: {
    confidence: number;
    speakers: number;
    chapters: number;
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

export default function SpacesSummarizerPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setResult(null); // Clear previous result immediately
    setPersistedSummary(""); // Clear persisted summary
    setError(null); // Clear previous errors
    setIsLoading(true);
    
    try {
      const endpoint = contentType === 'space' 
        ? '/api/twitterspaces/spaces/summarize'
        : '/api/twitterspaces/broadcasts/summarize';
      
      const body = contentType === 'space' 
        ? { space_url: url.trim(), is_ended: false }
        : { broadcast_url: url.trim() };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process space');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error processing space:', err);
      setError(err instanceof Error ? err.message : 'Failed to process space');
    } finally {
      setIsLoading(false);
    }
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
      ? `Space Summary\n\n${result.summary}`
      : `Space Transcript\n\n${result.transcript}`;
    
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
                  onClick={() => setContentType('space')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    contentType === 'space'
                      ? 'bg-[#A259FF] text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Spaces
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('broadcast')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    contentType === 'broadcast'
                      ? 'bg-[#A259FF] text-white'
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
                      Processing...
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
                    {contentType === 'space' ? 'Twitter Space' : 'Twitter Broadcast'} {result.space_id || result.broadcast_id}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <FaSquareXTwitter className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{contentType === 'space' ? 'Space' : 'Broadcast'} ID: {result.space_id || result.broadcast_id}</span>
                    </div>
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
                    <div className="flex items-center gap-1">
                      <FiUsers className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{result.metadata.speakers} speakers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{result.metadata.chapters} chapters</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Confidence</h4>
                      <p className="text-sm sm:text-base text-gray-400">
                        {(result.metadata.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Speakers</h4>
                      <p className="text-sm sm:text-base text-gray-400">
                        {result.metadata.speakers} speakers detected
                      </p>
                    </div>
                    <div className="bg-[rgba(24,26,32,0.2)] rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Chapters</h4>
                      <p className="text-sm sm:text-base text-gray-400">
                        {result.metadata.chapters} chapters identified
                      </p>
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