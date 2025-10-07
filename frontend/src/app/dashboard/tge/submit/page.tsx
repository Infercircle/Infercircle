"use client";

import React from "react";
import Link from "next/link";

interface ProjectFormData {
  name: string;
  slug: string;
  image: string;
  amount_raised: number | null;
  raise_type: string;
  rewards: string;
  status: string;
  type: string;
  platforms: string[];
  backers: Array<{
    name: string;
    image: string;
    round: string;
    type: string;
    slug: string;
    category: string;
    tier: number | null;
  }>;
  countdown: {
    endDate: string | null;
    startDate: string | null;
  } | null;
}

interface CryptoRankProject {
  id: string;
  name: string;
  symbol: string | null;
  icon: string;
  key: string;
  category: string;
}

interface CryptoRankBacker {
  name: string;
  logo: string;
  type: string;
  round: string;
  tier?: number;
}


const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Ended", label: "Ended" }
];

const TYPE_OPTIONS = [
  { value: "Pre-TGE", label: "Pre-TGE" },
  { value: "Post-TGE", label: "Post-TGE" },
  { value: "Community Build Opportunities", label: "Community Build Opportunities" },
  { value: "Campaign", label: "Campaign" }
];

const PLATFORM_OPTIONS = [
  "Kaito", "Breadcrumb", "Wallchain", "Pulse", "Trendsage", "Mindoshare", "Lurky", "Airaa", "Cookie"
];

const BACKER_CATEGORIES = [
  "Venture", "Angel Investor", "Corporation", "DAO", "Foundation"
];

const BACKER_TYPES = [
  "LEAD", "NORMAL"
];

const BACKER_ROUNDS = [
  "SEED", "SERIES A", "SERIES B", "SERIES C", "Private Token Sale", "Public Sale", "Strategic", "Undisclosed"
];

