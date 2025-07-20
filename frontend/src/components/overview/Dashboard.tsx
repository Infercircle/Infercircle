import React from "react";
import ProfileCard from "./ProfileCard";
import OnChainActivities from "./OnChainActivities";
import Display from "./Display";
import Watchlist from "./Watchlist";
import IcoIdo from "./IcoIdo";
import Suggested from "./Suggested";
import { useSession } from "next-auth/react";

const Dashboard = () => {
  const { data: session, status } = useSession();

  if(!session || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="grid grid-cols-12 gap-6 h-full w-full pb-4">
      {/* Top Row: Profile Card (full width) */}
      <div className="col-span-12">
        <ProfileCard />
      </div>
    {/* Second Row: Suggested (full width, prominent) */}
    <div className="col-span-12">
      <Suggested />
    </div>
    {/* Third Row: OnChain Activities & Display */}
    <div className="col-span-12 md:col-span-7 flex flex-col">
      <OnChainActivities />
    </div>
    <div className="col-span-12 md:col-span-5 flex flex-col">
      <Display />
    </div>
    {/* Bottom Row: Watchlist, ICO/IDO */}
    <div className="col-span-12 md:col-span-6">
      <Watchlist />
    </div>
    <div className="col-span-12 md:col-span-6">
      <IcoIdo />
    </div>
  </div>
)};

export default Dashboard; 