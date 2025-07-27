import React from "react";

const mockIcoIdo = [
  { icon: "🪙", name: "wowcoin", ticker: "WC", type: "IDO", cap: "$300M", when: "Aug 6" },
  { icon: "🪙", name: "wowcoin", ticker: "WC", type: "IDO", cap: "$300M", when: "Aug 6" },
  { icon: "🪙", name: "wowcoin", ticker: "WC", type: "IDO", cap: "$300M", when: "Aug 6" },
  { icon: "🪙", name: "wowcoin", ticker: "WC", type: "IDO", cap: "$300M", when: "Aug 6" },
];

const IcoIdo = () => {
  return (
    <div className="bg-[rgba(24,26,32,0.9)] backdrop-blur-xl border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-white">ICO / IDO</div>
        <button className="text-[#A3A3A3] text-xs bg-[#23262F] px-2 py-1 rounded-lg flex items-center gap-1">All <span>▼</span></button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent">
        <table className="min-w-full text-xs text-left">
          <thead>
            <tr className="text-[#A3A3A3] border-b border-[#23262F]">
              <th className="py-2 px-2 font-medium">Date</th>
              <th className="py-2 px-2 font-medium">Project</th>
              <th className="py-2 px-2 font-medium">Type</th>
              <th className="py-2 px-2 font-medium">Launchpad</th>
            </tr>
          </thead>
          <tbody>
            {mockIcoIdo.map((item, idx) => (
              <tr key={idx} className="border-b border-[#23262F] last:border-0 hover:bg-[#23262F]/40 transition">
                <td className="py-2 px-2 text-white">{item.when}</td>
                <td className="py-2 px-2 flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-[#A3A3A3] text-xs">{item.ticker}</div>
                  </div>
                </td>
                <td className="py-2 px-2 text-white">{item.type}</td>
                <td className="py-2 px-2 text-white">{item.cap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IcoIdo;
