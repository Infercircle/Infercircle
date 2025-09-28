"use client";

import React from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

type ProjectStatus = "tokensLive" | "active" | "past" | "potentialAirdrops";

interface TgeProjectRow {
  project: string;
  backers: string[];
  infoPlatforms: string[];
  amountRaised: string; // keep as formatted string for now (e.g. $15M)
  status: ProjectStatus;
}

const MOCK_ROWS: TgeProjectRow[] = [
  {
    project: "Project Atlas",
    backers: ["a16z", "Paradigm", "Dragonfly", "Sequoia", "Hashed"],
    infoPlatforms: ["Kaito", "Cookie3", "Wallchain", "Breadcrumb", "Alphabot", "Lurky"],
    amountRaised: "$40M",
    status: "tokensLive",
  },
  {
    project: "Neon Forge",
    backers: ["Sequoia", "Hashed", "Delphi", "Shima Capital"],
    infoPlatforms: ["Breadcrumb", "Alphabot", "Kaito", "Lurky"],
    amountRaised: "$12.5M",
    status: "active",
  },
  {
    project: "Orbit Labs",
    backers: ["Dragonfly", "a16z", "Paradigm", "Binance Labs"],
    infoPlatforms: ["Lurky", "Wallchain", "Kaito", "Cookie3"],
    amountRaised: "$3.2M",
    status: "potentialAirdrops",
  },
  {
    project: "Sierra X",
    backers: ["Delphi", "Binance Labs", "Sequoia", "Dragonfly", "Hashed"],
    infoPlatforms: ["Kaito", "Lurky", "Breadcrumb", "Cookie3"],
    amountRaised: "$22M",
    status: "past",
  },
  {
    project: "Gamma Mesh",
    backers: ["Shima Capital", "a16z", "Paradigm", "Delphi"],
    infoPlatforms: ["Cookie3", "Wallchain", "Alphabot", "Breadcrumb"],
    amountRaised: "$6.8M",
    status: "active",
  },
  {
    project: "Helios Net",
    backers: ["a16z", "Sequoia", "Dragonfly", "Delphi", "Shima Capital", "Paradigm"],
    infoPlatforms: ["Kaito", "Cookie3", "Wallchain", "Breadcrumb", "Alphabot", "Lurky"],
    amountRaised: "$15M",
    status: "tokensLive",
  },
];

const MOCK_IMAGES = {
  projects: {
    "Project Atlas": "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=40&h=40&fit=crop&crop=center",
    "Neon Forge": "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=40&h=40&fit=crop&crop=center",
    "Orbit Labs": "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=40&h=40&fit=crop&crop=center",
    "Sierra X": "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=40&h=40&fit=crop&crop=center",
    "Gamma Mesh": "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=40&h=40&fit=crop&crop=center",
    "Helios Net": "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=40&h=40&fit=crop&crop=center",
  },
  backers: {
    "a16z": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
    "Paradigm": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
    "Sequoia": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
    "Hashed": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
    "Dragonfly": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
    "Delphi": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
    "Binance Labs": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
    "Shima Capital": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center",
  },
  platforms: {
    "Kaito": "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=20&h=20&fit=crop&crop=center",
    "Cookie3": "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=20&h=20&fit=crop&crop=center",
    "Wallchain": "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=20&h=20&fit=crop&crop=center",
    "Breadcrumb": "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=20&h=20&fit=crop&crop=center",
    "Alphabot": "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=20&h=20&fit=crop&crop=center",
    "Lurky": "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=20&h=20&fit=crop&crop=center",
  },
};

const STATUS_OPTIONS: { key: ProjectStatus; label: string }[] = [
  { key: "tokensLive", label: "Tokens Live" },
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
  { key: "potentialAirdrops", label: "Potential Airdrops" },
];

