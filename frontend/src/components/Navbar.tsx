"use client"
import React from "react";
import Button from "./Button";

interface NavbarProps {
  collapsed?: boolean;
  showConnectWallet?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ collapsed = false, showConnectWallet = false }) => {
  return (
    <header className={`sticky top-0 z-50 p-1.5 bg-[rgba(17,20,22,0.4)] backdrop-blur-xl border-b border-[#1a1d20] transition-all duration-300 ${
      collapsed ? 'left-0 right-0' : 'left-60'
    }`}>
      <div className="flex items-center justify-between px-10 py-1.5">
        {/* Logo */}
        <a href="#home" className={`flex items-center transition-all duration-300 ${
          collapsed ? 'transform -translate-x-9.5' : 'transform translate-x--3'
        }`}>
          {/* <img src={logo} alt="Logo" className="h-8 w-auto" /> */}
          <span className="text-violet-400 font-black text-2xl tracking-widest uppercase">
            <img src="/icons/logo.svg" alt="Infercircle" />
          </span>
        </a>

        {/* Buttons */}
        <div className="flex items-center space-x-4">
          {showConnectWallet ? (
            <Button
              variant="filled"
              color="violet"
              href="#connect-wallet"
              
            >
              Connect Wallet
            </Button>
          ) : (
            <>
              <Button variant="plain" href="#newaccount" className="uppercase">
                New Account
              </Button>
              <Button
                variant="outline"
                color="violet"
                href="/dashboard"
                className="uppercase"
              >
                Sign In
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
