"use client";
import React from "react";

interface StatsBarProps {
  totalProjects: number;
  currentProjects: number;
  currentPage: number;
  totalPages: number;
}

const StatsBar: React.FC<StatsBarProps> = ({
  totalProjects,
  currentProjects,
  currentPage,
  totalPages
}) => {
  return (
    <div className="mb-6 bg-[rgba(24,26,32,0.9)] border border-[#23262F] rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="text-sm text-[#A3A3A3]">
            Showing <span className="text-white font-medium">{currentProjects}</span> of{" "}
            <span className="text-white font-medium">{totalProjects}</span> projects
          </div>
          
          {totalPages > 1 && (
            <div className="text-sm text-[#A3A3A3]">
              Page <span className="text-white font-medium">{currentPage}</span> of{" "}
              <span className="text-white font-medium">{totalPages}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-[#A3A3A3]">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-[#A3A3A3]">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-xs text-[#A3A3A3]">Past</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;