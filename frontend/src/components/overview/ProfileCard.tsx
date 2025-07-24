"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { TwitterUser } from "@/lib/types";

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
        // Get session and status at mount time
        const { data: session, status } = useSession();
        if (!session || status !== "authenticated") return;
        const user = session.user as TwitterUser;
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

    const user = session.user as TwitterUser;

  return (
    <div className="bg-[#181A20] border border-[#23272b] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-lg w-full min-h-[120px]">
      {/* Left: Avatar and user info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 aspect-square rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={user?.image ||"https://pbs.twimg.com/profile_images/1875319786856427520/727-k6ov.jpg"}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        {/* User info */}
        <div>
          <div className="text-lg font-semibold text-white"> {user?.name} <span className="text-gray-400 text-base">@{user.username}</span></div>
          <div className="flex gap-4 mt-1 text-sm text-[#A3A3A3]">
            <span><span className="text-[#A259FF] font-bold">{user.followersCount}</span> 𝕏 Followers</span>
            <span>
              <span className="text-[#A259FF] font-bold">
                {eliteLoading ? '...' : eliteFollowers !== null ? eliteFollowers : 'N/A'}
              </span> Elite Curators
            </span>
          </div>
        </div>
      </div>
      {/* Right: Net Worth */}
      <div className="mt-4 md:mt-0 md:text-right flex flex-col items-end">
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
