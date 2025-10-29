"use client";

import React from "react";
import Link from "next/link";

interface ProjectData {
  name: string;
  backers: any[];
  infoPlatforms: string[];
  amountRaised: string;
  reward: string;
  type: string;
  status: string;
  image?: string;
}

interface Metadata {
  success: boolean;
  project_name: string;
  project_id: string;
  links: Array<{
    type: string;
    value: string;
  }>;
  description: string;
  shortDescription: string;
  extraction_time: string;
  error: string | null;
}

interface TeamData {
  success: boolean;
  project_id: string;
  project_name: string;
  team: Array<{
    name: string;
    role: string;
    image: string;
    twitter?: string;
    linkedin?: string;
  }>;
  extraction_time: string;
  error: string | null;
}

interface PlatformImages {
  projects: Record<string, string>;
  backers: Record<string, string>;
  platforms: Record<string, string>;
}

interface TgeSlugPageClientProps {
  projectData: ProjectData | null;
  metadata: Metadata | null;
  teamData: TeamData | null;
  platformImages: PlatformImages;
  slug: string;
}

export default function TgeSlugPageClient({
  projectData,
  metadata,
  teamData,
  platformImages,
  slug
}: TgeSlugPageClientProps) {
  
  if (!projectData) {
    return (
      <div className="text-white min-h-screen">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="mb-6">
            <Link 
              href="/dashboard/tge"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Campaigns
            </Link>
          </div>
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-white mb-4">Project Not Found</h1>
            <p className="text-gray-400">The project "{slug}" could not be found in our database.</p>
          </div>
        </div>
      </div>
    );
  }

  const projectLogo = projectData.image || "";
  
  const socialLinks = metadata?.links || [];
  const twitterLink = socialLinks.find(link => link.type === 'twitter');
  const webLink = socialLinks.find(link => link.type === 'web');
  const gitbookLink = socialLinks.find(link => link.type === 'gitbook');
  const githubLink = socialLinks.find(link => link.type === 'github');
  const discordLink = socialLinks.find(link => link.type === 'discord');

  const description = metadata?.description || "No description available for this project.";
  
  const raiseTypes = (() => {
    const rounds = (projectData?.backers || [])
      .map((b: any) => (b?.round || '').trim())
      .filter((v: string) => v);
    return Array.from(new Set(rounds)).join(', ');
  })();

  const parseDescription = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const isLead = (backer: any) => {
    if (!backer) return false;
    
    if (backer.lead === true || backer.isLead === true) return true;
    
    const role = (backer.role || '').toLowerCase();
    if (role.includes('lead') || role.includes('leading')) return true;
    
    const type = (backer.type || '').toLowerCase();
    if (type.includes('lead')) return true;
    
    const name = (backer.name || '').toLowerCase();
    if (name.includes('(lead)') || name.includes('[lead]')) return true;
    
    const round = (backer.round || '').toLowerCase();
    if (round.includes('lead')) return true;
    
    const category = (backer.category || '').toLowerCase();
    if (category.includes('lead')) return true;
    
    return false;
  };

  return (
    <div className="text-white min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="mb-6">
          <Link 
            href="/dashboard/tge"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Campaigns
          </Link>
        </div>

        {/* Fixed layout proportions to reduce whitespace */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main content - increased from 8 to 9 columns */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                {projectLogo ? (
                  <img 
                    src={projectLogo} 
                    alt={projectData.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {projectData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-1">
                  {projectData.name}
                </h1>
                <div className="text-2xl font-medium text-gray-400 mb-4">
                  {slug.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap -mt-8">
              {parseDescription(description)}
            </div>

            {teamData && teamData.team && teamData.team.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">{projectData.name} Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamData.team.map((member, index) => (
                    <div key={index} className="border border-[#2a2e35] rounded-lg p-4 shadow-lg">
                      <div className="flex items-start gap-3">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/icons/logo.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium">{member.name}</div>
                          <div className="text-sm text-gray-400">{member.role}</div>
                          <div className="flex gap-2 mt-1">
                            {member.twitter && (
                              <a 
                                href={member.twitter} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                              </a>
                            )}
                            {member.linkedin && (
                              <a 
                                href={member.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-white mb-4">{projectData.name} Backers</h2>
              <div className="mb-4">
                <div className="text-base font-semibold text-white flex items-center gap-2 flex-wrap">
                  <span>Raised {projectData.amountRaised ? `${projectData.amountRaised}` : 'N/A'}</span>
                  {raiseTypes && (
                    <span className="text-sm font-normal text-gray-400">/ {raiseTypes}</span>
                  )}
                </div>
              </div>
              {projectData.backers && projectData.backers.length > 0 ? (
                <div className="space-y-5">
                  {(() => {
                    const tiers: Record<string, any[]> = {};
                    const angels: any[] = [];
                    const others: any[] = [];
                    
                    projectData.backers.forEach((backer: any) => {
                      if (backer.tier || backer.tierNum) {
                        const tierVal = backer.tier ?? backer.tierNum;
                        const tierKey = `Tier ${tierVal}`;
                        tiers[tierKey] = tiers[tierKey] || [];
                        tiers[tierKey].push(backer);
                      } else if (backer.type && backer.type.toLowerCase().includes('angel')) {
                        angels.push(backer);
                      } else {
                        others.push(backer);
                      }
                    });

                    return (
                      <>
                        {Object.keys(tiers).sort().map(tier => (
                          <div key={tier}>
                            <h3 className="text-sm font-medium text-gray-400 mb-3">{tier}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              {tiers[tier].map((backer: any, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                  <img 
                                    src={backer.image || '/icons/logo.png'} 
                                    alt={backer.name}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/icons/logo.png';
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium truncate">{backer.name}</div>
                                    {isLead(backer) && (
                                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        Lead
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        
                        {angels.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Angel</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              {angels.map((backer: any, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                  <img 
                                    src={backer.image || '/icons/logo.png'} 
                                    alt={backer.name}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/icons/logo.png';
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium truncate">{backer.name}</div>
                                    {isLead(backer) && (
                                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        Lead
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {others.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Others</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              {others.map((backer: any, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                  <img 
                                    src={backer.image || '/icons/logo.png'} 
                                    alt={backer.name}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/icons/logo.png';
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium truncate">{backer.name}</div>
                                    {isLead(backer) && (
                                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        Lead
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No backer information available</div>
              )}
            </div>
          </div>

          {/* Sidebar - decreased from 4 to 3 columns */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="p-4 shadow-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Campaign Type and Status</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1.5 text-sm rounded ${
                  projectData.type === 'Pre-TGE' ? 'bg-blue-500/20 text-blue-300' :
                  projectData.type === 'Post-TGE' ? 'bg-purple-500/20 text-purple-300' :
                  projectData.type === 'Community Build Opportunities' ? 'bg-orange-500/20 text-orange-300' :
                  projectData.type === 'Campaign' ? 'bg-pink-500/20 text-pink-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {projectData.type === 'Community Build Opportunities' ? 'Build' : projectData.type}
                </span>
                <span className={`px-2.5 py-1.5 text-sm rounded ${
                  projectData.status === 'ended' 
                    ? 'bg-zinc-500/20 text-zinc-300' 
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  {projectData.status === 'ended' ? 'Ended' : 'Active'}
                </span>
              </div>
            </div>

            <div className="p-4 shadow-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Campaign Rewards</h3>
              <div className="text-white text-sm">{projectData.reward || 'No rewards specified'}</div>
            </div>

            <div className="p-4 shadow-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Campaign Platforms</h3>
              {projectData.infoPlatforms && projectData.infoPlatforms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {projectData.infoPlatforms.map((platform: string, index: number) => (
                    <div key={index} className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-[rgba(42,46,53,0.35)]">
                      <img 
                        src={platformImages.platforms[platform.toLowerCase()] || platformImages.platforms[platform] || '/icons/logo.png'} 
                        alt={platform} 
                        className="w-4 h-4 rounded-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-white">{platform}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No platforms specified</div>
              )}
            </div>

            <div className="p-4 shadow-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Resources</h3>
              <div className="flex flex-wrap gap-2">
                {webLink && (
                  <a 
                    href={webLink.value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors rounded bg-[rgba(42,46,53,0.35)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Website</span>
                  </a>
                )}
                {gitbookLink && (
                  <a 
                    href={gitbookLink.value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors rounded bg-[rgba(42,46,53,0.35)]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>Docs</span>
                  </a>
                )}
                {!webLink && !gitbookLink && (
                  <div className="text-gray-400 text-sm">No resources available</div>
                )}
              </div>
            </div>

            <div className="p-4 shadow-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Community</h3>
              <div className="flex flex-wrap gap-2">
                {twitterLink && (
                  <a 
                    href={twitterLink.value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors rounded bg-[rgba(42,46,53,0.35)]"
                  >
                    <div className="w-4 h-4 bg-white rounded flex items-center justify-center">
                      <span className="text-black font-bold text-xs">X</span>
                    </div>
                    <span>Twitter</span>
                  </a>
                )}
                {discordLink && (
                  <a 
                    href={discordLink.value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors rounded bg-[rgba(42,46,53,0.35)]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span>Discord</span>
                  </a>
                )}
                {githubLink && (
                  <a 
                    href={githubLink.value} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors rounded bg-[rgba(42,46,53,0.35)]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>GitHub</span>
                  </a>
                )}
                {!twitterLink && !discordLink && !githubLink && (
                  <div className="text-gray-400 text-sm">No community links available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
