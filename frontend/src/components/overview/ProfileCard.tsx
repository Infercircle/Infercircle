"use client";

import { signIn, useSession } from "next-auth/react";
import React from "react";
import { User } from "@/lib/types";

const ProfileCard = () => {
    const { data: session, status } = useSession();
  
    if(!session || status !== "authenticated") {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Please sign in to view your dashboard.</p>
        </div>
      );
    }

    const user = session.user as User;

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
          <div className="text-lg font-semibold text-white"> {user?.name} {user.username && <span className="text-gray-400 text-base">@{user.username}</span>}</div>
          <div className="flex gap-4 mt-1 text-sm text-[#A3A3A3]">
            {user.followersCount &&  <span><span className="text-[#A259FF] font-bold">{user.followersCount}</span> 𝕏 Followers</span>}
            {user.username && <span><span className="text-[#A259FF] font-bold">80</span> Elite followers</span>}
            {!user.username && 
              <span className="text-[#A259FF] font-bold cursor-pointer" onClick={() => {
                signIn("twitter", { callbackUrl: "/dashboard" })
              }}>
                Add X Account
              </span>}
          </div>
        </div>
      </div>
      {/* Right: Net Worth */}
      <div className="mt-4 md:mt-0 md:text-right">
        <div className="text-gray-400 text-sm">Net Worth</div>
        <div className="text-2xl font-bold text-white">$10,513.73</div>
      </div>
    </div>
  );
};

export default ProfileCard;
