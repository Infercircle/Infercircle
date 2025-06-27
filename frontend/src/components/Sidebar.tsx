import React from "react";
import sidebarItems from "./sidebaritems";
import Link from "next/link"

export const Sidebar = () => {
  return (
    <aside className="w-[200px] h-screen bg-[#191c1f] shadow-[4px_0px_6px_#00000040]">
      {/* Logo Section */}
      <Link href="/">
      <div className="flex items-center gap-1 px-3 py-6 cursor-pointer">
        <img
          className="w-2 h-6 mb-1"
          alt="Infercircle"
          src="images/i.png"
        />
        <h1 className="text-white font-semibold text-xl leading-[27px]">NFERCIRCLE</h1>
      </div>
      </Link>

      {/* Sidebar Items */}
      <nav className="flex flex-col gap-2 mt-6">
  {sidebarItems.map((item, index) => (
    <Link href={item.href || "#"} key={index}>
      <div
        className={`flex items-center gap-2 px-2 py-2 mx-2 rounded cursor-pointer transition-colors ${
          item.active ? "bg-[#474f5c]" : "hover:bg-[#2a2e35]"
        }`}
      >
        <img src={item.icon} alt={item.label} className="w-5 h-5" />
        <span className={`text-xs font-semibold ${item.active ? "text-white" : "text-[#ffffff99]"}`}>
          {item.label}
        </span>
      </div>
    </Link>
  ))}
</nav>
    </aside>
  );
};

export default Sidebar;