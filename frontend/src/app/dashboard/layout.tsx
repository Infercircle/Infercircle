'use client';

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar/sidebar";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { User } from "@/lib/types";
import { AddXModal } from "@/components/AddXModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentMarginClass = collapsed ? "ml-16" : "ml-60";
  const pathname = usePathname();
  const showSearch = pathname !== "/dashboard";
  const { data: session } = useSession();

  const user = session?.user as User;

  return (
    <div>
      {(!user || !user.username || user.username.length < 0) && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
          <AddXModal />
        </div>
      )}
      <div className={`${!user || !user.username || user.username.length < 0 ? "blur": ""}`}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className={`${contentMarginClass} transition-all duration-300`}>
          <Navbar collapsed={collapsed} showConnectWallet={true} showAuthButtons={false} showSearch={showSearch} />
          <main className="pt-6 px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 