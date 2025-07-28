"use client";
import React, { useState, useEffect, useCallback } from "react";
import SearchAndFilters from "@/components/token-sales/SearchAndFilters";
import ProjectGrid from "@/components/token-sales/ProjectGrid";
import StatsBar from "@/components/token-sales/StatsBar";
import { TokenSaleProject, FilterState, SortOption, SearchSuggestion } from "@/components/token-sales/types";

interface ApiResponse {
  total: number;
  data: TokenSaleProject[];
}

interface ApiFilters {
  tokenSaleTypes?: {
    condition: string;
    data: string[];
  };
  launchpads?: {
    condition: string;
    data: string[];
  };
  categories?: {
    condition: string;
    data: string[];
  };
  ecosystems?: {
    condition: string;
    data: string[];
  };
  coins?: string[];
}

export default function TokenSalesPage() {
  const [projects, setProjects] = useState<TokenSaleProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<SearchSuggestion | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "upcoming", // upcoming, active, past
    tokenSaleTypes: [],
    launchpads: [],
    categories: [],
    ecosystems: [],
    coins: []
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 50);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch search suggestions when user types
  const fetchSearchSuggestions = useCallback(async (searchQuery: string) => {
    setSearchSuggestions([]);
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    let endpoint = "upcoming"; // Default endpoint for upcoming projects
    if (filters.status !== "upcoming") {
      endpoint = filters.status;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HELPERS_API_URL}/${endpoint}?search=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.ok) {
        const suggestions: SearchSuggestion[] = await response.json();
        setSearchSuggestions(suggestions);
      }
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      setSearchSuggestions([]);
    }
  }, [filters.status, currentPage]);

  // Fetch suggestions when debounced search changes
  useEffect(() => {
    if (debouncedSearch && !selectedCoin && debouncedSearch.length > 0) {
      fetchSearchSuggestions(debouncedSearch);
    } else {
      setSearchSuggestions([]);
    }
  }, [debouncedSearch, selectedCoin, fetchSearchSuggestions]);

  // Update filters when debounced search changes (only for text search, not coin selection)
  useEffect(() => {
    if (!selectedCoin) {
      setFilters(prev => ({
        ...prev,
        search: debouncedSearch,
      }));
      setCurrentPage(1); // Reset to first page when search changes
    }
  }, [debouncedSearch, selectedCoin]);

  const getDefaultSort = (status: FilterState["status"]): SortOption => {
    switch (status) {
      case "upcoming":
        return { field: "when", order: "asc" };
      case "active":
        return { field: "till", order: "asc" };
      case "past":
        return { field: "till", order: "desc" };
      default:
        return { field: "when", order: "asc" };
    }
  };

  const [sortOption, setSortOption] = useState<SortOption>(getDefaultSort("upcoming"));
  
  const limit = 12;

  const fetchProjects = useCallback(
    async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      
      // Determine API endpoint based on status filter
      let endpoint = "upcoming"; // Default to fetch all projects
      if (filters.status !== "upcoming") {
        endpoint = filters.status;
      }

      // Build API filters according to the new structure
      const apiFilters: ApiFilters = {};
      
      // Add token sale types filter
      if (filters.tokenSaleTypes.length > 0) {
        apiFilters.tokenSaleTypes = {
          condition: "or",
          data: filters.tokenSaleTypes
        };
      }
      
      // Add launchpads filter
      if (filters.launchpads.length > 0) {
        apiFilters.launchpads = {
          condition: "or", 
          data: filters.launchpads
        };
      }

      // Add categories filter
      if (filters.categories.length > 0) {
        apiFilters.categories = {
          condition: "or", 
          data: filters.categories
        };
      }

      // Add ecosystems filter
      if (filters.ecosystems.length > 0) {
        apiFilters.ecosystems = {
          condition: "or", 
          data: filters.ecosystems
        };
      }

      // Add coins filter (for specific coin selection)
      if (filters.coins && filters.coins.length > 0) {
        apiFilters.coins = filters.coins;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_HELPERS_API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit,
          filters: apiFilters,
          skip,
          locale: "en"
        }),
      });
      
      const data: ApiResponse = await response.json();
      
      const filteredData = data.data;
      
      // Apply client-side search filter only if not using coin filter
      // if (filters.search && (!filters.coins || filters.coins.length === 0)) {
      //   filteredData = filteredData.filter(project =>
      //     project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      //     project.symbol.toLowerCase().includes(filters.search.toLowerCase())
      //   );
      // }

      // Filter out projects with null dates based on status
      // if (filters.status === "upcoming") {
      //   // For upcoming, filter out projects without start date
      //   filteredData = filteredData.filter(project => project.when);
      // } else if (filters.status === "past") {
      //   // For past, filter out projects without end date
      //   filteredData = filteredData.filter(project => project.till);
      // }
      // For active, we allow null dates but handle them in sorting
      
      // Apply sorting
      filteredData.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortOption.field) {
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
            // For null dates, put them at the end
            if (!a.till && !b.till) return 0;
            if (!a.till) return 1;
            if (!b.till) return -1;
            aValue = new Date(a.till).getTime();
            bValue = new Date(b.till).getTime();
            break;
          case "when":
            // For null dates, put them at the end
            if (!a.when && !b.when) return 0;
            if (!a.when) return 1;
            if (!b.when) return -1;
            aValue = new Date(a.when).getTime();
            bValue = new Date(b.when).getTime();
            break;
          default:
            return 0;
        }
        
        if (sortOption.order === "asc") {
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
  }, [
    currentPage, 
    filters.status, 
    filters.tokenSaleTypes, 
    filters.launchpads, 
    filters.categories, 
    filters.ecosystems,
    filters.coins,
    sortOption.field, 
    sortOption.order
  ]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFilterChange = (newFilters: FilterState) => {
    // Update sort option if status changed
    if (newFilters.status !== filters.status) {
      setSortOption(getDefaultSort(newFilters.status));
    }
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    // Clear selected coin when user types new search
    if (selectedCoin) {
      setSelectedCoin(null);
    }
  };

  const handleSearchSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSelectedCoin(suggestion);
    setSearchTerm(suggestion.name); // Show the selected coin name in search input
    setSearchSuggestions([]); // Clear suggestions
    
    // Update filters to use coin filter instead of text search
    setFilters(prev => ({
      ...prev,
      search: "", // Clear text search
      coins: [suggestion.key] // Set specific coin
    }));
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedCoin(null);
    setSearchSuggestions([]);
    setFilters(prev => ({
      ...prev,
      search: "",
      coins: []
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalProjects / limit);

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Token Sales Dashboard</h1>
          <p className="text-[#A3A3A3]">Discover and track ICOs, IDOs, IEOs, and other token sales</p>
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          filters={filters}
          sortOption={sortOption}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          searchTerm={searchTerm}
          searchSuggestions={searchSuggestions}
          onSearchSuggestionSelect={handleSearchSuggestionSelect}
          onClearSearch={handleClearSearch}
          selectedCoin={selectedCoin}
        />

        {/* Stats Bar */}
        <StatsBar
          totalProjects={totalProjects}
          currentProjects={projects.length}
          currentPage={currentPage}
          totalPages={totalPages}
        />

        {/* Projects Grid */}
        <ProjectGrid
          projects={projects}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          status={filters.status}
        />
      </div>
    </div>
  );
}