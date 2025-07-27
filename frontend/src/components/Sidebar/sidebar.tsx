"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import sidebarItems from "./sidebaritems";
import { FiChevronDown } from "react-icons/fi";
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from "react-icons/bs";
import { SiGitbook } from "react-icons/si";
import { FiLogOut } from "react-icons/fi";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { User } from "@/lib/types";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
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

  // Get all icons for collapsed view
  const getAllIcons = () => {
    const icons: Array<{
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      href: string;
      isActive: boolean;
    }> = [];
    mainItems.forEach(item => {
      if (!item.items) {
        icons.push({
          icon: item.icon,
          label: item.label,
          href: item.href,
          isActive: pathname === item.href
        });
      }
    });
    mainItems.forEach(item => {
      if (item.items) {
        item.items.forEach(subItem => {
          icons.push({
            icon: subItem.icon,
            label: subItem.label,
            href: subItem.href,
            isActive: pathname === subItem.href
          });
        });
      }
    });
    return icons;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen text-white flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16 bg-[rgba(24,26,32,0.9)] border-r border-[#23272b] shadow-[4px_0px_6px_#00000040] backdrop-blur-xl' : 'w-[240px] bg-[rgba(24,26,32,0.9)] border-r border-[#23272b] shadow-[4px_0px_6px_#00000040] backdrop-blur-xl'
      }`}
    >
      {/* Logo & Collapse Button */}
      <div className="flex items-center justify-between px-3 py-[15px] transition-all duration-300 border-b border-[#2a2e35] bg-[rgba(17,20,22,0.4)] backdrop-blur-sm">
        {!collapsed ? (
          <Link href="/">
          <img className="cursor-pointer" alt="Infercircle" src="/icons/image.svg" />
        </Link>
        ) : (
          <div className="w-10 h-8 flex items-center justify-center relative">
            <Tippy content="Expand sidebar" placement="right">
              <div>
                <BsLayoutSidebarInsetReverse
                  className="w-5 h-5 text-[#ffffff99] hover:text-white transition-colors cursor-pointer"
                  onClick={() => setCollapsed(false)}
                />
              </div>
            </Tippy>
          </div>
        )}
        {!collapsed && (
          <Tippy content="Collapse sidebar" placement="bottom">
            <div>
              <BsLayoutSidebarInset
                className="w-5 h-5 text-[#ffffff99] hover:text-white transition-colors cursor-pointer"
                style={{ cursor: 'w-resize' }}
                onClick={() => setCollapsed(true)}
              />
            </div>
          </Tippy>
        )}
      </div>

      {/* Main Sidebar Navigation */}
      <nav className={`flex flex-col mt-3 flex-1 ${collapsed ? 'gap-1.5' : 'gap-2'}`}>
        {collapsed ? (
          getAllIcons().map((item, idx) => (
            <Tippy key={`collapsed-${idx}`} content={item.label} placement="right">
              <Link href={item.href}>
                <div
                  className={`flex items-center justify-center p-2.5 mx-2 rounded cursor-pointer transition-all duration-200 ${
                    item.isActive ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99]"
                  }`}
                >
                  {React.createElement(item.icon, { className: "w-5 h-5" })}
                </div>
              </Link>
            </Tippy>
          ))
        ) : (
          mainItems.map((item, idx) => {
            if (!item.items) {
              const isActive = pathname === item.href;
              return (
                <Link href={item.href} key={`link-${idx}`}>
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
              <div key={`group-${idx}`} className="px-2 border-t border-[#23272b] pt-2">
                <button
                  className="flex items-center justify-between w-full text-sm font-semibold p-2 rounded mb-2 cursor-pointer hover:bg-[#2a2e35] text-[#ffffff99] transition-all duration-200"
                  onClick={() => toggleGroup(item.group)}
                >
                  <span className="flex items-center gap-2">
                    {React.createElement(item.icon, { className: "w-5 h-5" })}
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
                          key={`item-${idx}-${subIdx}`}
                          className={`transform transition-all duration-300 ease-out ${
                            isExpanded
                              ? 'translate-y-0 opacity-100'
                              : 'translate-y-2 opacity-0'
                          }`}
                          style={{
                            transitionDelay: isExpanded ? `${subIdx * 50}ms` : '0ms'
                          }}
                        >
                          <Link href={subItem.href}>
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
          })
        )}
      </nav>

      <div className="mb-5">
        {/* Account Section */}
        {session && status === "authenticated" ? (
          <div className="p-2">
            {collapsed ? (
              <Tippy content={session.user?.name} placement="right">
                <Link href="/dashboard/account">
                  <div
                    className={`flex items-center justify-center py-2.5 px-6 rounded transition-all duration-200 ${
                      pathname === "/dashboard/account" ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
                      {session.user?.image && (
                        <img
                          src={session.user.image}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </Tippy>
            ) : (
              <div className="px-2">
                <Link href="/dashboard/account">
                  <div className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-200 ${
                    pathname === "/dashboard/account" ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
                  }`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
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
                      <div className="text-xs text-[#A3A3A3] truncate">
                        @{(session.user as User)?.username}
                      </div>
                    </div>
                    <Tippy content="Sign out" placement="top">
                      <FiLogOut 
                        className="w-4 h-4 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          signOut({ callbackUrl: '/' });
                        }}
                      />
                    </Tippy>
                  </div>
                </Link>
              </div>
            )}
          </div>
        ) : (
          accountItem && accountItem.href && (
            <div className="p-2">
              {collapsed ? (
                <Tippy content={accountItem.label} placement="right">
                  <Link href={accountItem.href}>
                    <div
                      className={`flex items-center justify-center py-2.5 px-6  rounded cursor-pointer transition-all duration-200 ${
                        pathname === accountItem.href ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99]"
                      }`}
                    >
                      <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {React.createElement(accountItem.icon, {
                          className: "w-5 h-5",
                          style: { width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }
                        })}
                      </div>
                    </div>
                  </Link>
                </Tippy>
              ) : (
                <Link href={accountItem.href}>
                  <div
                    className={`flex items-center gap-2 px-2 py-2 mx-2 rounded cursor-pointer text-sm font-semibold transition-all duration-200 ${
                      pathname === accountItem.href ? "bg-[rgba(71,79,92,0.35)] backdrop-blur-md text-white" : "hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99]"
                    }`}
                  >
                    {React.createElement(accountItem.icon, { className: "w-4 h-4" })}
                    {accountItem.label}
                  </div>
                </Link>
              )}
            </div>
          )
        )}

        {/* Social Media Links */}
        <div className="border-t border-[#2a2e35] p-1">
          {collapsed ? (
            <Tippy content="Twitter/X" placement="right">
              <a
                href="https://x.com/infercircle"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center py-1 px-6 rounded cursor-pointer transition-all duration-200 hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
              >
                <span className="text-lg">𝕏</span>
              </a>
            </Tippy>
          ) : (
            <div className="flex justify-center gap-4 py-1">
              <a
                href="https://x.com/infercircle"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-all duration-200 hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
              >
                <span className="text-lg">𝕏</span>
              </a>
              <a
                href="https://infercircle.gitbook.io/infercircle-docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-all duration-200 hover:bg-[rgba(42,46,53,0.35)] hover:backdrop-blur-md text-[#ffffff99] hover:text-white"
              >
                <SiGitbook className="w-5 h-5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;