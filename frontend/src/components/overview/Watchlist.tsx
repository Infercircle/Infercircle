import React from "react";

const mockWatchlist = [
  { ticker: "BTC", platform: "Twitter", desc: "The Project is going to the Moon", time: "1h" },
  { ticker: "X", platform: "Twitter", desc: "The Project is going to the Moon", time: "1h" },
  { ticker: "BTC", platform: "Twitter", desc: "The Project is going to the Moon", time: "1h" },
  { ticker: "X", platform: "Twitter", desc: "The Project is going to the Moon", time: "1h" },
  { ticker: "BTC", platform: "Twitter", desc: "The Project is going to the Moon", time: "1h" },
  { ticker: "X", platform: "Twitter", desc: "The Project is going to the Moon", time: "1h" },
];

const Watchlist = () => {
  return (
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-base font-semibold text-white">Watchlists</div>
        <button className="text-[#A3A3A3] text-xs bg-[#23262F] px-2 py-1 rounded-lg flex items-center gap-1">All <span>▼</span></button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent">
        {/* {mockWatchlist.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-[#23262F] last:border-0">
            <div className="flex items-center gap-2">
              <span className="bg-[#23262F] text-[#A259FF] text-xs font-bold px-2 py-1 rounded mr-1">{item.ticker}</span>
              <span className="bg-[#23262F] text-[#A3A3A3] text-xs px-2 py-1 rounded mr-1">{item.platform}</span>
              <span className="text-white text-xs">{item.desc}</span>
            </div>
            <span className="text-[#A3A3A3] text-xs ml-2 whitespace-nowrap">{item.time}</span>
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default Watchlist; 