export default function SubmitProjectPage() {
  const [formData, setFormData] = React.useState<ProjectFormData>({
    name: "",
    slug: "",
    image: "",
    amount_raised: null,
    raise_type: "",
    rewards: "",
    status: "Active",
    type: "Campaign",
    platforms: [],
    backers: [],
    countdown: null
  });
  
  const [activeTab, setActiveTab] = React.useState<'form' | 'preview' | 'delete'>('form');
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [deleteSlug, setDeleteSlug] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [cryptoRankProjects, setCryptoRankProjects] = React.useState<CryptoRankProject[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<CryptoRankProject | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = React.useState(false);
  const [isProjectInputFocused, setIsProjectInputFocused] = React.useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = React.useState("");
  const [filteredProjects, setFilteredProjects] = React.useState<CryptoRankProject[]>([]);
  const [isLoadingBackers, setIsLoadingBackers] = React.useState(false);
  
  const allProjectsCache = React.useRef<CryptoRankProject[] | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [newBacker, setNewBacker] = React.useState<{
    name: string;
    image: string;
    round: string;
    type: string;
    slug: string;
    category: string;
    tier: number | null;
  }>({
    name: "",
    image: "",
    round: "SEED",
    type: "NORMAL",
    slug: "",
    category: "Venture",
    tier: null
  });

  // Fetch all projects from backend
  const fetchAllProjects = async () => {
    if (allProjectsCache.current) {
      return allProjectsCache.current;
    }

    setIsLoadingProjects(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const response = await fetch(`${backendUrl}/projects/all`);
      const data = await response.json();
      if (data.status === 'success') {
        allProjectsCache.current = data.data;
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching all projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
    return [];
  };

  // Filter projects locally
  const filterProjects = (query: string, allProjects: CryptoRankProject[]): CryptoRankProject[] => {
    if (!query.trim()) {
      return allProjects.slice(0, 8); // top 8 by default
    }
    const searchTerm = query.toLowerCase();
    return allProjects
      .filter(project =>
        project.name?.toLowerCase().includes(searchTerm) ||
        project.symbol?.toLowerCase().includes(searchTerm) ||
        project.key?.toLowerCase().includes(searchTerm) ||
        project.name?.startsWith(searchTerm) ||
        project.symbol?.startsWith(searchTerm)
      )
      .slice(0, 30);
  };

  // Load projects on component mount
  React.useEffect(() => {
    const loadProjects = async () => {
      const allProjects = await fetchAllProjects();
      if (allProjects.length > 0) {
        setCryptoRankProjects(allProjects.slice(0, 8)); // default dropdown
      }
    };

    loadProjects();
  }, []);

  // Debounced search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (projectSearchQuery.trim()) {
        const allProjects = await fetchAllProjects();
        const filtered = filterProjects(projectSearchQuery, allProjects);
        setFilteredProjects(filtered);
        setShowProjectDropdown(true);
      } else {
        setFilteredProjects([]);
        setShowProjectDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [projectSearchQuery]);

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
        setIsProjectInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProjectSelect = (project: CryptoRankProject) => {
    setSelectedProject(project);
    setFormData(prev => ({
      ...prev,
      name: project.name,
      slug: project.key || generateSlug(project.name),
      image: project.icon || ""
    }));
    setShowProjectDropdown(false);
    setIsProjectInputFocused(false);
    setProjectSearchQuery("");
    setFilteredProjects([]);
  };

  const handleProjectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProjectSearchQuery(value);
    if (value.trim()) {
      setShowProjectDropdown(true);
    } else {
      setShowProjectDropdown(false);
    }
  };

  const handleProjectInputFocus = () => {
    setIsProjectInputFocused(true);
    setShowProjectDropdown(true);
    if (cryptoRankProjects.length > 0) {
      setFilteredProjects(cryptoRankProjects);
    }
  };

  const handleGetBackers = async () => {
    if (!selectedProject) {
      setSubmitError("Please select a project first");
      return;
    }

    setIsLoadingBackers(true);
    setSubmitError(null);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const response = await fetch(`${backendUrl}/fundraising/funding-rounds/${selectedProject.key}`);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const backers = await loadProjectBackers(selectedProject.key);
      
      if (backers.length > 0) {
        // Extract raise amount and type from the latest round
        let latestRaiseAmount = null;
        let latestRaiseType = "";
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Find the round with the highest raise amount
          const roundsWithRaise = data.data.filter((round: any) => round.raise && round.raise > 0);
          if (roundsWithRaise.length > 0) {
            const latestRound = roundsWithRaise.reduce((latest: any, current: any) => 
              current.raise > latest.raise ? current : latest
            );
            latestRaiseAmount = latestRound.raise;
            latestRaiseType = latestRound.type || "";
          } else {
            // If no rounds have raise amounts, use the first round's type
            latestRaiseType = data.data[0].type || "";
          }
        }
        
        setFormData(prev => ({
          ...prev,
          backers: backers,
          amount_raised: latestRaiseAmount,
          raise_type: latestRaiseType
        }));
        
        alert(`Successfully loaded ${backers.length} backers, raise amount: ${latestRaiseAmount ? `$${latestRaiseAmount.toLocaleString()}` : 'N/A'}, raise type: ${latestRaiseType || 'N/A'}!`);
      } else {
        setSubmitError("No backers found for this project");
        alert("No backers found for this project");
      }
    } catch (error) {
      console.error('Error loading backers:', error);
      setSubmitError("Failed to load backers for this project");
    } finally {
      setIsLoadingBackers(false);
    }
  };

  const loadProjectBackers = async (coinKey: string): Promise<Array<{
    name: string;
    image: string;
    round: string;
    type: string;
    slug: string;
    category: string;
    tier: number | null;
  }>> => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const url = `${backendUrl}/fundraising/funding-rounds/${coinKey}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch backers: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data;
      const backers: Array<{
        name: string;
        image: string;
        round: string;
        type: string;
        slug: string;
        category: string;
        tier: number | null;
      }> = [];

      // Handle different response structures
      if (result.source === "primary" && data && Array.isArray(data)) {
        // Primary endpoint: funding-rounds/with-tiered-investors
        data.forEach((round: any) => {
          if (round.investors) {
            // Handle tiered structure
            const tiers = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'angel', 'other'];
            tiers.forEach(tierKey => {
              if (round.investors[tierKey] && Array.isArray(round.investors[tierKey])) {
                round.investors[tierKey].forEach((investor: any) => {
                  backers.push({
                    name: investor.name || 'Unknown',
                    image: investor.logo || "",
                    round: round.type || "Undisclosed",
                    type: investor.type || "NORMAL",
                    slug: investor.slug || "",
                    category: investor.category || "Venture",
                    tier: tierKey === 'angel' ? null : (investor.tier || parseInt(tierKey.replace('tier', '')))
                  });
                });
              }
            });
          }
        });
      } else if (result.source === "fallback" && data) {
        // Fallback endpoint: coins/{coinKey}/funds-and-backers
        if (data.funds && Array.isArray(data.funds)) {
          data.funds.forEach((fund: any) => {
            if (fund.investors && Array.isArray(fund.investors)) {
              fund.investors.forEach((investor: any) => {
                backers.push({
                  name: investor.name || 'Unknown',
                  image: investor.logo || "",
                  round: fund.round || "Undisclosed",
                  type: investor.type || "NORMAL",
                  slug: investor.slug || "",
                  category: investor.category || "Venture",
                  tier: investor.tier || null
                });
              });
            }
          });
        }
      }
      
      // Fallback: Try to process data regardless of source if no backers found
      if (backers.length === 0 && data && Array.isArray(data)) {
        data.forEach((round: any) => {
          if (round.investors) {
            const tiers = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'angel', 'other'];
            tiers.forEach(tierKey => {
              if (round.investors[tierKey] && Array.isArray(round.investors[tierKey])) {
                round.investors[tierKey].forEach((investor: any) => {
                  backers.push({
                    name: investor.name || 'Unknown',
                    image: investor.logo || "",
                    round: round.type || "Undisclosed",
                    type: investor.type || "NORMAL",
                    slug: investor.slug || "",
                    category: investor.category || "Venture",
                    tier: tierKey === 'angel' ? null : (investor.tier || parseInt(tierKey.replace('tier', '')))
                  });
                });
              }
            });
          }
        });
      }

      return backers;
    } catch (error) {
      console.error('Error loading project backers:', error);
      return [];
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const addBacker = () => {
    if (newBacker.name.trim()) {
      setFormData(prev => ({
        ...prev,
        backers: [...prev.backers, { ...newBacker }]
      }));
      setNewBacker({
        name: "",
        image: "",
        round: "SEED",
        type: "NORMAL",
        slug: "",
        category: "Venture",
        tier: null
      });
    }
  };

  const removeBacker = (index: number) => {
    setFormData(prev => ({
      ...prev,
      backers: prev.backers.filter((_, i) => i !== index)
    }));
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleDeleteProject = async () => {
    if (!deleteSlug.trim()) {
      setSubmitError("Please enter a project slug to delete");
      return;
    }

    if (password !== "teaminfer") {
      setSubmitError("Invalid admin password");
      return;
    }

    setIsDeleting(true);
    setSubmitError(null);

    try {
      const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
      
      const response = await fetch(`${helperApiUrl}/v1/projects/${deleteSlug}`, {
        method: 'DELETE',
        headers: {
          'X-ADMIN-KEY': 'teaminfer'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to delete project');
      }

      setSubmitSuccess(true);
      setDeleteSlug("");
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setShowPasswordModal(false);
    }
  };

  const handleSubmit = async () => {
    if (!password) {
      setSubmitError("Please enter the admin password");
      return;
    }

    if (password !== "teaminfer") {
      setSubmitError("Invalid admin password");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
      
      const projectPayload = {
        name: formData.name,
        image: formData.image,
        amount_raised: formData.amount_raised,
        rewards: formData.rewards,
        status: formData.status,
        type: formData.type,
        platforms: formData.platforms,
        backers: formData.backers,
        countdown: formData.countdown
      };

      const response = await fetch(`${helperApiUrl}/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-KEY': 'teaminfer'
        },
        body: JSON.stringify(projectPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to submit project');
      }

      const result = await response.json();
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        name: "",
        slug: "",
        image: "",
        amount_raised: null,
        raise_type: "",
        rewards: "",
        status: "Active",
        type: "Campaign",
        platforms: [],
        backers: [],
        countdown: null
      });

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit project');
    } finally {
      setIsSubmitting(false);
      setShowPasswordModal(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "px-3 py-1 rounded bg-green-500/20 text-green-300 text-sm";
      case "Ended":
        return "px-3 py-1 rounded bg-zinc-500/20 text-zinc-300 text-sm";
      default:
        return "px-3 py-1 rounded bg-amber-500/20 text-amber-300 text-sm";
    }
  };

  const getTypeBadgeClass = (type: string) => {
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

  if (submitSuccess) {
    return (
      <div className="min-h-screen text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Project Submitted Successfully!</h1>
            <p className="text-[#A3A3A3] mb-8">Your project has been added to the TGE dashboard.</p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/dashboard/tge"
                className="px-6 py-3 bg-purple-500/60 text-white rounded-lg hover:bg-purple-500/80 transition-colors"
              >
                View TGE Dashboard
              </Link>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setFormData({
                    name: "",
                    slug: "",
                    image: "",
                    amount_raised: null,
                    raise_type: "",
                    rewards: "",
                    status: "Active",
                    type: "Campaign",
                    platforms: [],
                    backers: [],
                    countdown: null
                  });
                }}
                className="px-6 py-3 bg-gray-500/60 text-white rounded-lg hover:bg-gray-500/80 transition-colors"
              >
                Submit Another Project
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-4xl font-bold text-white mb-2">Submit New Project</h1>
          <p className="text-lg text-[#A3A3A3]">Add a new project to the TGE dashboard</p>
        </div>

        {/* Form Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'form'
                ? "bg-purple-500/60 text-white" 
                : "bg-gray-500/20 text-gray-300 hover:bg-gray-500/40"
            }`}
          >
            Form
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'preview'
                ? "bg-purple-500/60 text-white" 
                : "bg-gray-500/20 text-gray-300 hover:bg-gray-500/40"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'delete'
                ? "bg-red-500/60 text-white" 
                : "bg-gray-500/20 text-gray-300 hover:bg-gray-500/40"
            }`}
          >
            Delete
          </button>
        </div>

        {activeTab === 'form' && (
          /* Form */
          <div className="space-y-8">
            {/* Project Selection */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Select Existing Project (Optional)</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Search CryptoRank projects</label>
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    value={isProjectInputFocused ? projectSearchQuery : selectedProject?.name || ""}
                    onChange={handleProjectInputChange}
                    onFocus={handleProjectInputFocus}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    placeholder="Type to search projects..."
                    disabled={isLoadingProjects}
                  />
                  {isLoadingProjects && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                    </div>
                  )}
                  
                  {/* Dropdown */}
                  {showProjectDropdown && (filteredProjects.length > 0 || cryptoRankProjects.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(projectSearchQuery.trim() ? filteredProjects : cryptoRankProjects).map(project => (
                        <div
                          key={project.key}
                          onClick={() => handleProjectSelect(project)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-[#1a1a1a] cursor-pointer"
                        >
                          {project.icon && (
                            <img 
                              src={project.icon} 
                              alt={project.name}
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-white font-medium">{project.name}</div>
                            {project.symbol && (
                              <div className="text-gray-400 text-sm">{project.symbol}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedProject && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleGetBackers}
                      disabled={isLoadingBackers}
                      className="px-4 py-2 bg-blue-500/60 text-white rounded-lg hover:bg-blue-500/80 transition-colors disabled:opacity-50"
                    >
                      {isLoadingBackers ? "Loading Backers..." : "Get Backers"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      handleInputChange('name', e.target.value);
                      if (!selectedProject) {
                        handleInputChange('slug', generateSlug(e.target.value));
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Slug *</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    placeholder="project-slug"
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-generated from name, but you can edit it</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    placeholder="https://example.com/image.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount Raised ($)</label>
                  <input
                    type="number"
                    value={formData.amount_raised || ''}
                    onChange={(e) => handleInputChange('amount_raised', e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    placeholder="40000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Raise Type</label>
                  <input
                    type="text"
                    value={formData.raise_type}
                    onChange={(e) => handleInputChange('raise_type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    placeholder="Series A, Seed, Private Sale, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rewards</label>
                  <input
                    type="text"
                    value={formData.rewards}
                    onChange={(e) => handleInputChange('rewards', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    placeholder="$5000 ATLAS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    {TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">InfoFi Platforms *</h2>
              <p className="text-sm text-gray-400 mb-4">Select at least one platform (required)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PLATFORM_OPTIONS.map(platform => (
                  <label key={platform} className="flex items-center cursor-pointer p-3 rounded-lg border border-[#2a2e35] hover:border-purple-400/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.platforms.includes(platform)}
                      onChange={() => handlePlatformToggle(platform)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                      formData.platforms.includes(platform)
                        ? 'border-purple-400 bg-purple-400'
                        : 'border-gray-400'
                    }`}>
                      {formData.platforms.includes(platform) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-300">{platform}</span>
                  </label>
                ))}
              </div>
              {formData.platforms.length === 0 && (
                <p className="text-red-400 text-sm mt-2">Please select at least one InfoFi platform</p>
              )}
            </div>

            {/* Backers */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Backers</h2>
              
              {/* Add New Backer */}
              <div className="bg-[#0f0f0f] rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Add New Backer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                    <input
                      type="text"
                      value={newBacker.name}
                      onChange={(e) => setNewBacker(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#151820] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                      placeholder="Backer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={newBacker.image}
                      onChange={(e) => setNewBacker(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#151820] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Round</label>
                    <select
                      value={newBacker.round}
                      onChange={(e) => setNewBacker(prev => ({ ...prev, round: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#151820] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      {BACKER_ROUNDS.map(round => (
                        <option key={round} value={round}>{round}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                    <select
                      value={newBacker.type}
                      onChange={(e) => setNewBacker(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#151820] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      {BACKER_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select
                      value={newBacker.category}
                      onChange={(e) => setNewBacker(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#151820] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      {BACKER_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tier</label>
                    <input
                      type="number"
                      value={newBacker.tier || ''}
                      onChange={(e) => setNewBacker(prev => ({ ...prev, tier: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-[#151820] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400"
                      placeholder="1"
                    />
                  </div>
                </div>
                <button
                  onClick={addBacker}
                  className="mt-3 px-4 py-2 bg-purple-500/60 text-white rounded-lg hover:bg-purple-500/80 transition-colors"
                >
                  Add Backer
                </button>
              </div>

              {/* Current Backers */}
              {formData.backers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Current Backers ({formData.backers.length})</h3>
                  <div className="space-y-2">
                    {formData.backers.map((backer, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#0f0f0f] rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          {backer.image && (
                            <img 
                              src={backer.image} 
                              alt={backer.name}
                              className="w-6 h-6 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <span className="text-white font-medium">{backer.name}</span>
                            <span className="text-gray-400 text-sm ml-2">({backer.round})</span>
                            {backer.tier !== null ? (
                              <span className="text-gray-400 text-sm ml-2">Tier {backer.tier}</span>
                            ) : (
                              <span className="text-gray-400 text-sm ml-2">Angel</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeBacker(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowPasswordModal(true)}
                disabled={!formData.name.trim() || formData.platforms.length === 0}
                className="px-8 py-3 bg-purple-500/60 text-white rounded-lg hover:bg-purple-500/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Project
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          /* Preview */
          <div className="space-y-8">
            {/* Project Header Preview */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <div className="flex items-center gap-4 mb-4">
                {formData.image && (
                  <img 
                    src={formData.image} 
                    alt={formData.name}
                    className="w-15 h-15 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <div>
                  <h1 className="text-4xl font-bold text-white">{formData.name}</h1>
                  <p className="text-2xl text-[#A3A3A3]">{formData.slug}</p>
                </div>
                <div className="flex gap-2">
                  <span className={getStatusBadgeClass(formData.status)}>
                    {formData.status}
                  </span>
                  <span className={getTypeBadgeClass(formData.type)}>
                    {formData.type}
                  </span>
                </div>
              </div>
              {formData.rewards && (
                <div className="mb-4">
                  <p className="text-lg text-[#ffffffcc]">
                    <span className="text-purple-300 font-semibold">Rewards:</span> {formData.rewards}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Metrics Preview */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Financial Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#A3A3A3] text-sm">Amount Raised</p>
                  <p className="text-2xl font-bold text-white">{formatAmount(formData.amount_raised)}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Raise Type</p>
                  <p className="text-2xl font-bold text-white">{formData.raise_type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Status</p>
                  <p className="text-2xl font-bold text-white">{formData.status}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Type</p>
                  <p className="text-2xl font-bold text-white">{formData.type}</p>
                </div>
                <div>
                  <p className="text-[#A3A3A3] text-sm">Rewards</p>
                  <p className="text-2xl font-bold text-white">{formData.rewards || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Backers Preview */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Backers ({formData.backers.length})</h2>
              {formData.backers.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {formData.backers.map((backer, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgba(71,79,92,0.35)] text-sm">
                      {backer.image && (
                        <img 
                          src={backer.image} 
                          alt={backer.name}
                          className="w-5 h-5 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <span>{backer.name}</span>
                      <span className="text-xs text-gray-400">{backer.type}</span>
                      {backer.round && <span className="text-xs text-gray-400">({backer.round})</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No backers added</p>
              )}
            </div>

            {/* Platforms Preview */}
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">InfoFi Platforms ({formData.platforms.length})</h2>
              {formData.platforms.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {formData.platforms.map((platform) => (
                    <span key={platform} className="flex items-center gap-2 px-3 py-2 rounded bg-[rgba(42,46,53,0.35)] text-sm">
                      {platform}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No platforms selected</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'delete' && (
          /* Delete Section */
          <div className="space-y-8">
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35]">
              <h2 className="text-xl font-bold text-white mb-4">Delete Project</h2>
              <p className="text-gray-300 mb-6">
                Enter the project slug to delete it from the TGE dashboard. This action cannot be undone.
              </p>
              
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Slug *</label>
                <input
                  type="text"
                  value={deleteSlug}
                  onChange={(e) => setDeleteSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-red-400"
                  placeholder="project-slug-to-delete"
                />
                <p className="text-xs text-gray-400 mt-1">Enter the exact slug of the project you want to delete</p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  disabled={!deleteSlug.trim()}
                  className="px-6 py-3 bg-red-500/60 text-white rounded-lg hover:bg-red-500/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#151820] rounded-lg p-6 border border-[#2a2e35] w-96">
              <h3 className="text-xl font-bold text-white mb-4">Admin Password Required</h3>
              <p className="text-gray-300 mb-4">
                {activeTab === 'delete' 
                  ? "Enter the admin password to delete this project:" 
                  : "Enter the admin password to submit this project:"
                }
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:border-purple-400 mb-4"
                placeholder="Enter admin password"
                autoFocus
              />
              {submitError && (
                <p className="text-red-400 text-sm mb-4">{submitError}</p>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword("");
                    setSubmitError(null);
                  }}
                  className="px-4 py-2 bg-gray-500/60 text-white rounded-lg hover:bg-gray-500/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={activeTab === 'delete' ? handleDeleteProject : handleSubmit}
                  disabled={isSubmitting || isDeleting}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    activeTab === 'delete' 
                      ? "bg-red-500/60 hover:bg-red-500/80" 
                      : "bg-purple-500/60 hover:bg-purple-500/80"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : isDeleting ? "Deleting..." : activeTab === 'delete' ? "Delete" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
