'use client';

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar/sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentMarginClass = collapsed ? "ml-16" : "ml-60";

  return (
    <>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`${contentMarginClass} transition-all duration-300`}>
        <Navbar collapsed={collapsed} showConnectWallet={true} showAuthButtons={false} showSearch={true} />
        <main className="pt-6 px-6">
          {children}
        </main>
      </div>
    </>
  );
} 