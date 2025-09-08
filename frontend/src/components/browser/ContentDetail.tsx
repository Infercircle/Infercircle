"use client";

import React, { useState } from "react";
import { FiChevronLeft, FiChevronUp, FiChevronDown, FiZap } from "react-icons/fi";

interface ContentDetailProps {
  selectedItem: string | null;
  onBack: () => void;
}

export default function ContentDisplay({ selectedItem, onBack }: ContentDetailProps) {
  const [currentKeywordPage, setCurrentKeywordPage] = useState(1);
  const [totalKeywordPages] = useState(28);

  const mockContent = {
    "1": {
      title: "EIGEN: The Universal Intersubjective Work Token - Soubhik Deb (EigenLayer)",
      event: "Research Day",
      date: "21 May, 2024 - 1:00 AM",
      speaker: "Soubhik Deb",
      transcript: [
        {
          time: "00:00:07",
          speaker: "Soubhik Deb",
          content: "Hi, everyone. I'm Soubhik Deb from Eigen Labs. So recently, we put out our token white paper where we talked about intersubjectively attributable faults and how we can use the EIGEN token for resolving such faults in digital tasks. So today's talk from me will be on that topic. So EigenLayer's broad vision is to help in assuring open innovation in the digital space in a very scalable manner. So by scalability, what we mean is that not everyone has to do actual work in a digital task, but anyone should be able to monitor and resolve faults that can happen in the execution of the task. So some of the previous talks have already touched those things. And this approach is quite similar to the requirement that you need in the physical commons also. So something similar we also want in the digital commons. So first, what does it mean to be intersubjectively attributable faults? To understand what intersubjectivity means, let's first go through a short explanation on the taxonomy of the digital tasks."
        },
        {
          time: "00:01:18",
          speaker: "Soubhik Deb",
          content: "So objectively attributable faults are those where the fault can be determined by looking at the on-chain data alone. So examples include EVM code execution or double signing. So these are faults that can be determined by looking at the blockchain data alone without requiring any external information."
        }
      ],
      keywordHits: [
        "So recently, we put out our token white paper where we talked about intersubjectively attributable faults and how we can use the EIGEN token for resolving such faults in digital tasks.",
        "So EigenLayer's broad vision is to help in assuring open innovation in the digital space in a very scalable manner.",
        "Consider this simple figure where EIGEN is being used for staking in EigenLayer.",
        "If majority of the EIGEN stakers were to turn malicious and cause an intersubjectively attributable fault in one of the AVSs, then a new fork of the EIGEN, we represent that in this figure with EIGEN tilde, will be spawned, will be birthed where the malicious stakers will be penalized by restricting them from being able to redeem the tokens from this new fork.",
        "A core advantage by having EIGEN social consensus mediate on resolving this intersubjectively attributable fault in AVSs is that now it does not overload Ethereum social consensus anymore."
      ],
      relatedVisuals: [
        {
          title: "EIGEN: The Universal Intersubjective Work Token - Towards the Open Verifiable Digital Commons",
          type: "slide",
          thumbnail: "📊"
        },
        {
          title: "RESEARCH DAY 2024",
          type: "video",
          thumbnail: "🎤"
        },
        {
          title: "Taxonomy of Digital Tasks",
          type: "diagram",
          thumbnail: "📈"
        }
      ]
    }
  };

  if (!selectedItem || !mockContent[selectedItem as keyof typeof mockContent]) {
    return (
      <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded-2xl shadow-lg h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">Select a content item</div>
          <div className="text-sm">Choose an item from the list to view details</div>
        </div>
      </div>
    );
  }

  const content = mockContent[selectedItem as keyof typeof mockContent];

  return (
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded-2xl shadow-lg h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              <FiChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to overview</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-purple-500/20 border border-purple-400/30 rounded hover:bg-purple-500/30 transition-colors cursor-pointer">
              <FiZap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">TL;DR</span>
            </button>
          </div>
          
          <div className="mb-2">
            <span className="text-sm text-gray-400">{content.event}</span>
            <span className="text-sm text-gray-400 ml-2">•</span>
            <span className="text-sm text-gray-400 ml-2">{content.date}</span>
          </div>
          
          <h1 className="text-xl font-semibold text-white leading-tight">
            {content.title}
          </h1>
        </div>

        {/* Three Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Keyword Hits */}
          <div className="w-1/3 border-r border-[#23272b] flex flex-col">
            <div className="p-4 border-b border-[#23272b] flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Keyword Hits</h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">{currentKeywordPage}/{totalKeywordPages}</span>
                <div className="flex flex-col">
                  <button 
                    onClick={() => setCurrentKeywordPage(Math.max(1, currentKeywordPage - 1))}
                    className="p-1 hover:bg-[rgba(36,37,42,0.25)] rounded transition-colors cursor-pointer"
                  >
                    <FiChevronUp className="w-3 h-3 text-gray-400" />
                  </button>
                  <button 
                    onClick={() => setCurrentKeywordPage(Math.min(totalKeywordPages, currentKeywordPage + 1))}
                    className="p-1 hover:bg-[rgba(36,37,42,0.25)] rounded transition-colors cursor-pointer"
                  >
                    <FiChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {content.keywordHits.map((hit, index) => (
                  <div key={index} className="text-sm text-gray-300 leading-relaxed">
                    {hit.split(' ').map((word, wordIndex) => {
                      const isKeyword = ['EIGEN', 'EigenLayer', 'AVSs', 'Ethereum'].some(keyword => 
                        word.toLowerCase().includes(keyword.toLowerCase())
                      );
                      return (
                        <span 
                          key={wordIndex} 
                          className={isKeyword ? "text-white font-medium" : ""}
                        >
                          {word}{' '}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel - Conversation Content */}
          <div className="w-1/2 border-r border-[#23272b] flex flex-col">
            <div className="p-4 border-b border-[#23272b]">
              <h3 className="text-sm font-medium text-white">Conversation content</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {content.transcript.map((segment, index) => (
                  <div key={index}>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-gray-400">{segment.time}</span>
                      <span className="text-sm font-medium text-white">{segment.speaker}</span>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {segment.content.split(' ').map((word, wordIndex) => {
                        const isHighlighted = word.toLowerCase().includes('white paper') || 
                                             word.toLowerCase().includes('intersubjectively') ||
                                             word.toLowerCase().includes('open innovation');
                        return (
                          <span 
                            key={wordIndex} 
                            className={isHighlighted ? "bg-red-500/20 text-white px-1 rounded" : ""}
                          >
                            {word}{' '}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Related Visuals */}
          <div className="w-1/6 flex flex-col">
            <div className="p-4 border-b border-[#23272b]">
              <h3 className="text-sm font-medium text-white">Related Visuals</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {content.relatedVisuals.map((visual, index) => (
                  <div key={index} className="cursor-pointer hover:bg-[rgba(36,37,42,0.25)] rounded-lg p-3 transition-colors">
                    <div className="w-full h-20 bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-2xl">{visual.thumbnail}</span>
                    </div>
                    <div className="text-xs text-gray-300 leading-tight">
                      {visual.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}