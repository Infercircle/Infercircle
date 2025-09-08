"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight, FiSliders, FiX, FiCalendar } from "react-icons/fi";
import { FaSquareXTwitter, FaDiscord, FaTelegram, FaVideo } from "react-icons/fa6";
import { FaPodcast } from "react-icons/fa";
import { SiFarcaster } from "react-icons/si";
import { MdOutlineArticle, MdOutlineSchool } from "react-icons/md";
import { HiOutlineDocumentText, HiOutlineMicrophone, HiOutlinePresentationChartLine } from "react-icons/hi";
import { RiGovernmentFill } from "react-icons/ri";


export const availableProjects = [
  { id: "EIGEN", name: "EigenLayer", icon: "🔵" },
  { id: "BTC", name: "Bitcoin", icon: "🟠" },
  { id: "ETH", name: "Ethereum", icon: "🔷" },
  { id: "SOL", name: "Solana", icon: "🟣" },
  { id: "AVAX", name: "Avalanche", icon: "🔴" },
  { id: "MATIC", name: "Polygon", icon: "🟣" },
];

const availableSources = [
  { id: "all", name: "All Sources", icon: null },
  { id: "twitter", name: "Twitter", icon: FaSquareXTwitter },
  { id: "farcaster", name: "Farcaster", icon: SiFarcaster },
  { id: "governance", name: "Governance", icon: RiGovernmentFill },
  { id: "vote", name: "Vote", icon: HiOutlinePresentationChartLine },
  { id: "news", name: "News", icon: HiOutlineDocumentText },
  { id: "twitter-space", name: "Twitter Space", icon: HiOutlineMicrophone },
  { id: "podcast", name: "Podcast", icon: FaPodcast },
  { id: "conference", name: "Conference", icon: FaVideo },
  { id: "medium", name: "Medium", icon: MdOutlineArticle },
  { id: "research", name: "Research", icon: MdOutlineSchool },
  { id: "discord", name: "Discord", icon: FaDiscord },
  { id: "telegram", name: "Telegram", icon: FaTelegram },
];

interface TopNavigationProps {
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  resultsCount: number;
}


