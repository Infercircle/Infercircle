"use client";
import React from "react";
import { TokenSaleProject, FilterState } from "./types";

interface ProjectGridProps {
  projects: TokenSaleProject[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  status?: FilterState["status"]; // Add status prop to determine which dates to show
}

const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  status = "upcoming"
}) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  console.log("Projects:", projects);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    // Check if the date is valid and not the Unix epoch
    if (isNaN(date.getTime()) || date.getTime() === 0) {
      return "N/A";
    }
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProjectStatus = (project: TokenSaleProject) => {
    const today = new Date();
    
    if (!project.till) {
      return { status: "unknown", color: "gray" };
    }
    
    const endDate = new Date(project.till);
    const startDate = project.when ? new Date(project.when) : null;
    
    // Check if dates are valid
    if (isNaN(endDate.getTime())) {
      return { status: "unknown", color: "gray" };
    }
    
    if (startDate && !isNaN(startDate.getTime()) && today < startDate) {
      return { status: "upcoming", color: "blue" };
    } else if (today <= endDate) {
      return { status: "active", color: "green" };
    } else {
      return { status: "past", color: "gray" };
    }
  };

  const getDaysRemaining = (dateString: string | null | undefined, status: string) => {
    if (!dateString || status === "unknown") {
      return "Date N/A";
    }
    
    const today = new Date();
    const targetDate = new Date(dateString);
    
    if (isNaN(targetDate.getTime())) {
      return "Date N/A";
    }
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (status === "upcoming") {
      return diffDays > 0 ? `Starts in ${diffDays} days` : "Starting soon";
    } else if (status === "active") {
      return diffDays > 0 ? `${diffDays} days left` : "Ending soon";
    } else {
      return `Ended ${Math.abs(diffDays)} days ago`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="animate-pulse">
            <div className="bg-[#181A20] border border-[#23262F] rounded-lg p-6">
              <div className="h-12 w-12 bg-[#23262F] rounded-full mb-4"></div>
              <div className="h-4 bg-[#23262F] rounded mb-2"></div>
              <div className="h-3 bg-[#23262F] rounded mb-4 w-2/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-[#23262F] rounded"></div>
                <div className="h-3 bg-[#23262F] rounded"></div>
                <div className="h-3 bg-[#23262F] rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {projects.map((project) => {
          const projectStatus = getProjectStatus(project);
          const daysInfo = getDaysRemaining(project.till, projectStatus.status);
          
          return (
            <div
              key={project.key}
              className="bg-[#181A20] border border-[#23262F] rounded-lg p-6 hover:border-[#A259FF]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[#A259FF]/10 relative"
            >
              {/* Status Indicator */}
              <div className="absolute top-4 right-4">
                <div className={`w-3 h-3 rounded-full ${
                  projectStatus.color === "green" ? "bg-green-500" :
                  projectStatus.color === "blue" ? "bg-blue-500" : "bg-gray-500"
                }`}></div>
              </div>

              {/* Project Header */}
              <div className="flex items-start justify-between mb-4 pr-6">
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
              <div className="flex items-center space-x-2 mb-4 flex-wrap gap-y-1">
                <span className="bg-[#23262F] text-[#A3A3A3] text-xs px-2 py-1 rounded">
                  {project.category.name}
                </span>
                {project.type.slice(0, 2).map((type, idx) => (
                  <span key={idx} className="bg-[#A259FF]/20 text-[#A259FF] text-xs px-2 py-1 rounded">
                    {type}
                  </span>
                ))}
                {project.type.length > 2 && (
                  <span className="bg-[#A259FF]/20 text-[#A259FF] text-xs px-2 py-1 rounded">
                    +{project.type.length - 2}
                  </span>
                )}
              </div>

              {/* Key Metrics */}
              <div className="space-y-3 mb-4">
                
                <div className="flex justify-between items-center">
                    <span className="text-[#A3A3A3] text-sm">Target Raise</span>
                    <span className="text-white font-medium">{project.raise > 0? formatCurrency(project.raise) : "-"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#A3A3A3] text-sm">Total Raise</span>
                  <span className="text-white font-medium">{formatCurrency(project.totalRaise)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[#A3A3A3] text-sm">Sale Price</span>
                    <span className="text-white font-medium">${project.salePrice > 0?project.salePrice : "-"}</span>
                </div>
                {/* Date display based on status */}
                {status === "upcoming" && project.when && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#A3A3A3] text-sm">Start Date</span>
                    <span className="text-white font-medium">{formatDate(project.when)}</span>
                  </div>
                )}
                {status === "active" && (
                  <>
                    {project.when && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#A3A3A3] text-sm">Start Date</span>
                        <span className="text-white font-medium">{formatDate(project.when)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[#A3A3A3] text-sm">End Date</span>
                      <span className="text-white font-medium">{formatDate(project.till)}</span>
                    </div>
                  </>
                )}
                {status === "past" && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#A3A3A3] text-sm">Ended Date</span>
                    <span className="text-white font-medium">{formatDate(project.till)}</span>
                  </div>
                )}
              </div>

              {/* Status Banner */}
              <div className="mb-4">
                <div className={`text-center py-2 px-3 rounded text-sm font-medium ${
                  projectStatus.status === "active" 
                    ? 'bg-green-500/20 text-green-400' 
                    : projectStatus.status === "upcoming"
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {daysInfo}
                </div>
              </div>

              {/* Launchpads */}
              {project.launchpads.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#A3A3A3]">Launchpads</span>
                    <span className="text-white font-medium">
                      {project.launchpads[0]?.name}
                      {project.launchpads.length > 1 && ` +${project.launchpads.length - 1}`}
                    </span>
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
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                onClick={() => onPageChange(pageNum)}
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
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-[#23262F] rounded-lg bg-[#181A20] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#A259FF] transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default ProjectGrid;