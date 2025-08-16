"use client"
import React from "react";
import Button from "./Button";
import { FiPower, FiSearch, FiMenu } from "react-icons/fi";
import { FaWallet } from "react-icons/fa6";
import { FaRegHandPointer } from "react-icons/fa";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { User } from "@prisma/client";

interface NavbarProps {
  collapsed?: boolean;
  showConnectWallet?: boolean;
  showAuthButtons?: boolean;
  showSearch?: boolean;
  onOpenWalletModal?: () => void;
  connectedWallets?: number;
  onToggleMobileMenu?: () => void;
  shouldShowFocusEffect?: boolean;
}

// Inline SearchBar component
const SearchBar: React.FC = () => (
  <form className="relative w-64">
    <input
      type="text"
      placeholder="Search"
      className="w-full pl-3 pr-8 py-1.5 rounded bg-[#23272b] border border-[#23272b] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
    />
    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-violet-400">
      <FiSearch size={16} />
    </button>
  </form>
);

const Navbar: React.FC<NavbarProps> = ({ collapsed = false, showConnectWallet = false, showAuthButtons = false, showSearch = false, onOpenWalletModal, connectedWallets = 0, onToggleMobileMenu, shouldShowFocusEffect = false }) => {
const { data: session, status } = useSession();

  return (
    <header className={`sticky top-0 z-50 p-1 bg-[rgba(17,20,22,0.4)] backdrop-blur-xl border-b border-[#23272b] transition-all duration-300 ${
      collapsed ? 'left-0 right-0' : 'left-0 md:left-56'
    }`}>
      <div className="flex items-center justify-between px-6 py-1 min-h-[48px]">
        {/* Left side: Hamburger menu (mobile only) and Logo */}
        <div className={`flex items-center space-x-3 transition-all duration-300 ${shouldShowFocusEffect ? 'opacity-30' : 'opacity-100'}`}>
          {/* Hamburger menu button - only show on mobile and when onToggleMobileMenu is provided */}
          {onToggleMobileMenu && (
                      <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-md hover:bg-[rgba(42,46,53,0.35)] transition-colors cursor-pointer"
          >
              <FiMenu className="w-5 h-5 text-white" />
            </button>
          )}
          
          {/* Logo */}
          <a href="/" className={`flex items-center transition-all duration-300 ${
            collapsed ? 'ml-3' : 'ml-0'
          }`}>
            <span className="text-violet-400 font-black text-xl tracking-widest uppercase">
              {/* Show sidebar logo on md and below, original logo on lg+ */}
              <img src="/icons/image.svg" alt="Infercircle" className="block md:hidden w-12 h-12" />
              <img src="/icons/logo.svg" alt="Infercircle" className="hidden md:block" />
            </span>
          </a>
        </div>

        {/* Right side: Watchlist, SearchBar, Wallets, Auth/Wallet buttons */}
        <div className="flex items-center space-x-3">
          {/* Watchlist button with react-icon */}
          <div className={`transition-all duration-300 ${shouldShowFocusEffect ? 'opacity-30' : 'opacity-100'}`}>
            {showSearch && <SearchBar />}
          </div>
          {showConnectWallet && (
            <div className="relative">
              <Button 
                variant="filled" 
                onClick={onOpenWalletModal}
                className={connectedWallets === 0 ? "animate-pulse bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25" : ""}
              >
                <FaWallet className="mr-2" size={18} /> Wallets
                <span className="ml-2 bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{connectedWallets}</span>
              </Button>
              {connectedWallets === 0 && (
                <div className="absolute bottom--2 left-0 text-white animate-ping">
                  <FaRegHandPointer size={16} />
                </div>
              )}
            </div>
          )}

          {showAuthButtons && (
            <>
              {(session && status === "authenticated")  ?
              (<Link href="/dashboard">
                {(session.user as User).inviteAccepted && <Button variant="outline">Dashboard</Button>}
              </Link>): (
                <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
                )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
