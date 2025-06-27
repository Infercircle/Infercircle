import React from "react";
import sidebarItems from "./sidebaritems";

export const Sidebar = () => {
  return (
    <aside className="w-[200px] h-full bg-[#191c1f] shadow-[4px_0px_6px_#00000040]">
      {/* Logo Section */}
      <div className="flex items-center gap-2 px-2 py-6">
        <img
          className="w-5 h-7"
          alt="Infer circle"
          src="https://c.animaapp.com/mcex44fs90T69B/img/infer-circle.png"
        />
        <h1 className="text-white font-semibold text-xl leading-[27px]">NFERCIRCLE</h1>
      </div>

      {/* Sidebar Items */}
      <nav className="flex flex-col gap-2 mt-6">
        {sidebarItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 px-2 py-2 mx-2 rounded ${
              item.active ? "bg-[#474f5c]" : ""
            }`}
          >
            <img src={item.icon} alt={item.label} className="w-5 h-5" />
            <span className={`text-xs font-semibold ${item.active ? "text-white" : "text-[#ffffff99]"}`}>
              {item.label}
            </span>
            {item.extraImage && (
              <div
                className="w-3 h-3 rotate-45 ml-1"
                style={{
                  backgroundImage: `url(${item.extraImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;