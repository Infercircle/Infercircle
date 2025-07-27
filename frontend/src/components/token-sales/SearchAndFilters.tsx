"use client";
import React, { useState } from "react";
import { FilterState, SortOption, SearchSuggestion, TOKEN_SALE_TYPES, LAUNCHPAD_OPTIONS, CATEGORY_OPTIONS, ECOSYSTEM_OPTIONS } from "./types";

interface SearchAndFiltersProps {
  filters: FilterState;
  sortOption: SortOption;
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sort: SortOption) => void;
  onSearchChange: (search: string) => void;
  searchTerm: string;
  searchSuggestions: SearchSuggestion[];
  onSearchSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onClearSearch: () => void;
  selectedCoin: SearchSuggestion | null;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  filters,
  sortOption,
  onFilterChange,
  onSortChange,
  onSearchChange,
  searchTerm,
  searchSuggestions,
  onSearchSuggestionSelect,
  onClearSearch,
  selectedCoin
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleStatusChange = (status: FilterState["status"]) => {
    onSearchChange("");
    onFilterChange({
      ...filters,
      status,
      coins: [] // Clear coins filter when changing status
    });
  };

  const handleTokenSaleTypeToggle = (type: string) => {
    const newTypes = filters.tokenSaleTypes.includes(type)
      ? filters.tokenSaleTypes.filter(t => t !== type)
      : [...filters.tokenSaleTypes, type];
    
    onFilterChange({
      ...filters,
      tokenSaleTypes: newTypes
    });
  };

  const handleLaunchpadToggle = (launchpad: string) => {
    const newLaunchpads = filters.launchpads.includes(launchpad)
      ? filters.launchpads.filter(l => l !== launchpad)
      : [...filters.launchpads, launchpad];
    
    onFilterChange({
      ...filters,
      launchpads: newLaunchpads
    });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFilterChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleEcosystemToggle = (ecosystem: string) => {
    const newEcosystems = filters.ecosystems.includes(ecosystem)
      ? filters.ecosystems.filter(e => e !== ecosystem)
      : [...filters.ecosystems, ecosystem];
    
    onFilterChange({
      ...filters,
      ecosystems: newEcosystems
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-');
    onSortChange({
      field: field as SortOption["field"],
      order: order as SortOption["order"]
    });
  };

  const getSortOptions = () => {
    const baseOptions = [
      <option key="raise-desc" value="raise-desc">Highest Raise</option>,
      <option key="raise-asc" value="raise-asc">Lowest Raise</option>,
      <option key="totalRaise-desc" value="totalRaise-desc">Highest Total Raise</option>,
      <option key="totalRaise-asc" value="totalRaise-asc">Lowest Total Raise</option>,
      <option key="name-asc" value="name-asc">Name A-Z</option>,
      <option key="name-desc" value="name-desc">Name Z-A</option>
    ];

    if (filters.status === "upcoming") {
      return [
        ...baseOptions,
        <option key="when-asc" value="when-asc">Start Date (Earliest First)</option>,
        <option key="when-desc" value="when-desc">Start Date (Latest First)</option>
      ];
    } else if (filters.status === "active") {
      return [
        ...baseOptions,
        <option key="till-asc" value="till-asc">End Date (Earliest First)</option>,
        <option key="till-desc" value="till-desc">End Date (Latest First)</option>
      ];
    } else if (filters.status === "past") {
      return [
        ...baseOptions,
        <option key="till-desc" value="till-desc">End Date (Latest First)</option>,
        <option key="till-asc" value="till-asc">End Date (Earliest First)</option>
      ];
    } else {
      return [
        ...baseOptions,
        <option key="when-asc" value="when-asc">Start Date (Earliest First)</option>,
        <option key="when-desc" value="when-desc">Start Date (Latest First)</option>,
        <option key="till-asc" value="till-asc">End Date (Earliest First)</option>,
        <option key="till-desc" value="till-desc">End Date (Latest First)</option>
      ];
    }
  };

  const clearAllFilters = () => {
    onSearchChange("");
    onFilterChange({
      search: "",
      status: "upcoming",
      tokenSaleTypes: [],
      launchpads: [],
      categories: [],
      ecosystems: []
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== "upcoming") count++;
    if (filters.tokenSaleTypes.length > 0) count++;
    if (filters.launchpads.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.ecosystems.length > 0) count++;
    return count;
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Main Search and Status Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
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
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-10 py-3 border border-[#23262F] rounded-lg bg-[#181A20] text-white placeholder-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent"
          />
          
          {/* Clear search button */}
          {/* {(searchTerm || selectedCoin) && (
            <button
              onClick={onClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A3A3A3] hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )} */}

          {/* Search suggestions dropdown */}
          {searchSuggestions.length > 0 && !selectedCoin && searchTerm && (
            <div className="absolute z-50 w-full mt-1 bg-[#181A20] border border-[#23262F] rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  onClick={() => onSearchSuggestionSelect(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-[#23262F] border-b border-[#23262F] last:border-b-0 focus:outline-none focus:bg-[#23262F]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{suggestion.name}</div>
                      <div className="text-[#A3A3A3] text-sm">{suggestion.symbol}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected coin indicator */}
          {/* {selectedCoin && (
            <div className="absolute z-40 w-full mt-1 bg-[#A259FF] bg-opacity-10 border border-[#A259FF] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[#A259FF] font-medium">Selected: {selectedCoin.name}</div>
                  <div className="text-[#A3A3A3] text-sm">{selectedCoin.symbol}</div>
                </div>
                <button
                  onClick={onClearSearch}
                  className="text-[#A259FF] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )} */}
        </div>

        <div className="flex items-center gap-4">
          {/* Sort Options */}
          <select
            value={`${sortOption.field}-${sortOption.order}`}
            onChange={handleSortChange}
            className="px-4 py-2 border border-[#23262F] rounded-lg bg-[#181A20] text-white focus:outline-none focus:ring-2 focus:ring-[#A259FF]"
          >
            {getSortOptions()}
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
              showAdvancedFilters || getActiveFilterCount() > 0
                ? 'border-[#A259FF] bg-[#A259FF]/10 text-[#A259FF]'
                : 'border-[#23262F] bg-[#181A20] text-white hover:border-[#A259FF]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="bg-[#A259FF] text-white text-xs px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(["upcoming", "active", "past"] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === status
                ? 'bg-[#A259FF] text-white'
                : 'bg-[#181A20] text-[#A3A3A3] border border-[#23262F] hover:border-[#A259FF]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-[#181A20] border border-[#23262F] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[#A259FF] hover:text-[#A259FF]/80 text-sm"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Token Sale Types */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Sale Types</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {TOKEN_SALE_TYPES.map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.tokenSaleTypes.includes(type)}
                      onChange={() => handleTokenSaleTypeToggle(type)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                      filters.tokenSaleTypes.includes(type)
                        ? 'border-[#A259FF] bg-[#A259FF]'
                        : 'border-[#A3A3A3]'
                    }`}>
                      {filters.tokenSaleTypes.includes(type) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[#A3A3A3]">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Launchpads */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Launchpads</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {LAUNCHPAD_OPTIONS.map((launchpad) => (
                  <label key={launchpad} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.launchpads.includes(launchpad)}
                      onChange={() => handleLaunchpadToggle(launchpad)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                      filters.launchpads.includes(launchpad)
                        ? 'border-[#A259FF] bg-[#A259FF]'
                        : 'border-[#A3A3A3]'
                    }`}>
                      {filters.launchpads.includes(launchpad) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[#A3A3A3]">{launchpad}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Categories</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {CATEGORY_OPTIONS.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                      filters.categories.includes(category)
                        ? 'border-[#A259FF] bg-[#A259FF]'
                        : 'border-[#A3A3A3]'
                    }`}>
                      {filters.categories.includes(category) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[#A3A3A3]">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ecosystems */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Ecosystems</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ECOSYSTEM_OPTIONS.map((ecosystem) => (
                  <label key={ecosystem} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.ecosystems.includes(ecosystem)}
                      onChange={() => handleEcosystemToggle(ecosystem)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                      filters.ecosystems.includes(ecosystem)
                        ? 'border-[#A259FF] bg-[#A259FF]'
                        : 'border-[#A3A3A3]'
                    }`}>
                      {filters.ecosystems.includes(ecosystem) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-[#A3A3A3]">{ecosystem}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;