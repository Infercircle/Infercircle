"use client"
import React from "react";
import Button from "./Button";
import { FiSearch } from "react-icons/fi";
import { FaWallet } from "react-icons/fa6";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { FiPower } from "react-icons/fi";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface NavbarProps {
  collapsed?: boolean;
  showConnectWallet?: boolean;
  showAuthButtons?: boolean;
  showSearch?: boolean;
  onOpenWalletModal?: () => void;
  connectedWallets?: number;
}

// Inline SearchBar component
const SearchBar: React.FC = () => (
  <form className="relative w-80">
    <input
      type="text"
      placeholder="Search"
      className="w-full pl-4 pr-10 py-2 rounded bg-[#23272b] border border-[#23272b] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
    />
    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-violet-400">
      <FiSearch size={20} />
    </button>
  </form>
);

const Navbar: React.FC<NavbarProps> = ({ collapsed = false, showConnectWallet = false, showAuthButtons = false, showSearch = false, onOpenWalletModal, connectedWallets = 0 }) => {
const { data: session, status } = useSession();

  return (
    <header className={`sticky top-0 z-50 p-1 bg-[rgba(17,20,22,0.4)] backdrop-blur-xl border-b border-[#23272b] transition-all duration-300 ${
      collapsed ? 'left-0 right-0' : 'left-60'
    }`}>
      <div className="flex items-center justify-between px-10 py-1.5 min-h-[54px]">
        {/* Logo */}
        <a href="#home" className={`flex items-center transition-all duration-300 ${
          collapsed ? 'transform -translate-x-5' : 'transform translate-x--3'
        }`}>
          <span className="text-violet-400 font-black text-2xl tracking-widest uppercase">
            {/* Show sidebar logo on md and below, original logo on lg+ */}
            <img src="/icons/image.svg" alt="Infercircle" className="block md:hidden" />
            <img src="/icons/logo.svg" alt="Infercircle" className="hidden md:block" />
          </span>
        </a>

        {/* Right side: Watchlist, SearchBar, Wallets, Auth/Wallet buttons */}
        <div className="flex items-center space-x-4">
          {/* Watchlist button with react-icon */}
          {showSearch && <SearchBar />}
          {showConnectWallet && (
            <Button variant="filled" onClick={onOpenWalletModal}>
              <FaWallet className="mr-2" size={18} /> Wallets
              <span className="ml-2 bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{connectedWallets}</span>
            </Button>
          )}
          {(session && status === "authenticated")  &&(
            <Tippy content="Sign out" placement="bottom">
              <button
                onClick={() => signOut({ callbackUrl: '/', redirect: true })}
                className="p-2 rounded transition-colors cursor-pointer"
                aria-label="Sign out"
                type="button"
              >
                <FiPower size={22} className="text-violet-500 hover:text-violet-400" />
              </button>
            </Tippy>
          )}
          {showAuthButtons && (
            <>
              {(session && status === "authenticated")  ?
              (<Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>): (
                <Button variant="outline" onClick={
                  () => signIn('twitter', { callbackUrl: '/dashboard', redirect: true })
                }>Sign In With 𝕏</Button>
                )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
