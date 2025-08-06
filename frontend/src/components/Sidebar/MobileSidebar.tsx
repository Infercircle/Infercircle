"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import sidebarItems from "./sidebaritems";
import { FiChevronDown } from "react-icons/fi";
import { SiGitbook } from "react-icons/si";
import { FiLogOut } from "react-icons/fi";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface MobileSidebarProps {
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ onClose }) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Separate account item from main navigation items
  const accountItem = sidebarItems.find(item => item.label === "Account");
  const mainItems = sidebarItems.filter(item => item.label !== "Account");

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-4 border-b border-[#2a2e35] bg-[rgba(17,20,22,0.4)] backdrop-blur-sm">
        <Link href="/" onClick={handleLinkClick}>
          <img className="cursor-pointer" alt="Infercircle" src="/icons/image.svg" />
        </Link>
        <Tippy content="Close sidebar" placement="top">
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-[rgba(42,46,53,0.35)] transition-colors"
            style={{ cursor: 'w-resize' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Tippy>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col mt-3 flex-1 gap-2">
        {mainItems.map((item, idx) => {
          if (!item.items) {
            const isActive = pathname === item.href;
            return (
              <Link href={item.href} key={`mobile-link-${idx}`} onClick={handleLinkClick}>
                <div
                  className={`flex items-center gap-2 px-2 py-2 mx-2 rounded cursor-pointer text-sm font-semibold transition-all duration-200 ${
                    isActive ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99]"
                  }`}
                >
                  {React.createElement(item.icon, { className: "w-4 h-4" })}
                  {item.label}
                </div>
              </Link>
            );
          }
          const isExpanded = expandedGroups[item.group] ?? true;
          return (
            <div key={`mobile-group-${idx}`} className="px-2 border-t border-[#23272b] pt-2">
              <button
                className="flex items-center justify-between w-full text-sm font-semibold p-2 rounded mb-2 cursor-pointer hover:bg-[#2a2e35] text-[#ffffff99] transition-all duration-200"
                onClick={() => toggleGroup(item.group)}
              >
                <span className="flex items-center gap-2">
                  {React.createElement(item.icon, { className: "w-4 h-4" })}
                  {item.group}
                </span>
                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                  <FiChevronDown />
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <ul className="flex flex-col gap-1 mb-2">
                  {item.items.map((subItem, subIdx) => {
                    const isActive = pathname === subItem.href;
                    return (
                      <li
                        key={`mobile-item-${idx}-${subIdx}`}
                        className={`transform transition-all duration-300 ease-out ${
                          isExpanded
                            ? 'translate-y-0 opacity-100'
                            : 'translate-y-2 opacity-0'
                        }`}
                        style={{
                          transitionDelay: isExpanded ? `${subIdx * 50}ms` : '0ms'
                        }}
                      >
                        <Link href={subItem.href} onClick={handleLinkClick}>
                          <div
                            className={`flex items-center gap-2 px-2 py-2 ml-7 rounded text-xs font-semibold cursor-pointer transition-all duration-200 ${
                              isActive
                                ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white"
                                : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99]"
                            }`}
                          >
                            {React.createElement(subItem.icon, { className: "w-4 h-4" })}
                            {subItem.label}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mb-5">
        {/* Account Section */}
        {session && status === "authenticated" ? (
          <div className="p-2">
            <div className="px-2">
              <Link href="#" onClick={handleLinkClick}>
                <div className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-200 ${
                  pathname === "/dashboard/account" ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
                }`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {session.user?.image && (
                      <img
                        src={session.user.image}
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {session.user?.name}
                    </div>
                  </div>
                  <FiLogOut 
                    className="w-3 h-3 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      signOut({ callbackUrl: '/' });
                    }}
                  />
                </div>
              </Link>
            </div>
          </div>
        ) : (
          accountItem && accountItem.href && (
            <div className="p-2">
              <Link href={accountItem.href} onClick={handleLinkClick}>
                <div
                  className={`flex items-center gap-2 px-2 py-2 mx-2 rounded cursor-pointer text-sm font-semibold transition-all duration-200 ${
                    pathname === accountItem.href ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99]"
                  }`}
                >
                  {React.createElement(accountItem.icon, { className: "w-4 h-4" })}
                  {accountItem.label}
                </div>
              </Link>
            </div>
          )
        )}

        {/* Social Media Links */}
        <div className="border-t border-[#2a2e35] p-1">
          <div className="flex justify-center gap-4 py-1">
            <a
              href="https://x.com/infercircle"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-all duration-200 hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
            >
              <span className="text-base">𝕏</span>
            </a>
            <a
              href="https://docs.infercircle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-all duration-200 hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
            >
              <SiGitbook className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar; 