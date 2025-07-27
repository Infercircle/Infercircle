"use client";

import { signIn, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { User } from "@/lib/types";

interface ProfileCardProps {
  netWorth?: number;
  totalPriceChange?: number;
  loadingNetWorth?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ netWorth = 0, totalPriceChange = 0, loadingNetWorth = false }) => {
    const { data: session, status } = useSession();
    const [eliteFollowers, setEliteFollowers] = useState<number | null>(null);
    const [eliteLoading, setEliteLoading] = useState(false);
    const [eliteError, setEliteError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchEliteFollowers = async () => {
        if (!session || status !== "authenticated") return;
        const user = session.user as User;
        if (!user || !user.id) {
          return;
        }
        setEliteLoading(true);
        setEliteError(null);
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
        const url = `${API_BASE}/elite-curators/elite-followers/${user.id}`;
        try {
          const res = await fetch(url);
          let data: any = {};
          try {
            data = await res.json();
          } catch {}
          if (res.ok && typeof data.eliteFollowers === 'number') {
            setEliteFollowers(data.eliteFollowers);
          } else {
            setEliteFollowers(null);
            setEliteError(data.error || 'No data');
          }
        } catch (e: any) {
          setEliteFollowers(null);
          setEliteError(e.message || 'Error fetching');
        } finally {
          setEliteLoading(false);
        }
      };
      fetchEliteFollowers();
    }, []);

    if(!session || status !== "authenticated") {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Please sign in to view your dashboard.</p>
        </div>
      );
    }

    const user = session.user as User;

  return (
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-3 md:gap-0 w-full min-h-[100px] md:min-h-[120px] shadow-lg">
      {/* Mobile Layout */}
      <div className="flex items-start gap-3 w-full md:hidden">
        {/* Avatar */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={user?.image}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        {/* Info Block */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Name and username (single line, truncate) */}
          <div className="flex items-center min-w-0">
            <span className="text-base sm:text-lg font-semibold text-white truncate whitespace-nowrap max-w-[60%]">{user?.name}</span>
            {user.username && <span className="text-gray-400 text-xs sm:text-sm truncate whitespace-nowrap ml-1 max-w-[40%]">@{user.username}</span>}
          </div>
          {/* Follows metrics */}
          <div className="flex gap-4 mt-1 text-xs sm:text-sm text-[#A3A3A3]">
            {user.followersCount && <span><span className="text-[#A259FF] font-bold">{user.followersCount}</span> 𝕏 Followers</span>}
            {user.username && <span><span className="text-[#A259FF] font-bold">{eliteLoading ? '...' : eliteFollowers !== null ? eliteFollowers : 'N/A'}</span> Elite Curators</span>}
            {!user.username && 
              <span className="text-[#A259FF] font-bold cursor-pointer" onClick={() => {
                signIn("twitter", { callbackUrl: "/dashboard" })
              }}>
                Add X Account
              </span>}
          </div>
          {/* Net Worth and Price Change */}
          <div className="flex gap-3 items-center mt-2">
            <div className="relative">
              <span className="text-gray-400 text-xs sm:text-sm mr-1">Net Worth</span>
              <span className={`transition-opacity duration-500 text-white font-medium ${loadingNetWorth ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`absolute left-0 top-0 flex items-center transition-opacity duration-500 ${loadingNetWorth ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <span className="text-purple-400 animate-pulse">.....</span>
              </span>
            </div>
            <span className={`text-xs font-bold ${totalPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
              title="Total 24h Price Change">
              {totalPriceChange >= 0 ? '+' : ''}{totalPriceChange.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 aspect-square rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={user?.image}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        {/* User info */}
        <div>
          <div className="text-lg font-semibold text-white"> {user?.name} {user.username && <span className="text-gray-400 text-base">@{user.username}</span>}</div>
          <div className="flex gap-4 mt-1 text-sm text-[#A3A3A3]">
            {user.followersCount && <span><span className="text-[#A259FF] font-bold">{user.followersCount}</span> 𝕏 Followers</span>}
            {user.username && <span><span className="text-[#A259FF] font-bold">{eliteLoading ? '...' : eliteFollowers !== null ? eliteFollowers : 'N/A'}</span> Elite Curators</span>}
            {!user.username && 
              <span className="text-[#A259FF] font-bold cursor-pointer" onClick={() => {
                signIn("twitter", { callbackUrl: "/dashboard" })
              }}>
                Add 𝕏 Account
              </span>}
          </div>
        </div>
      </div>
      {/* Desktop Net Worth */}
      <div className="hidden md:flex md:text-right flex-col items-end">
        <div className="text-gray-400 text-sm">Net Worth</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`transition-opacity duration-500 ${loadingNetWorth ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${loadingNetWorth ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
              <span className="text-purple-400 animate-pulse">.....</span>
            </div>
          </div>
          <span className={`text-xs font-bold ${totalPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
            title="Total 24h Price Change">
            {totalPriceChange >= 0 ? '+' : ''}{totalPriceChange.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