export default function TGEPage() {
  const [statusFilters, setStatusFilters] = React.useState<string[]>(["all"]);
  const [platformFilters, setPlatformFilters] = React.useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const indexHeaderRef = React.useRef<HTMLTableCellElement | null>(null);
  const [firstColWidth, setFirstColWidth] = React.useState(0);

  // Modal state for expanded lists (backers/platforms)
  const [isListModalOpen, setIsListModalOpen] = React.useState(false);
  const [listModalTitle, setListModalTitle] = React.useState<string>("");
  const [listModalType, setListModalType] = React.useState<"backer"|"platform">("backer");
  const [listModalItems, setListModalItems] = React.useState<string[]>([]);

  const openListModal = (title: string, type: "backer"|"platform", items: string[]) => {
    setListModalTitle(title);
    setListModalType(type);
    setListModalItems(items);
    setIsListModalOpen(true);
  };

  // Duplicate mock data 3x for a longer table preview
  const ALL_ROWS = React.useMemo<TgeProjectRow[]>(
    () => [...MOCK_ROWS, ...MOCK_ROWS, ...MOCK_ROWS],
    []
  );

  const filtered = React.useMemo(() => {
    let base = ALL_ROWS;
    
    // Filter by status
    if (!statusFilters.includes("all")) {
      base = base.filter((row) => statusFilters.includes(row.status));
    }
    
    // Filter by platforms
    if (platformFilters.length > 0) {
      base = base.filter((row) => row.infoPlatforms.some((p) => platformFilters.includes(p)));
    }
    
    return base;
  }, [statusFilters, platformFilters, ALL_ROWS]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (!statusFilters.includes("all")) count++;
    if (platformFilters.length > 0) count++;
    return count;
  };

  const handleStatusToggle = (status: string) => {
    if (status === "all") {
      setStatusFilters(["all"]);
    } else {
      const newFilters = statusFilters.includes(status)
        ? statusFilters.filter(s => s !== status && s !== "all")
        : [...statusFilters.filter(s => s !== "all"), status];
      
      if (newFilters.length === 0) {
        setStatusFilters(["all"]);
      } else {
        setStatusFilters(newFilters);
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Measure the index column width so we can offset the Project column for sticky positioning
  React.useLayoutEffect(() => {
    const measure = () => {
      if (indexHeaderRef.current) {
        const rect = indexHeaderRef.current.getBoundingClientRect();
        setFirstColWidth(Math.ceil(rect.width));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const getProjectImage = (name: string) => {
    const imageUrl = (MOCK_IMAGES.projects as Record<string, string>)[name] || "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=40&h=40&fit=crop&crop=center";
    return (
      <img 
        src={imageUrl} 
        alt={name}
        className="w-8 h-8 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://images.unsplash.com/photo-1639322537504-6427a16b0a28?w=40&h=40&fit=crop&crop=center";
        }}
      />
    );
  };

  const getBackerImage = (name: string) => {
    const imageUrl = (MOCK_IMAGES.backers as Record<string, string>)[name] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center";
    return (
      <img 
        src={imageUrl} 
        alt={name}
        className="w-4 h-4 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=20&h=20&fit=crop&crop=center";
        }}
      />
    );
  };

  const getPlatformImage = (name: string) => {
    const imageUrl = (MOCK_IMAGES.platforms as Record<string, string>)[name] || "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=20&h=20&fit=crop&crop=center";
    return (
      <img 
        src={imageUrl} 
        alt={name}
        className="w-4 h-4 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://images.unsplash.com/photo-1639322537228-f912e9b8a9dd?w=20&h=20&fit=crop&crop=center";
        }}
      />
    );
  };

  const allPlatforms = React.useMemo(() => {
    const set = new Set<string>();
    ALL_ROWS.forEach(r => r.infoPlatforms.forEach(p => set.add(p)));
    return Array.from(set).sort();
  }, [ALL_ROWS]);

  const getStatusBadgeClass = (status: ProjectStatus, compact: boolean = false, isSelected: boolean = false) => {
    const base = compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm";
    // Use solid, opaque colors for selected state; soft translucent for unselected
    switch (status) {
      case "tokensLive":
        return isSelected
          ? `${base} rounded bg-emerald-600 text-white`
          : `${base} rounded bg-emerald-500/20 text-emerald-300`;
      case "active":
        return isSelected
          ? `${base} rounded bg-blue-600 text-white`
          : `${base} rounded bg-blue-500/20 text-blue-300`;
      case "past":
        return isSelected
          ? `${base} rounded bg-zinc-600 text-white`
          : `${base} rounded bg-zinc-500/20 text-zinc-300`;
      default:
        return isSelected
          ? `${base} rounded bg-amber-600 text-white`
          : `${base} rounded bg-amber-500/20 text-amber-300`;
    }
  };

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Token Generation Events</h1>
          <div className="flex items-center gap-2 relative" ref={filterRef}>
            <button
              className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 group ${
                statusFilters.includes("all") && getActiveFilterCount() === 0
                  ? "bg-purple-500/60 text-white border border-purple-400/30"
                  : "bg-purple-500/20 text-gray-300 border border-purple-400/30 hover:bg-purple-500/60 hover:text-gray-100"
              }`}
              onClick={() => handleStatusToggle("all")}
            >
              <span className="text-sm font-medium">All</span>
            </button>
            <button
              className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 group ${
                isFilterOpen || getActiveFilterCount() > 0
                  ? "bg-purple-500/60 text-white border border-purple-400/30"
                  : "bg-purple-500/20 text-gray-300 border border-purple-400/30 hover:bg-purple-500/60 hover:text-gray-100"
              }`}
              onClick={() => setIsFilterOpen((p) => !p)}
            >
              <span className="text-sm font-medium">Filters</span>
              <span className="bg-purple-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                {getActiveFilterCount()}
              </span>
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 top-10 z-40 w-80 rounded-lg bg-[#151820] p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">Filters</h3>
                  {getActiveFilterCount() > 0 && (
                    <button
                      onClick={() => {
                        setStatusFilters(["all"]);
                        setPlatformFilters([]);
                      }}
                      className="text-purple-400 hover:text-purple-300 text-sm cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-3">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = statusFilters.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          className={`${getStatusBadgeClass(opt.key as ProjectStatus, true, isSelected)} border border-transparent`}
                          onClick={() => handleStatusToggle(opt.key)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Platforms</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {allPlatforms.map((p) => {
                      const selected = platformFilters.includes(p);
                      return (
                        <label key={p} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setPlatformFilters((prev) =>
                                prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                              )
                            }
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                            selected
                              ? 'border-purple-400 bg-purple-400'
                              : 'border-gray-400'
                          }`}>
                            {selected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getPlatformImage(p)}
                            <span className="text-sm text-gray-300">{p}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto border-y border-[#2a2e35] rounded-t-lg">
          <table className="min-w-[1280px] text-left text-sm">
            <thead className="bg-[#151820] text-[#A3A3A3]">
              <tr>
                <th ref={indexHeaderRef} className="px-4 py-3 font-semibold sticky left-0 z-20 bg-[#151820]">#</th>
                <th className="px-4 py-3 font-semibold sticky z-10 bg-[#151820]" style={{ left: firstColWidth }}>Projects</th>
                <th className="px-4 py-3 font-semibold">Backers (VCs)</th>
                <th className="px-4 py-3 font-semibold">InfoFi Platform</th>
                <th className="px-4 py-3 font-semibold">Amount Raised</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={`${row.project}-${idx}`} className="group border-t border-[#2a2e35] bg-black hover:bg-[#151820]">
                  <td className="px-4 py-3 text-[#A3A3A3] whitespace-nowrap sticky left-0 z-10 bg-black group-hover:bg-[#151820]">
                    <span className="px-2 py-1 rounded bg-[rgba(21,24,32,0.6)] text-xs font-medium">{idx + 1}</span>
                  </td>
                   <td className="px-4 py-3 text-white whitespace-nowrap sticky z-10 bg-black group-hover:bg-[#151820]" style={{ left: firstColWidth }}>
                     <div className="flex items-center gap-2.5">
                       {getProjectImage(row.project)}
                       <Link 
                         href={`/dashboard/tge/${row.project.toLowerCase().replace(/\s+/g, '-')}`}
                         className="text-sm font-bold transition-colors hover:text-purple-300 cursor-pointer"
                       >
                         {row.project}
                       </Link>
                     </div>
                   </td>
                  <td className="px-4 py-3 text-[#ffffffcc] font-medium">
                    <div className="flex flex-wrap gap-1.5">
                      {row.backers.slice(0,2).map((b) => (
                        <span key={b} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(71,79,92,0.35)] text-xs">
                          {getBackerImage(b)}
                          {b}
                        </span>
                      ))}
                      {row.backers.length > 2 && (
                        <button
                          className="px-2 py-1 rounded bg-[rgba(71,79,92,0.35)] text-xs text-white hover:bg-[rgba(71,79,92,0.5)]"
                          onClick={() => openListModal(`${row.project} · Backers`, "backer", row.backers)}
                        >
                          +{row.backers.length - 2}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#ffffffcc] font-medium">
                    <div className="flex flex-wrap gap-1.5">
                      {row.infoPlatforms.slice(0,3).map((p) => (
                        <span key={p} className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(42,46,53,0.35)] text-xs">
                          {getPlatformImage(p)}
                          {p}
                        </span>
                      ))}
                      {row.infoPlatforms.length > 3 && (
                        <button
                          className="px-2 py-1 rounded bg-[rgba(42,46,53,0.35)] text-xs text-white hover:bg-[rgba(42,46,53,0.5)]"
                          onClick={() => openListModal(`${row.project} · Info Platforms`, "platform", row.infoPlatforms)}
                        >
                          +{row.infoPlatforms.length - 3}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white whitespace-nowrap text-sm font-medium">{row.amountRaised}</td>
                  <td className="px-4 py-3 font-medium">
                    <span className={getStatusBadgeClass(row.status, true)}>
                      {STATUS_OPTIONS.find((s) => s.key === row.status)?.label}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-[#A3A3A3]" colSpan={6}>No results</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Expanded list modal */}
      <Modal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)}>
        <div className="space-y-3">
          <div className="text-lg font-semibold text-white">{listModalTitle}</div>
          <div className="flex flex-wrap gap-2">
            {listModalItems.map((item) => (
              <span key={item} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${listModalType === 'backer' ? 'bg-[rgba(71,79,92,0.35)]' : 'bg-[rgba(42,46,53,0.35)]'} text-white`}>
                {listModalType === 'backer' ? getBackerImage(item) : getPlatformImage(item)}
                {item}
              </span>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

