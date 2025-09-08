"use client";

import React, { useState } from "react";
import { FiChevronLeft, FiChevronUp, FiChevronDown, FiZap } from "react-icons/fi";
import { availableProjects } from "./TopNavigation";

interface ContentDetailProps {
  selectedItem: string | null;
  onBack: () => void;
  selectedProject: string;
}

export default function ContentDisplay({ selectedItem, onBack, selectedProject }: ContentDetailProps) {
  const [currentKeywordPage, setCurrentKeywordPage] = useState(1);
  const [totalKeywordPages] = useState(28);

  // Get current project data
  const currentProject = availableProjects.find(project => project.id === selectedProject) || availableProjects[0];

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
      ]
    },
    "2": {
      title: "The 'State of Staking' Panel: Decentralization, Security, and UX",
      event: "ETHDenver",
      date: "28 Feb, 2024 - 2:30 PM",
      speaker: "Freddy Zwanzger, Raul Sanchez",
      transcript: [
        {
          time: "00:00:15",
          speaker: "Freddy Zwanzger",
          content: "Welcome everyone to the State of Staking panel. Today we'll be discussing the current landscape of staking, focusing on decentralization, security, and user experience. The staking ecosystem has evolved significantly, and we're seeing new innovations in how we approach validator security and user accessibility."
        },
        {
          time: "00:02:30",
          speaker: "Raul Sanchez",
          content: "From a security perspective, we're seeing interesting developments in slashing mechanisms and how different protocols handle validator misbehavior. The key is finding the right balance between security and accessibility for users."
        }
      ],
      keywordHits: [
        "The staking ecosystem has evolved significantly, and we're seeing new innovations in how we approach validator security and user accessibility.",
        "From a security perspective, we're seeing interesting developments in slashing mechanisms and how different protocols handle validator misbehavior.",
        "The key is finding the right balance between security and accessibility for users."
      ]
    },
    "3": {
      title: "(Re)Staking In The Modular End Game",
      event: "ETHDenver",
      date: "28 Feb, 2024 - 4:00 PM",
      speaker: "Stanley He, Thalita Franklin, Tina Haibody",
      transcript: [
        {
          time: "00:00:20",
          speaker: "Stanley He",
          content: "Today we're going to explore the concept of restaking in the context of modular blockchains. As we move towards a more modular future, the way we think about staking and security needs to evolve. Restaking allows us to leverage existing stake for multiple purposes, increasing capital efficiency."
        }
      ],
      keywordHits: [
        "Today we're going to explore the concept of restaking in the context of modular blockchains.",
        "As we move towards a more modular future, the way we think about staking and security needs to evolve.",
        "Restaking allows us to leverage existing stake for multiple purposes, increasing capital efficiency."
      ]
    },
    "4": {
      title: "EigenLayer: The Future of Restaking",
      event: "ETHDenver",
      date: "29 Feb, 2024 - 10:00 AM",
      speaker: "Sreeram Kannan",
      transcript: [
        {
          time: "00:00:10",
          speaker: "Sreeram Kannan",
          content: "EigenLayer represents a paradigm shift in how we think about blockchain security. By allowing ETH stakers to opt into additional slashing conditions, we can bootstrap security for new protocols without requiring them to build their own validator set from scratch."
        }
      ],
      keywordHits: [
        "EigenLayer represents a paradigm shift in how we think about blockchain security.",
        "By allowing ETH stakers to opt into additional slashing conditions, we can bootstrap security for new protocols without requiring them to build their own validator set from scratch."
      ]
    },
    "5": {
      title: "Building on EigenLayer: A Developer's Perspective",
      event: "ETHDenver",
      date: "29 Feb, 2024 - 11:30 AM",
      speaker: "Alex Gluchowski",
      transcript: [
        {
          time: "00:00:25",
          speaker: "Alex Gluchowski",
          content: "From a developer's perspective, EigenLayer opens up new possibilities for building secure applications. The ability to leverage Ethereum's security for new protocols is game-changing. We're seeing developers experiment with new use cases that weren't possible before."
        }
      ],
      keywordHits: [
        "From a developer's perspective, EigenLayer opens up new possibilities for building secure applications.",
        "The ability to leverage Ethereum's security for new protocols is game-changing.",
        "We're seeing developers experiment with new use cases that weren't possible before."
      ]
    },
    "6": {
      title: "The Economics of Restaking",
      event: "ETHDenver",
      date: "29 Feb, 2024 - 1:00 PM",
      speaker: "Vitalik Buterin",
      transcript: [
        {
          time: "00:00:30",
          speaker: "Vitalik Buterin",
          content: "The economic implications of restaking are profound. We need to carefully consider the incentives and potential risks. While restaking can increase capital efficiency, we must ensure that the security guarantees remain strong and that the system remains decentralized."
        }
      ],
      keywordHits: [
        "The economic implications of restaking are profound. We need to carefully consider the incentives and potential risks.",
        "While restaking can increase capital efficiency, we must ensure that the security guarantees remain strong and that the system remains decentralized."
      ]
    },
    "7": {
      title: "EigenLayer Security Model Deep Dive",
      event: "ETHDenver",
      date: "29 Feb, 2024 - 2:30 PM",
      speaker: "Justin Drake",
      transcript: [
        {
          time: "00:00:18",
          speaker: "Justin Drake",
          content: "Let's dive deep into EigenLayer's security model. The key innovation is the concept of intersubjective slashing, where faults can be determined through social consensus rather than just on-chain data. This opens up new possibilities for securing off-chain computations and data availability."
        }
      ],
      keywordHits: [
        "Let's dive deep into EigenLayer's security model. The key innovation is the concept of intersubjective slashing, where faults can be determined through social consensus rather than just on-chain data.",
        "This opens up new possibilities for securing off-chain computations and data availability."
      ]
    },
    "8": {
      title: "AVS Development on EigenLayer",
      event: "ETHDenver",
      date: "29 Feb, 2024 - 4:00 PM",
      speaker: "Sreeram Kannan",
      transcript: [
        {
          time: "00:00:22",
          speaker: "Sreeram Kannan",
          content: "Building Actively Validated Services (AVSs) on EigenLayer requires careful consideration of the security model. Developers need to understand how to properly implement slashing conditions and ensure their services can be validated by the restaking ecosystem."
        }
      ],
      keywordHits: [
        "Building Actively Validated Services (AVSs) on EigenLayer requires careful consideration of the security model.",
        "Developers need to understand how to properly implement slashing conditions and ensure their services can be validated by the restaking ecosystem."
      ]
    },
    "9": {
      title: "Mixed EIGEN Feelings",
      event: "Medium Article",
      date: "29 Apr, 2024 - 3:00 PM",
      speaker: "Bankless",
      transcript: [
        {
          time: "00:00:05",
          speaker: "Bankless",
          content: "The EIGEN token launch has generated mixed reactions across the crypto community. While some see it as a necessary step for EigenLayer's growth, others have concerns about the tokenomics and distribution model. Let's break down the key points and what they mean for the future of restaking."
        }
      ],
      keywordHits: [
        "The EIGEN token launch has generated mixed reactions across the crypto community.",
        "While some see it as a necessary step for EigenLayer's growth, others have concerns about the tokenomics and distribution model.",
        "Let's break down the key points and what they mean for the future of restaking."
      ]
    },
    "11": {
      title: "Celestia Modular",
      event: "Twitter Space",
      date: "25 May, 2024 - 7:00 PM",
      speaker: "Mustafa Al-Bassam, Ismail Khoffi",
      transcript: [
        {
          time: "00:00:12",
          speaker: "Mustafa Al-Bassam",
          content: "Data availability is a critical component of modular blockchains. At Celestia, we're building the infrastructure to support a modular future where different execution layers can share the same data availability layer. This approach allows for better scalability and specialization."
        }
      ],
      keywordHits: [
        "Data availability is a critical component of modular blockchains.",
        "At Celestia, we're building the infrastructure to support a modular future where different execution layers can share the same data availability layer.",
        "This approach allows for better scalability and specialization."
      ]
    },
    "12": {
      title: "Farcaster Protocol Updates",
      event: "Farcaster Post",
      date: "20 May, 2024 - 2:00 PM",
      speaker: "Dan Romero",
      transcript: [
        {
          time: "00:00:08",
          speaker: "Dan Romero",
          content: "Excited to share some updates on the Farcaster protocol. We've been working on improving the user experience and adding new features that make decentralized social networking more accessible. The community response has been incredible."
        }
      ],
      keywordHits: [
        "Excited to share some updates on the Farcaster protocol.",
        "We've been working on improving the user experience and adding new features that make decentralized social networking more accessible.",
        "The community response has been incredible."
      ]
    },
    "13": {
      title: "Discord Community Discussion",
      event: "Discord Chat",
      date: "18 May, 2024 - 8:00 PM",
      speaker: "Community Members",
      transcript: [
        {
          time: "00:00:15",
          speaker: "Community Member",
          content: "The recent developments in the restaking space have been fascinating. It's exciting to see how EigenLayer is changing the game and opening up new possibilities for developers and users alike."
        }
      ],
      keywordHits: [
        "The recent developments in the restaking space have been fascinating.",
        "It's exciting to see how EigenLayer is changing the game and opening up new possibilities for developers and users alike."
      ]
    },
    "14": {
      title: "Telegram Community Update",
      event: "Telegram Channel",
      date: "15 May, 2024 - 6:00 PM",
      speaker: "Admin",
      transcript: [
        {
          time: "00:00:10",
          speaker: "Admin",
          content: "Quick update for the community: We're seeing increased activity in the restaking ecosystem. The EIGEN token launch has brought a lot of attention to the space, and we're excited to see what comes next."
        }
      ],
      keywordHits: [
        "Quick update for the community: We're seeing increased activity in the restaking ecosystem.",
        "The EIGEN token launch has brought a lot of attention to the space, and we're excited to see what comes next."
      ]
    },
    "15": {
      title: "Crypto News: EIGEN Token Analysis",
      event: "News Article",
      date: "12 May, 2024 - 9:00 AM",
      speaker: "Crypto News",
      transcript: [
        {
          time: "00:00:20",
          speaker: "Crypto News",
          content: "The EIGEN token launch has been one of the most anticipated events in the crypto space this year. With EigenLayer's innovative restaking model, the token represents a new approach to blockchain security and capital efficiency."
        }
      ],
      keywordHits: [
        "The EIGEN token launch has been one of the most anticipated events in the crypto space this year.",
        "With EigenLayer's innovative restaking model, the token represents a new approach to blockchain security and capital efficiency."
      ]
    },
    "16": {
      title: "Twitter Space: Restaking Discussion",
      event: "Twitter Space",
      date: "10 May, 2024 - 5:00 PM",
      speaker: "Various Speakers",
      transcript: [
        {
          time: "00:00:25",
          speaker: "Speaker 1",
          content: "Restaking is fundamentally changing how we think about blockchain security. The ability to reuse stake across multiple protocols is a game-changer for the entire ecosystem."
        }
      ],
      keywordHits: [
        "Restaking is fundamentally changing how we think about blockchain security.",
        "The ability to reuse stake across multiple protocols is a game-changer for the entire ecosystem."
      ]
    },
    "17": {
      title: "Podcast: The Future of Staking",
      event: "Podcast Episode",
      date: "8 May, 2024 - 3:00 PM",
      speaker: "Galaxy Digital",
      transcript: [
        {
          time: "00:00:30",
          speaker: "Galaxy Digital",
          content: "In this episode, we explore the future of staking and how innovations like EigenLayer are reshaping the landscape. We discuss the implications for validators, users, and the broader ecosystem."
        }
      ],
      keywordHits: [
        "In this episode, we explore the future of staking and how innovations like EigenLayer are reshaping the landscape.",
        "We discuss the implications for validators, users, and the broader ecosystem."
      ]
    },
    "18": {
      title: "Governance Proposal: EIGEN Parameters",
      event: "Governance Vote",
      date: "5 May, 2024 - 12:00 PM",
      speaker: "EigenLayer Foundation",
      transcript: [
        {
          time: "00:00:15",
          speaker: "EigenLayer Foundation",
          content: "This governance proposal outlines the initial parameters for the EIGEN token, including distribution mechanisms, staking rewards, and governance rights. Community input is crucial for finalizing these parameters."
        }
      ],
      keywordHits: [
        "This governance proposal outlines the initial parameters for the EIGEN token, including distribution mechanisms, staking rewards, and governance rights.",
        "Community input is crucial for finalizing these parameters."
      ]
    },
    "19": {
      title: "Vote: EIGEN Token Distribution",
      event: "Community Vote",
      date: "3 May, 2024 - 10:00 AM",
      speaker: "Community",
      transcript: [
        {
          time: "00:00:18",
          speaker: "Community",
          content: "The community is voting on the proposed EIGEN token distribution model. This vote will determine how tokens are allocated among different stakeholders and what the long-term tokenomics will look like."
        }
      ],
      keywordHits: [
        "The community is voting on the proposed EIGEN token distribution model.",
        "This vote will determine how tokens are allocated among different stakeholders and what the long-term tokenomics will look like."
      ]
    },
    "20": {
      title: "EigenLayer Mainnet Launch",
      event: "Conference",
      date: "1 May, 2024 - 11:00 AM",
      speaker: "EigenLayer Team",
      transcript: [
        {
          time: "00:00:35",
          speaker: "EigenLayer Team",
          content: "Today marks a historic moment as we launch EigenLayer on mainnet. This represents years of research and development, and we're excited to see how the community will use this new infrastructure to build the future of blockchain security."
        }
      ],
      keywordHits: [
        "Today marks a historic moment as we launch EigenLayer on mainnet.",
        "This represents years of research and development, and we're excited to see how the community will use this new infrastructure to build the future of blockchain security."
      ]
    }
  };

  if (!selectedItem || !mockContent[selectedItem as keyof typeof mockContent]) {
    return (
      <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded shadow-lg h-[700px] flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{currentProject.icon}</span>
              <h1 className="text-xl font-semibold text-white">{currentProject.name} ({currentProject.id})</h1>
            </div>
            <button className="flex items-center space-x-2 px-3 py-2 bg-purple-500/20 border border-purple-400/30 rounded hover:bg-purple-500/30 transition-colors cursor-pointer">
              <FiZap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">TL;DR</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {/* Token Mindshare Graph */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{currentProject.name} mindshare</h3>
              <select className="px-3 py-1 bg-[rgba(24,26,32,0.5)] border border-[#23272b] rounded text-sm text-gray-300 cursor-pointer">
                <option>Last 12m</option>
                <option>Last 6m</option>
                <option>Last 3m</option>
                <option>Last 1m</option>
              </select>
            </div>
            
            {/* Mock Graph Area */}
            <div className="h-64 bg-[rgba(24,26,32,0.5)] border border-[#23272b] rounded-lg p-4 relative">
              <div className="h-full flex items-end justify-between space-x-1">
                {/* Mock data bars */}
                {[20, 35, 45, 30, 55, 40, 60, 45, 50, 35, 40, 25].map((height, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-6 bg-purple-500 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-400 mt-2">
                      {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', '2024', 'Feb', 'Mar', 'Apr', 'May'][index]}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Y-axis labels - positioned within the graph container */}
              <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-400">
                <span>5%</span>
                <span>4%</span>
                <span>3%</span>
                <span>2%</span>
                <span>1%</span>
                <span>0%</span>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[rgba(24,26,32,0.5)] border border-[#23272b] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Mentions</div>
              <div className="text-2xl font-semibold text-white">
                {currentProject.id === 'EIGEN' ? '47,938' : 
                 currentProject.id === 'BTC' ? '125,420' :
                 currentProject.id === 'ETH' ? '89,234' :
                 currentProject.id === 'SOL' ? '34,567' :
                 currentProject.id === 'AVAX' ? '12,890' :
                 currentProject.id === 'MATIC' ? '23,456' : '47,938'}
              </div>
            </div>
            <div className="bg-[rgba(24,26,32,0.5)] border border-[#23272b] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Sentiment Score</div>
              <div className="text-2xl font-semibold text-green-400">
                {currentProject.id === 'EIGEN' ? '+0.72' : 
                 currentProject.id === 'BTC' ? '+0.85' :
                 currentProject.id === 'ETH' ? '+0.68' :
                 currentProject.id === 'SOL' ? '+0.91' :
                 currentProject.id === 'AVAX' ? '+0.45' :
                 currentProject.id === 'MATIC' ? '+0.63' : '+0.72'}
              </div>
            </div>
            <div className="bg-[rgba(24,26,32,0.5)] border border-[#23272b] rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Growth Rate</div>
              <div className="text-2xl font-semibold text-purple-400">
                {currentProject.id === 'EIGEN' ? '+15.3%' : 
                 currentProject.id === 'BTC' ? '+8.2%' :
                 currentProject.id === 'ETH' ? '+12.7%' :
                 currentProject.id === 'SOL' ? '+22.1%' :
                 currentProject.id === 'AVAX' ? '+5.4%' :
                 currentProject.id === 'MATIC' ? '+9.8%' : '+15.3%'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = mockContent[selectedItem as keyof typeof mockContent];

  return (
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded shadow-lg h-[700px] flex flex-col">
        {/* Fixed Header */}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Two Panel Layout */}
          <div className="flex h-full">
          {/* Left Panel - Keyword Hits */}
          <div className="w-1/3 flex flex-col">
            <div className="p-4 flex items-center justify-between">
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
          <div className="flex-1 flex flex-col">
            <div className="p-4">
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

          </div>
        </div>
      </div>
  );
}