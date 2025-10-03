"use client";

import { signIn, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { User } from "next-auth";
import { updateUserFollowersCount } from "@/actions/server";
import { FiRefreshCw } from "react-icons/fi";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { updateUserImageInDB } from "@/actions/server";

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
    const [eliteRefreshing, setEliteRefreshing] = useState(false);
    const [eliteError, setEliteError] = useState<string | null>(null);
    const [hasBeenProcessed, setHasBeenProcessed] = useState<boolean | null>(null);
    const [followersCount, setFollowersCount] = useState<number | null>(session?.user.followersCount || null);
    const [image, setImage] = useState<string>(session?.user.image || "");
  
    // Fetch elite curators using original method for now
         // Check if user has been processed and fetch elite curators
    useEffect(() => {
       const checkStatusAndFetch = async () => {
        if (!session || status !== "authenticated") return;
        const user = session.user as User;
         if (!user || !user.id) {
           return;
         }
         
         // Skip fetching if user doesn't have Twitter account
         if (!user.twitterId) {
           console.log('User has no Twitter ID, skipping elite curators fetch');
          return;
        }
         
         // Check session storage first to avoid unnecessary API calls
         const sessionKey = `elite_processed_${user.id}`;
         const countKey = `elite_count_${user.id}`;
         const refreshKey = `elite_refreshing_${user.id}`;
         const sessionProcessed = sessionStorage.getItem(sessionKey);
         const cachedCount = sessionStorage.getItem(countKey);
         const isRefreshing = sessionStorage.getItem(refreshKey);
         
         // Set refresh state if it was stored
         if (isRefreshing) {
           setEliteRefreshing(true);
         }
         
        setEliteLoading(true);
        setEliteError(null);
         
         try {
           // If we know user is processed in this session, use cached count
           if (sessionProcessed === 'true' && cachedCount !== null) {
             setHasBeenProcessed(true);
             setEliteFollowers(parseInt(cachedCount));
             setEliteLoading(false);
             return;
           }
           
           // If we know user is processed but no cached count, fetch once
           if (sessionProcessed === 'true') {
             setHasBeenProcessed(true);
             // Fetch elite curators once and cache
             const res = await fetch(`/api/elite-curators?user_id=${user.id}`);
             const data = await res.json();
             if (res.ok) {
               setEliteFollowers(data.count);
               sessionStorage.setItem(countKey, data.count.toString());
             } else {
               setEliteError(data.error || 'Error fetching elite curators');
             }
           } else {
             // Check if user has been processed
             const statusRes = await fetch(`/api/elite-curators/status?user_id=${user.id}`);
             const statusData = await statusRes.json();
             
             if (statusRes.ok) {
               setHasBeenProcessed(statusData.hasBeenProcessed);
               
                                             // Always fetch elite curators count (will be 0 if not processed yet)
             const res = await fetch(`/api/elite-curators?user_id=${user.id}`);
             const data = await res.json();
             if (res.ok) {
               setEliteFollowers(data.count);
               // Cache the count
               sessionStorage.setItem(countKey, data.count.toString());
             } else {
               setEliteError(data.error || 'Error fetching elite curators');
             }
             
             // Mark as processed in session storage if user has been processed
             if (statusData.hasBeenProcessed) {
               sessionStorage.setItem(sessionKey, 'true');
             }
             } else {
               setEliteError(statusData.error || 'Error checking status');
             }
           }
        } catch (e: any) {
          setEliteFollowers(null);
           setEliteError(e.message || 'Error checking status');
        } finally {
          setEliteLoading(false);
        }
      };
       
               checkStatusAndFetch();
      }, [session, status]);

      // Listen for refresh completion events and background processing completion
      useEffect(() => {
        if (!session || status !== "authenticated") return;
        const user = session.user as User;
        if (!user || !user.id) return;

        const handleRefreshComplete = (event: CustomEvent) => {
          if (event.detail.userId === user.id) {
            console.log('Received refresh complete event, stopping spinner...');
            setEliteRefreshing(false);
            const refreshKey = `elite_refreshing_${user.id}`;
            sessionStorage.removeItem(refreshKey);
            
            // Update the count after refresh
            const countKey = `elite_count_${user.id}`;
            sessionStorage.removeItem(countKey); // Clear cache to force refetch
          }
        };

        const handleBackgroundComplete = (event: CustomEvent) => {
          if (event.detail.userId === user.id) {
            console.log('Received background processing complete event, updating count...');
            // Update the count after background processing
            const countKey = `elite_count_${user.id}`;
            sessionStorage.removeItem(countKey); // Clear cache to force refetch
            
            // Refetch the count
            fetch(`/api/elite-curators?user_id=${user.id}`)
              .then(res => res.json())
              .then(data => {
                if (data.count !== undefined) {
                  setEliteFollowers(data.count);
                  sessionStorage.setItem(countKey, data.count.toString());
                }
              })
              .catch(error => console.error('Error updating count after background processing:', error));
          }
        };

        window.addEventListener('eliteRefreshComplete', handleRefreshComplete as EventListener);
        window.addEventListener('eliteBackgroundComplete', handleBackgroundComplete as EventListener);

        return () => {
          window.removeEventListener('eliteRefreshComplete', handleRefreshComplete as EventListener);
          window.removeEventListener('eliteBackgroundComplete', handleBackgroundComplete as EventListener);
        };
      }, [session, status]);



    // Manual refresh function
    const handleRefreshEliteCurators = async () => {
      if (!session || status !== "authenticated") return;
      const user = session.user as User;
      if (!user || !user.id) {
        return;
      }
      
      setEliteRefreshing(true);
      // Store refresh state in session storage
      const refreshKey = `elite_refreshing_${user.id}`;
      sessionStorage.setItem(refreshKey, 'true');
      
      try {
        console.log('Starting elite curators refresh...');
        const res = await fetch('/api/elite-curators/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        });
        const data = await res.json();
        console.log('Refresh response:', data);
        
        if (res.ok) {
          setEliteFollowers(data.count);
          // Update cached count
          const countKey = `elite_count_${user.id}`;
          sessionStorage.setItem(countKey, data.count.toString());
          // Show success message if new curators found
          if (data.newEliteCuratorsFound > 0) {
            console.log(`Found ${data.newEliteCuratorsFound} new elite curators!`);
          }
        } else {
          setEliteError(data.error || 'Error refreshing elite curators');
        }
      } catch (e: any) {
        console.error('Refresh error:', e);
        setEliteError(e.message || 'Error refreshing elite curators');
      } finally {
        console.log('Refresh completed, stopping spinner...');
        setEliteRefreshing(false);
        // Clear refresh state from session storage immediately
        sessionStorage.removeItem(refreshKey);
        
        // Also dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('eliteRefreshComplete', { 
          detail: { userId: user.id } 
        }));
      }
    };


    const user = (session)?.user as User;

    useEffect(() => {
      if(user){
        fetch(`${process.env.NEXT_PUBLIC_HELPERS_API_URL}/twitter/user`,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: user.username }),
        }).then((data) => data.json())
          .then((data)=>{
            if(user.id && data.profile_image_url && image != data.profile_image_url){
              setImage(data.profile_image_url);
              updateUserImageInDB(data.profile_image_url, user.id);
            }
          });
      }

      if (user && user.followersCount) {
        fetch(`${process.env.NEXT_PUBLIC_HELPERS_API_URL}/twitter/user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: user.username }),
        }).then((res) => res.json())
          .then((data) => {
            if (data && data['followers_count'] && data['followers_count'] != user.followersCount) {
              setFollowersCount(data['followers_count']);
              updateUserFollowersCount(user.id as string, data['followers_count']).catch((error) => {
                console.error("Error updating user followers count in database:", error);
              });
            } else {
              setFollowersCount(user.followersCount || null);
            }
          })
          .catch((error) => {
            console.error("Error fetching followers count:", error);
            setFollowersCount(user.followersCount || null);
          });
      }
    }, [user]);

  return (
    <div className="bg-[rgba(24,26,32,1)] backdrop-blur-xl border border-[#23272b] rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-3 md:gap-0 w-full min-h-[90px] md:min-h-[100px] shadow-lg">
                {/* Mobile Layout */}
      <div className="flex items-start gap-3 w-full md:hidden">
        {/* Avatar */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <img
            src={image}
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
            {followersCount && <span><span className="text-[#A259FF] font-bold">{followersCount}</span> 𝕏 Followers</span>}
            {user.username && (
              <span className="flex items-center gap-1">
                <span className="text-[#A259FF] font-bold">
                  {eliteLoading ? '...' : 
                   eliteError ? 'N/A' :
                   eliteFollowers !== null ? eliteFollowers : '...'}
                </span>
                <span>Elite Curators</span>
                <Tippy
                  content={hasBeenProcessed === false ? "Processing in background..." : "Update elite curators"}
                  placement="top"
                  arrow={true}
                  theme="dark"
                >
                  <button
                    onClick={handleRefreshEliteCurators}
                    disabled={eliteRefreshing || hasBeenProcessed === false}
                    className="p-1 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <FiRefreshCw 
                      size={12} 
                      className={`text-gray-400 ${eliteRefreshing ? 'animate-spin' : ''}`}
                    />
                  </button>
                </Tippy>
              </span>
            )}
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
            src={image}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        {/* User info */}
        <div>
          <div className="text-base font-semibold text-white"> {user?.name} {user.username && <span className="text-gray-400 text-sm">@{user.username}</span>}</div>
          <div className="flex gap-4 mt-1 text-sm text-[#A3A3A3]">
            {followersCount && <span><span className="text-[#A259FF] font-bold">{followersCount}</span> 𝕏 Followers</span>}
            {user.username && (
              <span className="flex items-center gap-1">
                <span className="text-[#A259FF] font-bold">
                  {eliteLoading ? '...' : 
                   eliteError ? 'N/A' :
                   eliteFollowers !== null ? eliteFollowers : '...'}
                </span>
                <span>Elite Curators</span>
                <Tippy
                  content={hasBeenProcessed === false ? "Processing in background..." : "Update elite curators"}
                  placement="top"
                  arrow={true}
                  theme="dark"
                >
                  <button
                    onClick={handleRefreshEliteCurators}
                    disabled={eliteRefreshing || hasBeenProcessed === false}
                    className="p-1 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <FiRefreshCw 
                      size={12} 
                      className={`text-gray-400 ${eliteRefreshing ? 'animate-spin' : ''}`}
                    />
                  </button>
                </Tippy>
              </span>
            )}
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