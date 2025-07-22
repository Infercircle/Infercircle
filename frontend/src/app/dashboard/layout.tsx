'use client';

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar/sidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { User } from "@/lib/types";
import { AddXModal } from "@/components/AddXModal";
import WalletModalContent from "@/components/WalletModalContent";
import { ToastProvider } from "@/components/ToastProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const contentMarginClass = collapsed ? "ml-16" : "ml-60";
  const pathname = usePathname();
  const showSearch = pathname !== "/dashboard";
  const { data: session } = useSession();

  const user = session?.user as User;

  // Wallet modal state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const openWalletModal = () => setWalletModalOpen(true);
  const closeWalletModal = () => setWalletModalOpen(false);
  // Wallets state (object for eth and sol)
  const [wallets, setWallets] = useState<{
    eth: string[];
    sol: string[];
    btc: string[];
    tron: string[];
    ton: string[];
    doge: string[];
  }>({ eth: [], sol: [], btc: [], tron: [], ton: [], doge: [] });
  const connectedWallets = wallets.eth.length + wallets.sol.length + wallets.btc.length + wallets.tron.length + wallets.ton.length + wallets.doge.length;

  return (
    <div>
      {(!user || !user.username || user.username.length < 0) && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent z-50">
          <AddXModal />
        </div>
      )}
      <div className={`${!user || !user.username || user.username.length < 0 ? "blur": ""}`}>
        <ToastProvider>
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
          <div className={`${contentMarginClass} transition-all duration-300`}>
            <Navbar
              collapsed={collapsed}
              showConnectWallet={true}
              showAuthButtons={false}
              showSearch={showSearch}
              onOpenWalletModal={openWalletModal}
              connectedWallets={connectedWallets}
            />
            <main className="pt-6 px-6">
              {children}
            </main>
          </div>
          <Modal isOpen={walletModalOpen} onClose={closeWalletModal}>
            <WalletModalContent
              eth={wallets.eth}
              sol={wallets.sol}
              btc={wallets.btc}
              tron={wallets.tron}
              ton={wallets.ton}
              doge={wallets.doge}
              setWallets={setWallets}
            />
          </Modal>
        </ToastProvider>
      </div>
    </div>
  );
} 