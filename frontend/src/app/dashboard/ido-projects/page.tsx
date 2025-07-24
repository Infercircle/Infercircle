"use client";
import React, { useState, useEffect } from "react";

interface Tag {
  key: string;
  name: string;
}

interface Category {
  key: string;
  name: string;
}

interface TwitterData {
  twitterScore: number;
  followersCount: number | null;
  twitterAccountId: number;
  topFollowers: any[];
}

interface IDOProject {
  isSponsored: boolean;
  name: string;
  key: string;
  symbol: string;
  image: string;
  category: Category;
  initialCap: number | null;
  raise: number;
  till: string;
  launchpads: any[];
  totalRaise: number;
  type: string[];
  funds: any[];
  tags: Tag[];
  salePrice: number;
  twitterData: TwitterData;
  blockchains: any[];
}

interface ApiResponse {
  total: number;
  data: IDOProject[];
}

export default function IDOProjectsPage() {
  const [projects, setProjects] = useState<IDOProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [sortBy, setSortBy] = useState<"name" | "raise" | "totalRaise" | "till">("raise");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const limit = 12;

  const fetchProjects = async (page: number = 1, search: string = "") => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const response = await fetch(`${process.env.NEXT_PUBLIC_HELPERS_API_URL}/active`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          filters: {
            tokenSaleTypes: {
              condition: "or",
              data: ["IDO"]
            }
          },
          skip,
          locale: "en"
        }),
      });
      
      const data: ApiResponse = await response.json();
      
      let filteredData = data.data;
      
      // Apply search filter
      if (search) {
        filteredData = filteredData.filter(project =>
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.symbol.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Apply category filter
      if (selectedCategory !== "all") {
        filteredData = filteredData.filter(project =>
          project.category.key === selectedCategory
        );
      }
      
      // Apply sorting
      filteredData.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "raise":
            aValue = a.raise || 0;
            bValue = b.raise || 0;
            break;
          case "totalRaise":
            aValue = a.totalRaise || 0;
            bValue = b.totalRaise || 0;
            break;
          case "till":
            aValue = new Date(a.till).getTime();
            bValue = new Date(b.till).getTime();
            break;
          default:
            return 0;
        }
        
        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setProjects(filteredData);
      setTotalProjects(data.total);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage, searchTerm);
  }, [currentPage, searchTerm, sortBy, sortOrder, selectedCategory]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (dateString: string) => {
    const today = new Date();
    const endDate = new Date(dateString);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalPages = Math.ceil(totalProjects / limit);

  const categories = Array.from(new Set(projects.map(p => p.category.key)));

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Active IDO Projects</h1>
          <p className="text-[#A3A3A3]">Discover and track active Initial DEX Offerings</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[#A3A3A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-3 border border-[#23262F] rounded-lg bg-[#181A20] text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-[#23262F] rounded-lg bg-[#181A20] text-white focus:outline-none focus:ring-2 focus:ring-[#A259FF]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
              }}
              className="px-4 py-2 border border-[#23262F] rounded-lg bg-[#181A20] text-white focus:outline-none focus:ring-2 focus:ring-[#A259FF]"
            >
              <option value="raise-desc">Highest Raise</option>
              <option value="raise-asc">Lowest Raise</option>
              <option value="totalRaise-desc">Highest Total Raise</option>
              <option value="totalRaise-asc">Lowest Total Raise</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="till-asc">Ending Soon</option>
              <option value="till-desc">Ending Later</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 bg-[#181A20] border border-[#23262F] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#A3A3A3]">
              Showing {projects.length} of {totalProjects} active IDO projects
            </div>
            <div className="text-sm text-[#A3A3A3]">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="bg-[#181A20] border border-[#23262F] rounded-lg p-4">
                  <div className="h-12 w-12 bg-[#23262F] rounded-full mb-4"></div>
                  <div className="h-4 bg-[#23262F] rounded mb-2"></div>
                  <div className="h-3 bg-[#23262F] rounded mb-4 w-2/3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-[#23262F] rounded"></div>
                    <div className="h-3 bg-[#23262F] rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {projects.map((project) => {
                const daysRemaining = getDaysRemaining(project.till);
                return (
                  <div
                    key={project.key}
                    className="bg-[#181A20] border border-[#23262F] rounded-lg p-6 hover:border-[#A259FF]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[#A259FF]/10"
                  >
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={project.image}
                          alt={project.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold text-white text-lg">{project.name}</h3>
                          <p className="text-[#A3A3A3] text-sm">{project.symbol}</p>
                        </div>
                      </div>
                      {project.isSponsored && (
                        <span className="bg-[#A259FF] text-white text-xs px-2 py-1 rounded-full">
                          Sponsored
                        </span>
                      )}
                    </div>

                    {/* Category & Type */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="bg-[#23262F] text-[#A3A3A3] text-xs px-2 py-1 rounded">
                        {project.category.name}
                      </span>
                      {project.type.map((type, idx) => (
                        <span key={idx} className="bg-[#A259FF]/20 text-[#A259FF] text-xs px-2 py-1 rounded">
                          {type}
                        </span>
                      ))}
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#A3A3A3] text-sm">Target Raise</span>
                        <span className="text-white font-medium">{project.raise ? formatCurrency(project.raise): "Unknow"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A3A3A3] text-sm">Total Raise</span>
                        <span className="text-white font-medium">{formatCurrency(project.totalRaise)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A3A3A3] text-sm">Sale Price</span>
                        <span className="text-white font-medium">${project.salePrice}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A3A3A3] text-sm">Ends</span>
                        <span className="text-white font-medium">{formatDate(project.till)}</span>
                      </div>
                    </div>

                    {/* Days Remaining */}
                    <div className="mb-4">
                      <div className={`text-center py-2 px-3 rounded text-sm font-medium ${
                        daysRemaining <= 7 
                          ? 'bg-red-500/20 text-red-400' 
                          : daysRemaining <= 30 
                          ? 'bg-yellow-500/20 text-yellow-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
                      </div>
                    </div>

                    {/* Twitter Score */}
                    {project.twitterData?.twitterScore && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#A3A3A3]">Twitter Score</span>
                          <span className="text-[#1DA1F2] font-medium">{project.twitterData.twitterScore}</span>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-[#23262F] text-[#A3A3A3] text-xs px-2 py-1 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="bg-[#23262F] text-[#A3A3A3] text-xs px-2 py-1 rounded">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {projects.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-[#A3A3A3] text-lg mb-2">No projects found</div>
                <p className="text-[#A3A3A3] text-sm">Try adjusting your search or filters</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-[#23262F] rounded-lg bg-[#181A20] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#A259FF] transition-colors"
                >
                  Previous
                </button>
                
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  const pageNum = currentPage <= 3 ? idx + 1 : currentPage - 2 + idx;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'border-[#A259FF] bg-[#A259FF] text-white'
                          : 'border-[#23262F] bg-[#181A20] text-white hover:border-[#A259FF]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-[#23262F] rounded-lg bg-[#181A20] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#A259FF] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 