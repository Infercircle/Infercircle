"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ProjectData {
  slug: string;
  name: string;
  image: string;
  amountRaised: number | null;
  raiseType: string | null;
  rewards: string | null;
  status: string;
  type: string | null;
  countdown: {
    endDate: string | null;
    startDate: string | null;
  } | null;
  platforms: string[];
  backers: Array<{
    name: string;
    slug: string;
    tier: number | null;
    type: string;
    image: string;
    round: string;
    category: string;
  }>;
}

interface PlatformImages {
  projects: Record<string, string>;
  backers: Record<string, string>;
  platforms: Record<string, string>;
}

const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "px-3 py-1 rounded bg-green-500/20 text-green-300 text-sm";
    case "ended":
      return "px-3 py-1 rounded bg-zinc-500/20 text-zinc-300 text-sm";
    default:
      return "px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-sm";
  }
};

const getTypeBadgeClass = (type: string | null) => {
  if (!type) return "px-3 py-1 rounded bg-gray-500/20 text-gray-300 text-sm";
  
  switch (type) {
    case "Pre-TGE":
      return "px-3 py-1 rounded bg-blue-500/20 text-blue-300 text-sm";
    case "Post-TGE":
      return "px-3 py-1 rounded bg-purple-500/20 text-purple-300 text-sm";
    case "Community Build Opportunities":
      return "px-3 py-1 rounded bg-orange-500/20 text-orange-300 text-sm";
    case "Campaign":
      return "px-3 py-1 rounded bg-pink-500/20 text-pink-300 text-sm";
    default:
      return "px-3 py-1 rounded bg-gray-500/20 text-gray-300 text-sm";
  }
};

