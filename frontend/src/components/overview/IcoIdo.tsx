"use client";
import Link from "next/link";
import React, { useState } from "react";
import { useEffect } from "react";
import {FiExternalLink} from "react-icons/fi";

interface UpcomingIDO {
  image: string;
  name: string;
  key: string;
  symbol: string;
  type: string;
  initialCap: string;
  when: string;
  till: string;
  launchpads: Array<{
    key: string;
    name: string;
    image: string;
  }>;
}

const IcoIdo = () => {
  const [icoIdoData, setIcoIdoData] = useState<UpcomingIDO[] | []>([]);
  const [selectedFilter, setSelectedFilter] = useState<'upcoming' | 'active' | 'past'>('upcoming');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to get relative date based on filter
  const getRelativeDate = (dateString: string, filterType: string) => {
    if (!dateString || dateString === "TBA") return "TBA";
    
    const targetDate = new Date(dateString);
    const today = new Date();
    
    // Reset time to midnight for accurate day comparison
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = targetMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = targetDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Different display logic based on filter type
    if (filterType === 'active') {
      if (diffDays === 0) {
        return `${formattedDate}, Ends today`;
      } else if (diffDays === 1) {
        return `${formattedDate}, Ends tomorrow`;
      } else if (diffDays > 1) {
        return `${formattedDate}, Ends in ${diffDays} days`;
      } else if (diffDays === -1) {
        return `${formattedDate}, Ended yesterday`;
      } else {
        return `${formattedDate}, Ended ${Math.abs(diffDays)} days ago`;
      }
    } else if (filterType === 'past') {
      if (diffDays === 0) {
        return `${formattedDate}, Ended today`;
      } else if (diffDays === -1) {
        return `${formattedDate}, Ended yesterday`;
      } else {
        return `${formattedDate}, Ended ${Math.abs(diffDays)} days ago`;
      }
    } else {
      // For 'upcoming' filter, use the original format
      if (diffDays === 0) {
        return `${formattedDate}, Today`;
      } else if (diffDays === 1) {
        return `${formattedDate}, Tomorrow`;
      } else if (diffDays === -1) {
        return `${formattedDate}, Yesterday`;
      } else if (diffDays > 1) {
        return `${formattedDate}, ${diffDays} days left`;
      } else {
        return `${formattedDate}, ${Math.abs(diffDays)} days ago`;
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    // Simulate fetching data from an API
    const fetchIcoIdoData = async() => {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_HELPERS_API_URL}/${selectedFilter}`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      // console.log(data);

      setIcoIdoData(data.data);
      setLoading(false);
    };
    fetchIcoIdoData();
  }, [selectedFilter])
  return (
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[180px] max-h-80">
      {/* Preloader overlay */}
      <div className={`absolute inset-0 flex items-center justify-center bg-[#181A20] transition-opacity duration-500 z-20 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <span className="text-purple-400 animate-pulse text-5xl">.....</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <Link href="/dashboard/token-sales" className="flex items-center gap-2 text-[#A3A3A3] text-xs font-semibold cursor-pointer hover:text-gray-300 hover:underline transition-colors">
          <div className="text-lg font-semibold text-white">ICO / IDO</div>
          <FiExternalLink />
        </Link>
        <div className="relative dropdown-container">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-[#A3A3A3] text-xs bg-[#23262F] px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-[#2A2E37] transition-colors"
          >
            {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} 
            <span className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 bg-[#23262F] border border-[#3A3E47] rounded-lg shadow-lg z-10 min-w-[100px]">
              {(['upcoming', 'active', 'past'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedFilter(option);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2A2E37] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedFilter === option ? 'text-[#A259FF]' : 'text-[#A3A3A3]'
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent">
        {!loading && (
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="text-[#A3A3A3] border-b border-[#23262F]">
                <th className="py-2 px-2 font-medium">When</th>
                <th className="py-2 px-2 font-medium">Project</th>
                <th className="py-2 px-2 font-medium">Type</th>
                <th className="py-2 px-2 font-medium">Launchpad</th>
              </tr>
            </thead>
            <tbody className="overflow-hidden">
              {icoIdoData.length>0 && icoIdoData.map((item, idx) => (
                <tr key={idx} className="border-b border-[#23262F] last:border-0 hover:bg-[#23262F]/40 transition">
                  <td className="py-2 px-2 text-white text-xs">
                    {getRelativeDate(
                      selectedFilter === 'upcoming' ? item.when : item.till, 
                      selectedFilter
                    )}
                  </td>
                  <td className="py-2 px-2 flex items-center gap-2">
                    <img src={item.image} alt={item.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <div className="text-white font-medium">{item.name}</div>
                      <div className="text-[#A3A3A3] text-xs">{item.symbol}</div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-white">{item.type}</td>
                  <td className="py-2 px-2 text-white">{item.launchpads[0]?.name +` ${item.launchpads.length>2 ? `+${item.launchpads.length-1}` :''}` || "TBA"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default IcoIdo;
