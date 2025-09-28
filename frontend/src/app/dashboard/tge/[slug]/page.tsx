"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Mock detailed data for projects
const PROJECT_DETAILS = {
  "project-atlas": {
    id: "project-atlas",
    name: "Project Atlas",
    symbol: "ATLAS",
    description: "A revolutionary blockchain infrastructure project focused on decentralized data storage and computation.",
    status: "tokensLive",
    amountRaised: "$40M",
    backers: ["a16z", "Paradigm", "Dragonfly", "Sequoia", "Hashed"],
    infoPlatforms: ["Kaito", "Cookie3", "Wallchain", "Breadcrumb", "Alphabot", "Lurky"],
    tokenPrice: "$2.45",
    marketCap: "$245M",
    totalSupply: "100M",
    circulatingSupply: "50M",
    launchDate: "2024-01-15",
    website: "https://projectatlas.io",
    whitepaper: "https://projectatlas.io/whitepaper",
    socials: {
      twitter: "https://twitter.com/projectatlas",
      telegram: "https://t.me/projectatlas",
      discord: "https://discord.gg/projectatlas"
    },
    category: "Infrastructure",
    blockchain: "Ethereum",
    vestingSchedule: "6 months cliff, 24 months linear",
    tokenomics: {
      "Public Sale": "20%",
      "Team": "15%",
      "Advisors": "5%",
      "Treasury": "25%",
      "Community": "35%"
    }
  },
  "neon-forge": {
    id: "neon-forge",
    name: "Neon Forge",
    symbol: "NEON",
    description: "Next-generation gaming infrastructure with AI-powered asset creation and cross-chain interoperability.",
    status: "active",
    amountRaised: "$12.5M",
    backers: ["Sequoia", "Hashed", "Delphi", "Shima Capital"],
    infoPlatforms: ["Breadcrumb", "Alphabot", "Kaito", "Lurky"],
    tokenPrice: "$0.85",
    marketCap: "$85M",
    totalSupply: "1B",
    circulatingSupply: "100M",
    launchDate: "2024-03-20",
    website: "https://neonforge.com",
    whitepaper: "https://neonforge.com/whitepaper",
    socials: {
      twitter: "https://twitter.com/neonforge",
      telegram: "https://t.me/neonforge",
      discord: "https://discord.gg/neonforge"
    },
    category: "Gaming",
    blockchain: "Polygon",
    vestingSchedule: "3 months cliff, 18 months linear",
    tokenomics: {
      "Public Sale": "25%",
      "Team": "20%",
      "Advisors": "3%",
      "Treasury": "20%",
      "Community": "32%"
    }
  },
  "orbit-labs": {
    id: "orbit-labs",
    name: "Orbit Labs",
    symbol: "ORBIT",
    description: "Decentralized satellite network providing global internet coverage and data transmission services.",
    status: "potentialAirdrops",
    amountRaised: "$3.2M",
    backers: ["Dragonfly", "a16z", "Paradigm", "Binance Labs"],
    infoPlatforms: ["Lurky", "Wallchain", "Kaito", "Cookie3"],
    tokenPrice: "TBA",
    marketCap: "TBA",
    totalSupply: "500M",
    circulatingSupply: "TBA",
    launchDate: "2024-Q2",
    website: "https://orbitlabs.space",
    whitepaper: "https://orbitlabs.space/whitepaper",
    socials: {
      twitter: "https://twitter.com/orbitlabs",
      telegram: "https://t.me/orbitlabs",
      discord: "https://discord.gg/orbitlabs"
    },
    category: "Infrastructure",
    blockchain: "Solana",
    vestingSchedule: "12 months cliff, 36 months linear",
    tokenomics: {
      "Public Sale": "15%",
      "Team": "25%",
      "Advisors": "8%",
      "Treasury": "30%",
      "Community": "22%"
    }
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "tokensLive":
      return "px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 text-sm";
    case "active":
      return "px-3 py-1 rounded bg-blue-500/20 text-blue-300 text-sm";
    case "past":
      return "px-3 py-1 rounded bg-zinc-500/20 text-zinc-300 text-sm";
    default:
      return "px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-sm";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "tokensLive":
      return "Tokens Live";
    case "active":
      return "Active";
    case "past":
      return "Past";
    default:
      return "Potential Airdrops";
  }
};

export default function TgeProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;
  
  const project = PROJECT_DETAILS[projectSlug as keyof typeof PROJECT_DETAILS];

  if (!project) {
    return (
      <div className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-white mb-4">Project Not Found</h1>
            <p className="text-[#A3A3A3] mb-8">The project you're looking for doesn't exist.</p>
            <Link 
              href="/dashboard/tge"
              className="px-6 py-3 bg-purple-500/60 text-white rounded-lg hover:bg-purple-500/80 transition-colors"
            >
              Back to TGE Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard/tge"
              className="text-purple-300 hover:text-purple-200 transition-colors"
            >
              ← Back to TGE Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={`https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=60&h=60&fit=crop&crop=center`}
              alt={project.name}
              className="w-15 h-15 rounded-full object-cover"
            />
            <div>
              <h1 className="text-4xl font-bold text-white">{project.name}</h1>
              <p className="text-2xl text-[#A3A3A3]">{project.symbol}</p>
            </div>
            <span className={getStatusBadgeClass(project.status)}>
              {getStatusLabel(project.status)}
            </span>
          </div>
          <p className="text-lg text-[#ffffffcc] max-w-4xl">{project.description}</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Key Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Metrics */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Financial Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#A3A3A3] text-sm">Amount Raised</p>
                  <p className="text-2xl font-bold text-white">{project.amountRaised}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Token Price</p>
                  <p className="text-2xl font-bold text-white">{project.tokenPrice}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Market Cap</p>
                  <p className="text-2xl font-bold text-white">{project.marketCap}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Total Supply</p>
                  <p className="text-2xl font-bold text-white">{project.totalSupply}</p>
                </div>
              </div>
            </div>

            {/* Backers */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Backers</h2>
              <div className="flex flex-wrap gap-3">
                {project.backers.map((backer) => (
                  <span key={backer} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgba(71,79,92,0.35)] text-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center"
                      alt={backer}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    {backer}
                  </span>
                ))}
              </div>
            </div>

            {/* InfoFi Platforms */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">InfoFi Platforms</h2>
              <div className="flex flex-wrap gap-3">
                {project.infoPlatforms.map((platform) => (
                  <span key={platform} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgba(42,46,53,0.35)] text-sm">
                    <img 
                      src="https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=20&h=20&fit=crop&crop=center"
                      alt={platform}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Project Info */}
          <div className="space-y-6">
            {/* Project Details */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Project Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[#A3A3A3] text-sm">Category</p>
                  <p className="text-white font-medium">{project.category}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Blockchain</p>
                  <p className="text-white font-medium">{project.blockchain}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Launch Date</p>
                  <p className="text-white font-medium">{project.launchDate}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Vesting Schedule</p>
                  <p className="text-white font-medium">{project.vestingSchedule}</p>
                </div>
              </div>
            </div>

            {/* Tokenomics */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Tokenomics</h2>
              <div className="space-y-3">
                {Object.entries(project.tokenomics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-[#A3A3A3] text-sm">{key}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Links</h2>
              <div className="space-y-3">
                <a 
                  href={project.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Website
                </a>
                <a 
                  href={project.whitepaper} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Whitepaper
                </a>
                <a 
                  href={project.socials.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Twitter
                </a>
                <a 
                  href={project.socials.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Telegram
                </a>
                <a 
                  href={project.socials.discord} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
