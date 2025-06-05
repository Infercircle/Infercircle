import React, { useState } from "react";
import Button from "./Button";
// Will Replace with actual logo import after uiux
// import logo from "../assets/logo.svg";
// use location to find the current active link

const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 bg-[#111416] lg:bg-[#111416]/80 lg:backdrop-blur border-b border-[#23282c]">
      <div className="flex items-center justify-between px-4 py-2 lg:px-10">
        {/* Logo */}
        <a href="#home" className="flex items-center">
          {/* <img src={logo} alt="Logo" className="h-8 w-auto" /> */}
          <span className="text-cyan-400 font-extrabold text-2xl tracking-widest uppercase">
            Infercircle
          </span>
        </a>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <Button variant="plain" href="#newaccount" className="uppercase">
            New Account
          </Button>
          <Button
            variant="outline"
            color="cyan"
            href="#signin"
            className="uppercase"
          >
            Sign In
          </Button>
        </div>

        {/* Animated Hamburger (Mobile) */}
        <button
          className="lg:hidden flex flex-col justify-center items-center w-10 h-10 relative z-50 group"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Open menu"
          type="button"
        >
          <span
            className={`block h-0.5 w-6 bg-cyan-400 transition-all duration-300 rounded-sm ${
              mobileOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-6 bg-cyan-400 transition-all duration-300 rounded-sm my-1 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-6 bg-cyan-400 transition-all duration-300 rounded-sm ${
              mobileOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu (animated overlay, only buttons, appears below header) */}
      <div
        className={`fixed left-0 right-0 top-[56px] bottom-0 bg-[#111416] z-40 flex flex-col items-center justify-center space-y-8 lg:hidden transition-all duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-8"
        }`}
      >
        <Button
          variant="plain"
          href="#newaccount"
          className="w-48 uppercase whitespace-nowrap"
          onClick={() => setMobileOpen(false)}
        >
          New Account
        </Button>
        <Button
          variant="outline"
          href="#signin"
          className="w-48 uppercase whitespace-nowrap"
          onClick={() => setMobileOpen(false)}
        >
          Sign In
        </Button>
      </div>
    </header>
  );
};

export default Header;
