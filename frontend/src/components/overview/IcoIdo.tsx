"use client";
import React, { useState } from "react";
import { useEffect } from "react";

interface UpcomingIDO {
  image: string;
  name: string;
  key: string;
  symbol: string;
  type: string;
  initialCap: string;
  when: string;
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_HELPERS_API_URL}/${selectedFilter}`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      // console.log(data);

      setIcoIdoData(data.data);
    };
    fetchIcoIdoData();
  }, [selectedFilter])
  return (
    <div className="bg-[#181A20] border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[180px] max-h-80">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-white">ICO / IDO</div>
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
        <table className="min-w-full text-xs text-left">
          <thead>
            <tr className="text-[#A3A3A3] border-b border-[#23262F]">
              <th className="py-2 px-2 font-medium">Date</th>
              <th className="py-2 px-2 font-medium">Project</th>
              <th className="py-2 px-2 font-medium">Type</th>
              <th className="py-2 px-2 font-medium">Launchpad</th>
            </tr>
          </thead>
          <tbody className="overflow-hidden">
            {icoIdoData.length>0 && icoIdoData.map((item, idx) => (
              <tr key={idx} className="border-b border-[#23262F] last:border-0 hover:bg-[#23262F]/40 transition">
                <td className="py-2 px-2 text-white">{item.when || "TBA"}</td>
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
      </div>
    </div>
  );
};

export default IcoIdo;