export default function TopNavigation({
  selectedProject,
  setSelectedProject,
  searchQuery,
  setSearchQuery,
  timeRange,
  setTimeRange,
  resultsCount
}: TopNavigationProps) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [isProjectInputFocused, setIsProjectInputFocused] = useState(false);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSources, setSelectedSources] = useState(["all"]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeRangeRef = useRef<HTMLDivElement>(null);

  const selectedProjectData = availableProjects.find(p => p.id === selectedProject);

  const filteredProjects = availableProjects.filter(project =>
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    project.id.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  const timeRangeOptions = [
    { id: "all", label: "All" },
    { id: "24h", label: "Last 24h" },
    { id: "48h", label: "Last 48h" },
    { id: "7d", label: "Last 7d" },
    { id: "30d", label: "Last 30d" },
    { id: "3m", label: "Last 3m" },
    { id: "6m", label: "Last 6m" },
    { id: "12m", label: "Last 12m" },
    { id: "custom", label: "Custom Date" }
  ];

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateRangeSelect = (option: typeof timeRangeOptions[0]) => {
    setTimeRange(option.label);
    if (option.id === "custom") {
      setShowCustomDatePicker(!showCustomDatePicker);
    } else {
      setShowTimeRangeDropdown(false);
      setShowCustomDatePicker(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
        setIsProjectInputFocused(false);
      }
      if (timeRangeRef.current && !timeRangeRef.current.contains(event.target as Node)) {
        setShowTimeRangeDropdown(false);
        setShowCustomDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectSelect = (project: typeof availableProjects[0]) => {
    setSelectedProject(project.id);
    setShowProjectDropdown(false);
    setIsProjectInputFocused(false);
    setProjectSearchQuery("");
  };

  const handleProjectInputFocus = () => {
    setIsProjectInputFocused(true);
    setShowProjectDropdown(true);
  };

  const handleProjectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectSearchQuery(e.target.value);
    setShowProjectDropdown(true);
  };

  const handleSourceToggle = (sourceId: string) => {
    if (sourceId === "all") {
      setSelectedSources(["all"]);
    } else {
      const newSources = selectedSources.includes(sourceId)
        ? selectedSources.filter(id => id !== sourceId && id !== "all")
        : [...selectedSources.filter(id => id !== "all"), sourceId];
      
      if (newSources.length === 0) {
        setSelectedSources(["all"]);
      } else {
        setSelectedSources(newSources);
      }
    }
  };

  const isSourceSelected = (sourceId: string) => {
    return selectedSources.includes(sourceId);
  };

  return (
    <div className="px-3 pt-2 pb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Time Range Button */}
        <div className="relative" ref={timeRangeRef}>
          <button 
            onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
            className={`flex items-center space-x-2 px-3 py-2 border rounded transition-colors cursor-pointer ${
              showTimeRangeDropdown 
                ? "bg-purple-600/20 border-purple-500/30" 
                : "bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/30"
            }`}
          >
            <FiCalendar className="w-4 h-4 text-white" />
            <span className="text-sm text-white">{timeRange}</span>
            <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showTimeRangeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Time Range Dropdown with Calendar */}
          {showTimeRangeDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-[rgba(24,26,32,1)] border border-[#23272b] rounded shadow-lg z-50 pl-6 pr-4 py-4 w-[200px] lg:w-[550px]">
              <div className="flex flex-col lg:flex-row space-x-1">
                {/* Time Range Options */}
                <div className="w-40 lg:w-48">
                  <div className="text-xs text-gray-400 mb-2 font-medium">Time Range</div>
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleDateRangeSelect(option)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 hover:bg-[rgba(36,37,42,0.25)] transition-colors text-left cursor-pointer rounded ${
                        timeRange === option.label ? "bg-purple-500/20 text-purple-400" : "text-white"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        timeRange === option.label && option.id !== "custom"
                          ? "bg-purple-500 border-purple-500" 
                          : "border-gray-400"
                      }`}></div>
                      <span className="text-sm">{option.label}</span>
                      {option.id === "custom" && (
                        <FiChevronDown className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${
                          showCustomDatePicker ? 'rotate-180' : ''
                        } lg:rotate-0`} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Date Inputs - Mobile/Medium */}
                {showCustomDatePicker && (
                  <div className="lg:hidden mt-4 space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-40 px-3 py-2 bg-[rgba(24,26,32,1)] border border-purple-500/30 rounded text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-40 px-3 py-2 bg-[rgba(24,26,32,1)] border border-purple-500/30 rounded text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Date Inputs and Calendar - Desktop */}
                <div className="hidden lg:block border-l border-[#23272b] pl-6 -my-4 pt-4">
                  {/* Date Inputs on Top */}
                  <div className="flex space-x-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-36 px-3 py-2 bg-[rgba(24,26,32,1)] border border-purple-500/30 rounded text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-36 px-3 py-2 bg-[rgba(24,26,32,1)] border border-purple-500/30 rounded text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-1 hover:bg-[rgba(36,37,42,0.25)] rounded transition-colors cursor-pointer"
                    >
                      <FiChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-sm text-white font-medium">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-1 hover:bg-[rgba(36,37,42,0.25)] rounded transition-colors cursor-pointer"
                    >
                      <FiChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="p-2 text-center text-gray-400 font-medium">
                        {day}
                      </div>
                    ))}
                    
                    {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                      <div key={`empty-${i}`} className="p-2"></div>
                    ))}
                    
                    {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                      const day = i + 1;
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isSelected = formatDate(date) === customStartDate || formatDate(date) === customEndDate;
                      
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            if (!customStartDate || (customStartDate && customEndDate)) {
                              setCustomStartDate(formatDate(date));
                              setCustomEndDate("");
                            } else {
                              setCustomEndDate(formatDate(date));
                            }
                          }}
                          className={`p-2 text-center text-sm rounded transition-colors cursor-pointer ${
                            isSelected 
                              ? "bg-purple-500 text-white" 
                              : isToday 
                              ? "bg-purple-500/20 text-purple-400" 
                              : "hover:bg-[rgba(36,37,42,0.25)] text-white"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Project Search Input */}
          <div className="relative flex-1 min-w-48 max-w-64" ref={dropdownRef}>
          <div className="relative">
             <input
               type="text"
               placeholder={selectedProject ? "" : "Search projects"}
               value={isProjectInputFocused ? projectSearchQuery : (selectedProjectData ? `${selectedProjectData.icon} ${selectedProjectData.name} (${selectedProjectData.id})` : "")}
               onChange={handleProjectInputChange}
               onFocus={handleProjectInputFocus}
               className="w-full h-10 px-4 pl-10 pr-20 bg-[rgba(24,26,32,1)] border border-[#23272b] rounded focus:outline-none text-white placeholder-gray-400 cursor-text"
             />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {/* Clear button - show when project is selected or when searching */}
              {(selectedProject || (isProjectInputFocused && projectSearchQuery)) && (
                 <button
                   onClick={() => {
                     setSelectedProject("");
                     setProjectSearchQuery("");
                     setShowProjectDropdown(false);
                     setIsProjectInputFocused(false);
                   }}
                   className="p-1 hover:bg-[#2A2A2A] rounded-sm transition-colors cursor-pointer"
                 >
                  <FiX className="w-3 h-3 text-gray-400" />
                </button>
              )}
               <button
                 onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                 className="p-1 hover:bg-[#2A2A2A] rounded-sm transition-colors cursor-pointer"
               >
                <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Project Dropdown */}
          {showProjectDropdown && (
             <div className="absolute top-full left-0 mt-1 w-64 bg-[rgba(24,26,32,1)] border border-[#23272b] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
               <div className="sticky top-0 bg-[rgba(24,26,32,1)] px-3 py-2 border-b border-[#23272b] z-10">
                 <div className="text-purple-400 text-sm font-medium">Project List</div>
               </div>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-[rgba(36,37,42,0.25)] transition-colors text-left cursor-pointer ${
                      selectedProject === project.id ? 'bg-purple-500/20 text-purple-400' : ''
                    }`}
                  >
                    <span className="text-lg">{project.icon}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${selectedProject === project.id ? 'text-purple-400' : 'text-white'}`}>{project.name}</span>
                      <span className={`text-sm ${selectedProject === project.id ? 'text-purple-300' : 'text-gray-400'}`}>{project.id}</span>
                    </div>
                    {selectedProject === project.id && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-400 text-sm">No projects found</div>
              )}
            </div>
          )}
          </div>

        {/* Search Bar */}
        <div className="flex-1 min-w-48 max-w-64 lg:max-w-3xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Topic (e.g. Dencun)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pl-10 pr-20 bg-[rgba(24,26,32,1)] border border-[#23272b] rounded focus:outline-none text-white placeholder-gray-400 cursor-text"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {searchQuery && (
                 <button
                   onClick={() => setSearchQuery("")}
                   className="p-1 hover:bg-[rgba(36,37,42,0.25)] rounded-sm transition-colors cursor-pointer"
                 >
                  <FiX className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Button - Mobile/Medium Only */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`lg:hidden flex items-center space-x-2 px-3 py-2 rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 focus:outline-none active:transform-none active:bg-inherit ${
          showFilters
      ? "bg-purple-500/20 text-purple-400 border border-purple-400/30"
      : "bg-purple-500/20 text-gray-300 border border-purple-400/30 hover:bg-purple-500/30"
  }`}
        >
          <span className="text-sm font-medium">Filters</span>
          <FiSliders className="w-3 h-3 text-gray-400" />
        </button>

        {/* Source Filters Panel - Mobile/Medium Only */}
        {showFilters && (
          <div className="lg:hidden w-full bg-[rgba(24,26,32,0.2)] border border-[#23262F] rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-3">
              {availableSources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => handleSourceToggle(source.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    isSourceSelected(source.id)
                      ? "bg-purple-500/20 text-purple-400 border border-purple-400/30"
                      : "bg-purple-500/20 text-gray-300 border border-purple-400/30 hover:bg-purple-500/30"
                  }`}
                >
                  <span className="text-sm font-medium">{source.name}</span>
                  {source.icon && (
                    <source.icon className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-400">
          {resultsCount.toLocaleString()} Results
        </div>


      </div>
    </div>
  );
}