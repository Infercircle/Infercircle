'use client';

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar/sidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import { usePathname } from "next/navigation";
import WalletModalContent from "@/components/WalletModalContent";
import { ToastProvider } from "@/components/ToastProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentMarginClass = collapsed ? "ml-16" : "ml-60";
  const pathname = usePathname();
  const showSearch = pathname !== "/dashboard";

  // Wallet modal state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const openWalletModal = () => setWalletModalOpen(true);
  const closeWalletModal = () => setWalletModalOpen(false);

  return (
    <ToastProvider>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`${contentMarginClass} transition-all duration-300`}>
        <Navbar
          collapsed={collapsed}
          showConnectWallet={true}
          showAuthButtons={false}
          showSearch={showSearch}
          onOpenWalletModal={openWalletModal}
        />
        <main className="pt-6 px-6">
          {children}
        </main>
      </div>
      <Modal isOpen={walletModalOpen} onClose={closeWalletModal}>
        <WalletModalContent />
      </Modal>
    </ToastProvider>
  );
} 