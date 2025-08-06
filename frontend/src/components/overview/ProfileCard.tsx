"use client";

import { signIn, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { User } from "next-auth";

interface ProfileCardProps {
  netWorth?: number;
  totalPriceChange?: number;
  loadingNetWorth?: boolean;
  connectedWallets?: number;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ netWorth = 0, totalPriceChange = 0, loadingNetWorth = false, connectedWallets = 0 }) => {
    const { data: session, status } = useSession();
    const [eliteFollowers, setEliteFollowers] = useState<number | null>(null);
    const [eliteLoading, setEliteLoading] = useState(false);
    const [eliteError, setEliteError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchEliteFollowers = async () => {
        if (!session || status !== "authenticated") return;
        const user = session.user as User;
        if (!user || !user.twitterId) {
          return;
        }
        setEliteLoading(true);
        setEliteError(null);
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
        const url = `${API_BASE}/elite-curators/elite-followers/${user.twitterId}`;
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
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-3 md:gap-0 w-full min-h-[90px] md:min-h-[100px] shadow-lg">
      {/* Mobile Layout */}
      <div className="flex items-start gap-3 w-full md:hidden">
        {/* Avatar */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={user?.image || undefined}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        {/* Info Block */}
        <div className="flex flex-col flex-1 min-w-0 w-full">
          {/* Name and username (single line, truncate) */}
          <div className="flex items-center min-w-0 w-full">
            <span className="text-base sm:text-lg font-semibold text-white truncate whitespace-nowrap max-w-[65%] sm:max-w-[70%]">{user?.name}</span>
            {user.username && <span className="text-gray-400 text-sm sm:text-base truncate whitespace-nowrap ml-1 max-w-[35%] sm:max-w-[30%]">@{user.username}</span>}
          </div>
          {/* Follows metrics */}
          <div className="flex gap-4 mt-1 text-sm sm:text-base text-[#A3A3A3] w-full">
            {user.followersCount && <span><span className="text-[#A259FF] font-bold">{user.followersCount}</span> 𝕏 Followers</span>}
            {user.username && <span><span className="text-[#A259FF] font-bold">{eliteLoading ? '...' : eliteFollowers !== null ? eliteFollowers : 'N/A'}</span> Elite Curators</span>}
            {!user.username && 
              <span className="text-[#A259FF] font-bold cursor-pointer" onClick={() => {
                signIn("twitter", { callbackUrl: "/dashboard" })
              }}>
                Add X Account
              </span>}
          </div>
          {/* Net Worth and Price Change or Add Wallet Message*/}
          <div className="flex items-center gap-2 mt-2 w-full">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse"></div>
              <span className={`${connectedWallets === 0 ? 'text-gray-400' : 'text-white'} font-bold text-sm sm:text-base`}>Net Worth</span>
            </div>
            {connectedWallets === 0 ? (
              <span className="text-sm text-gray-500 italic">$0.00</span>
            ) : (
              <>
                <div className="relative">
                  <span className={`transition-all duration-500 text-white font-bold text-base sm:text-lg ${loadingNetWorth ? 'opacity-0' : 'opacity-100'}`}>
                    ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {loadingNetWorth && (
                    <div className="absolute inset-0 flex items-center">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  )}
                </div>
                                                  <span className={`text-[8px] font-medium px-1 py-0.5 rounded-full ${totalPriceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                   {totalPriceChange >= 0 ? '+' : ''}{totalPriceChange.toFixed(2)}%
                 </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 aspect-square rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={user?.image || undefined}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        {/* User info */}
        <div>
          <div className="text-base font-semibold text-white"> {user?.name} {user.username && <span className="text-gray-400 text-sm">@{user.username}</span>}</div>
          <div className="flex gap-4 mt-1 text-sm text-[#A3A3A3]">
            {user.followersCount && <span><span className="text-[#A259FF] font-bold">{user.followersCount}</span> 𝕏 Followers</span>}
            {user.username && <span><span className="text-[#A259FF] font-bold">{eliteLoading ? '...' : eliteFollowers !== null ? eliteFollowers : 'N/A'}</span> Elite Curators</span>}
            {!user.username && 
              <span className="text-[#A259FF] font-bold cursor-pointer" onClick={() => {
                signIn("twitter", { callbackUrl: "/dashboard" })
              }}>
                Add 𝕏 Account
              </span>}
              {!user.email && <span className="text-[#A259FF] font-bold cursor-pointer" onClick={() => {
                signIn("google", { callbackUrl: "/dashboard" })
              }}>
                Add Google Account
              </span>}
          </div>
        </div>
      </div>
      {/* Desktop Net Worth */}
      <div className="hidden md:flex md:text-right flex-col items-end">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse"></div>
                             <span className={`${connectedWallets === 0 ? 'text-gray-400' : 'text-white'} font-bold text-sm`}>Net Worth</span>
            </div>
          </div>
          {connectedWallets === 0 ? (
                         <span className="text-sm text-gray-500 italic">$0.00</span>
          ) : (
            <div className="flex items-center gap-3 justify-end">
              <div className="relative">
                <span className={`transition-all duration-500 text-white font-bold text-lg ${loadingNetWorth ? 'opacity-0' : 'opacity-100'}`}>
                  ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {loadingNetWorth && (
                  <div className="absolute inset-0 flex items-center justify-end">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                                                                   <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${totalPriceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                     {totalPriceChange >= 0 ? '+' : ''}{totalPriceChange.toFixed(2)}%
                   </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;