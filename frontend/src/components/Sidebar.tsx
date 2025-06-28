"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import sidebarItems from "./sidebaritems";
import { FiChevronDown } from "react-icons/fi";
import { BsLayoutSidebarInset, BsLayoutSidebarInsetReverse } from "react-icons/bs";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isHovered, setIsHovered] = useState(false);

  // Auto-collapse on smaller screens (controlled by parent)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollapsed]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Separate account item from main navigation items
  const accountItem = sidebarItems.find(item => item.label === "Account");
  const mainItems = sidebarItems.filter(item => item.label !== "Account");

  // Get all icons from grouped items for collapsed view
  const getAllIcons = () => {
    const icons: Array<{
      icon: any;
      label: string;
      href: string;
      isActive: boolean;
    }> = [];
    
    // Add standalone items
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

    // Add grouped items
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
        collapsed ? 'w-16 bg-[#191c1f] border-r border-[#1a1d20] shadow-[4px_0px_6px_#00000040]' : 'w-[240px] bg-[#191c1f] border-r border-[#1a1d20] shadow-[4px_0px_6px_#00000040]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={collapsed ? toggleSidebar : undefined}
      style={{ cursor: collapsed ? 'e-resize' : 'default' }}
    >
      {/* Logo Section */}
      
      <div className={`flex items-center justify-between px-3 py-3 transition-all duration-300 ${
        collapsed ? 'bg-[rgba(17,20,22,0.4)] backdrop-blur-sm border-b border-[#1a1d20]' : 'bg-[#2a2e35]'
      }`}>
        {!collapsed ? (
          <img className="cursor-pointer" alt="Infercircle" src="icons/image.svg" />
        ) : (
          <div className="w-10 h-8 flex items-center justify-center relative">
            <Tippy content="Expand sidebar" placement="right">
              <div>
                <BsLayoutSidebarInsetReverse
                  className="w-5 h-5 text-[#ffffff99] hover:text-white transition-colors cursor-pointer" 
                  onClick={toggleSidebar}
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
                onClick={toggleSidebar}
              />
            </div>
          </Tippy>
        )}
      </div>
      

      {/* Main Sidebar Navigation */}
      <nav className="flex flex-col gap-2 mt-3 flex-1 overflow-y-auto">
        {collapsed ? (
          // Collapsed view - show all icons in order
          getAllIcons().map((item, idx) => (
            <Tippy key={`collapsed-${idx}`} content={item.label} placement="right">
              <Link href={item.href}>
                <div
                  className={`flex items-center justify-center p-3 mx-2 rounded cursor-pointer transition-all duration-200 ${
                    item.isActive ? "bg-[#474f5c] text-white" : "hover:bg-[#2a2e35] text-[#ffffff99]"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {React.createElement(item.icon, { className: "w-5 h-5" })}
                </div>
              </Link>
            </Tippy>
          ))
        ) : (
          // Expanded view - normal sidebar
          mainItems.map((item, idx) => {
            // Standalone (not a group)
            if (!item.items) {
              const isActive = pathname === item.href;
              return (
                <Link href={item.href} key={`link-${idx}`}>
                  <div
                    className={`flex items-center gap-2 px-2 py-2 mx-2 rounded cursor-pointer text-sm font-semibold transition-all duration-200 ${
                      isActive ? "bg-[#474f5c] text-white" : "hover:bg-[#2a2e35] text-[#ffffff99]"
                    }`}
                  >
                    {React.createElement(item.icon, { className: "w-4 h-4" })}
                    {item.label}
                  </div>
                </Link>
              );
            }

            // Grouped item
            const isExpanded = expandedGroups[item.group] ?? true;

            return (
              <div key={`group-${idx}`} className="px-2 border-t border-[#2a2e35] pt-2">
                
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
                                  ? "bg-[#474f5c] text-white"
                                  : "hover:bg-[#2a2e35] text-[#ffffff99]"
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

      {/* Account Section at Bottom */}
      {accountItem && accountItem.href && (
        <div className="border-t border-[#2a2e35] p-2 mb-12">
          {collapsed ? (
            <Tippy content={accountItem.label} placement="right">
              <Link href={accountItem.href}>
                <div
                  className={`flex items-center justify-center p-3 mx-2 rounded cursor-pointer transition-all duration-200 ${
                    pathname === accountItem.href ? "bg-[#474f5c] text-white" : "hover:bg-[#2a2e35] text-[#ffffff99]"
                  }`}
                  onClick={(e) => e.stopPropagation()}
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
                  pathname === accountItem.href ? "bg-[#474f5c] text-white" : "hover:bg-[#2a2e35] text-[#ffffff99]"
                }`}
              >
                {React.createElement(accountItem.icon, { className: "w-4 h-4" })}
                {accountItem.label}
              </div>
            </Link>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
