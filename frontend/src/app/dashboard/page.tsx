"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);

  const contentMarginClass = collapsed ? "ml-16" : "ml-60";

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`${contentMarginClass} transition-all duration-300`}>
        <Navbar collapsed={collapsed} showConnectWallet={true} />
        <main className="pt-6 px-6">
          <div className="space-y-4">
            {Array.from({ length: 60 }).map((_, i) => (
              <p key={i}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus aut obcaecati provident nesciunt nemo ex dolore animi neque aliquid...
              </p>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