const formatAmount = (amount: number | null) => {
  if (!amount) return "N/A";
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const getTimeRemaining = (endDate: string | null) => {
  if (!endDate) return null;
  
  try {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  } catch {
    return null;
  }
};

export default function TgeProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.slug as string;
  
  const [project, setProject] = React.useState<ProjectData | null>(null);
  const [platformImages, setPlatformImages] = React.useState<PlatformImages>({
    projects: {},
    backers: {},
    platforms: {}
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError(null);

        const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
        const apiKey = process.env.TGE_API_KEY || 'ak_pro_Jpo05NPhS_VEMIDrAOr-ayWHrsg5q3CO';
        
        const [projectsResponse, imagesResponse] = await Promise.all([
          fetch(`${helperApiUrl}/v1/projects`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          }),
          fetch(`${helperApiUrl}/v1/platform-images`)
        ]);

        if (!projectsResponse.ok || !imagesResponse.ok) {
          throw new Error(`API request failed: ${projectsResponse.status} / ${imagesResponse.status}`);
        }

        const projectsData = await projectsResponse.json();
        const imagesData = await imagesResponse.json();

        if (projectsData.error || imagesData.error) {
          throw new Error(projectsData.message || imagesData.message || 'API returned error');
        }

        // Find the project by slug
        const foundProject = projectsData.data?.find((p: any) => p.slug === projectSlug);
        
        if (!foundProject) {
          setError("Project not found");
          return;
        }

        setProject(foundProject);
        
        // Set up platform images
        const platformImages: PlatformImages = {
          projects: {},
          backers: {},
          platforms: imagesData.data || {}
        };
        
        // Extract project and backer images
        if (foundProject.image) {
          platformImages.projects[foundProject.name] = foundProject.image;
        }
        
        foundProject.backers?.forEach((backer: any) => {
          if (backer.image) {
            platformImages.backers[backer.name] = backer.image;
          }
        });
        
        setPlatformImages(platformImages);

      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch project data');
      } finally {
        setLoading(false);
      }
    };

    if (projectSlug) {
      fetchProjectData();
    }
  }, [projectSlug]);

  const getProjectImage = (name: string) => {
    const imageUrl = platformImages.projects[name] || "";
    if (!imageUrl) return null;
    return (
      <img 
        src={imageUrl} 
        alt={name}
        className="w-15 h-15 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  };

  const getBackerImage = (name: string) => {
    const imageUrl = platformImages.backers[name] || "";
    if (!imageUrl) return null;
    return (
      <img 
        src={imageUrl} 
        alt={name}
        className="w-5 h-5 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  };

  const getPlatformImage = (name: string) => {
    const platformKey = name.toLowerCase();
    const imageUrl = platformImages.platforms[platformKey] || "";
    if (!imageUrl) return null;
    return (
      <img 
        src={imageUrl} 
        alt={name}
        className="w-5 h-5 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="mb-8">
              <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-15 h-15 bg-gray-700 rounded-full"></div>
                <div>
                  <div className="h-8 w-48 bg-gray-700 rounded mb-2"></div>
                  <div className="h-6 w-24 bg-gray-700 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-700 rounded"></div>
              </div>
              <div className="h-6 w-full bg-gray-700 rounded"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
                    <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j}>
                          <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                          <div className="h-6 w-20 bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
                    <div className="h-6 w-32 bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex justify-between">
                          <div className="h-4 w-20 bg-gray-700 rounded"></div>
                          <div className="h-4 w-16 bg-gray-700 rounded"></div>
                        </div>
                      ))}
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

  if (error || !project) {
    return (
      <div className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-white mb-4">Project Not Found</h1>
            <p className="text-[#A3A3A3] mb-8">
              {error || "The project you're looking for doesn't exist."}
            </p>
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

  const timeRemaining = getTimeRemaining(project.countdown?.endDate || null);

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard/tge"
              className="text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to TGE Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4 mb-4">
            {getProjectImage(project.name)}
            <div>
              <h1 className="text-4xl font-bold text-white">{project.name}</h1>
              <p className="text-2xl text-[#A3A3A3]">{project.slug.toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
              <span className={getStatusBadgeClass(project.status)}>
                {project.status}
              </span>
              {project.type && (
                <span className={getTypeBadgeClass(project.type)}>
                  {project.type}
                </span>
              )}
            </div>
          </div>
          {project.rewards && (
            <div className="mb-4">
              <p className="text-lg text-[#ffffffcc]">
                <span className="text-purple-300 font-semibold">Rewards:</span> {project.rewards}
              </p>
            </div>
          )}
          {timeRemaining && (
            <div className="mb-4">
              <p className="text-lg text-[#ffffffcc]">
                <span className="text-orange-300 font-semibold">Time Remaining:</span> {timeRemaining}
              </p>
            </div>
          )}
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
                  <p className="text-2xl font-bold text-white">{formatAmount(project.amountRaised)}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Raise Type</p>
                  <p className="text-2xl font-bold text-white">{project.raiseType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Status</p>
                  <p className="text-2xl font-bold text-white">{project.status}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Type</p>
                  <p className="text-2xl font-bold text-white">{project.type || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Backers */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Backers ({project.backers.length})</h2>
              <div className="space-y-4">
                {/* Group backers by tier */}
                {(() => {
                  const tierGroups: { [key: string]: any[] } = {};
                  const angelInvestors: any[] = [];
                  
                  project.backers.forEach((backer) => {
                    if (backer.tier) {
                      const tierKey = `Tier ${backer.tier}`;
                      if (!tierGroups[tierKey]) {
                        tierGroups[tierKey] = [];
                      }
                      tierGroups[tierKey].push(backer);
                    } else {
                      angelInvestors.push(backer);
                    }
                  });
                  
                  return (
                    <div className="space-y-4">
                      {Object.keys(tierGroups).sort().map(tier => (
                        <div key={tier}>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">{tier}</h4>
                          <div className="flex flex-wrap gap-2">
                            {tierGroups[tier].map((backer, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgba(71,79,92,0.35)] text-sm">
                                {getBackerImage(backer.name)}
                                <span>{backer.name}</span>
                                <span className="text-xs text-gray-400">{backer.type}</span>
                                {backer.round && <span className="text-xs text-gray-400">({backer.round})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {angelInvestors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Angel</h4>
                          <div className="flex flex-wrap gap-2">
                            {angelInvestors.map((backer, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgba(71,79,92,0.35)] text-sm">
                                {getBackerImage(backer.name)}
                                <span>{backer.name}</span>
                                <span className="text-xs text-gray-400">{backer.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* InfoFi Platforms */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">InfoFi Platforms ({project.platforms.length})</h2>
              <div className="flex flex-wrap gap-3">
                {project.platforms.map((platform) => (
                  <span key={platform} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgba(42,46,53,0.35)] text-sm">
                    {getPlatformImage(platform)}
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
                  <p className="text-[#A3A3A3] text-sm">Slug</p>
                  <p className="text-white font-medium">{project.slug}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Status</p>
                  <p className="text-white font-medium">{project.status}</p>
                </div>
                {project.type && (
                  <div>
                    <p className="text-[#A3A3A3] text-sm">Type</p>
                    <p className="text-white font-medium">{project.type}</p>
                  </div>
                )}
                {project.countdown?.endDate && (
                  <div>
                    <p className="text-[#A3A3A3] text-sm">End Date</p>
                    <p className="text-white font-medium">{formatDate(project.countdown.endDate)}</p>
                  </div>
                )}
                {project.countdown?.startDate && (
                  <div>
                    <p className="text-[#A3A3A3] text-sm">Start Date</p>
                    <p className="text-white font-medium">{formatDate(project.countdown.startDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown Timer */}
            {project.countdown?.endDate && (
              <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
                <h2 className="text-xl font-bold text-white mb-4">Countdown</h2>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-300 mb-2">
                    {timeRemaining || "Ended"}
                  </div>
                  <p className="text-[#A3A3A3] text-sm">
                    {project.countdown.endDate ? formatDate(project.countdown.endDate) : "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Rewards */}
            {project.rewards && (
              <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
                <h2 className="text-xl font-bold text-white mb-4">Rewards</h2>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300">
                    {project.rewards}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] text-sm">Total Backers</span>
                  <span className="text-white font-medium">{project.backers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] text-sm">Platforms</span>
                  <span className="text-white font-medium">{project.platforms.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] text-sm">Amount Raised</span>
                  <span className="text-white font-medium">{formatAmount(project.amountRaised)}</span>
                </div>
                {project.raiseType && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#A3A3A3] text-sm">Raise Type</span>
                    <span className="text-white font-medium">{project.raiseType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
