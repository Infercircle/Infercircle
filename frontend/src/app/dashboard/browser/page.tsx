"use client";

import React, { useState } from "react";
import TopNavigation from "@/components/browser/TopNavigation";
import SourceFilters from "@/components/browser/SourceFilters";
import ContentFeed from "@/components/browser/ContentFeed";
import ContentDisplay from "@/components/browser/ContentDisplay";

export default function BrowserPage() {
  const [selectedProject, setSelectedProject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("Last 24h");
  const [selectedSources, setSelectedSources] = useState(["all"]);
  const [selectedContentItem, setSelectedContentItem] = useState<string | null>(null);

  return (
    <div className="text-white">
      <TopNavigation
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        resultsCount={47938}
      />

      {/* Hidden on mobile/medium - Source Filters */}
      <div className="hidden lg:block">
        <SourceFilters
          selectedSources={selectedSources}
          setSelectedSources={setSelectedSources}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 px-2 pb-5 lg:grid-cols-12">
        {/* Content Feed - Increased Width */}
        <div className="col-span-1 lg:col-span-4">
          <ContentFeed
            selectedSources={selectedSources}
            selectedItem={selectedContentItem}
            onItemSelect={setSelectedContentItem}
          />
        </div>
        
        {/* Content Display - Adjusted Width */}
        <div className="col-span-1 lg:col-span-8">
          <ContentDisplay
            selectedItem={selectedContentItem}
            onBack={() => setSelectedContentItem(null)}
            selectedProject={selectedProject}
          />
        </div>
      </div>
    </div>
  );
} 