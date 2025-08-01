"use client"
import React, { useState, useEffect } from "react";
import Tabs from "./Tabs";
import CryptoTable from "./CryptoTable";
import axios from "axios";

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
}

interface TableToken {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  price: string;
  change1h: string;
  change24h: string;
  change7d: string;
  marketCap: string;
  volume24h: string;
  supply: string;
  icon?: string;
  sparkline?: number[];
}

const tabMap = [
  { label: "All Crypto", type: undefined },
  { label: "Socials", type: "trending" }, // Example: trending for demo
  { label: "Gainers", type: "gainers-losers" },
  { label: "Losers", type: "gainers-losers" },
  { label: "ATH", type: undefined },
  { label: "Ecosystems", type: undefined },
];



const mapTokenToTable = (token: TokenData, idx: number): TableToken => ({
  id: token.id,
  rank: idx + 1,
  name: token.name,
  symbol: token.symbol,
  price: token.current_price != null ? `$${token.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
  change1h: token.price_change_percentage_1h_in_currency != null ? `${token.price_change_percentage_1h_in_currency.toFixed(2)}%` : "-",
  change24h: token.price_change_percentage_24h_in_currency != null ? `${token.price_change_percentage_24h_in_currency.toFixed(2)}%` : "-",
  change7d: token.price_change_percentage_7d_in_currency != null ? `${token.price_change_percentage_7d_in_currency.toFixed(2)}%` : "-",
  marketCap: token.market_cap != null ? `$${token.market_cap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
  volume24h: token.total_volume != null ? `$${token.total_volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-",
  supply: token.circulating_supply != null ? `${token.circulating_supply.toLocaleString()} ${token.symbol}` : "-",
  icon: token.image,
  sparkline: token.sparkline_in_7d?.price || [],
});

const AssetTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [coins, setCoins] = useState<TableToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedData, setCachedData] = useState<Record<string, TableToken[]>>({});
  const [page, setPage] = useState(1);
  const perPage = 100;
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Fetch total count once on mount
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const res = await axios.get("https://api.coingecko.com/api/v3/coins/list");
        setTotalCount((res.data as any[]).length);
      } catch {
        setTotalCount(null);
      }
    };
    fetchTotalCount();
  }, []);

  useEffect(() => {
    const cacheKey = `${activeTab}-${page}`;
    const fetchTokens = async () => {
      if (!cachedData[cacheKey]) setLoading(true);
      setError(null);
      try {
        let url = `${process.env.NEXT_PUBLIC_API_BASE}/tokens/assets?page=${page}&per_page=${perPage}`;
        // You can add tab-based filtering here if needed
        const res = await axios.get<TokenData[]>(url);
        const tokens = res.data;
        const newCoins = tokens.map(mapTokenToTable);
        setCoins(newCoins);
        setCachedData(prev => ({ ...prev, [cacheKey]: newCoins }));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setCoins([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, [activeTab, page]);

  // Pagination controls
  const totalPages = totalCount ? Math.ceil(totalCount / perPage) : 1;
  const startIdx = (page - 1) * perPage + 1;
  const endIdx = Math.min(page * perPage, totalCount || 0);

  const renderPageButtons = () => {
    if (!totalPages || totalPages === 1) return null;
    const buttons = [];
    const maxButtons = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    if (start > 1) {
      buttons.push(
        <button key={1} onClick={() => setPage(1)} className={`px-2 py-1 mx-1 rounded ${page === 1 ? "bg-violet-500 text-white" : "bg-[#23272b] text-gray-300"}`}>1</button>
      );
      if (start > 2) buttons.push(<span key="start-ellipsis">...</span>);
    }
    for (let i = start; i <= end; i++) {
      buttons.push(
        <button key={i} onClick={() => setPage(i)} className={`px-2 py-1 mx-1 rounded ${page === i ? "bg-violet-500 text-white" : "bg-[#23272b] text-gray-300"}`}>{i}</button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) buttons.push(<span key="end-ellipsis">...</span>);
      buttons.push(
        <button key={totalPages} onClick={() => setPage(totalPages)} className={`px-2 py-1 mx-1 rounded ${page === totalPages ? "bg-violet-500 text-white" : "bg-[#23272b] text-gray-300"}`}>{totalPages}</button>
      );
    }
    return buttons;
  };

  return (
    <div>
      <Tabs onTabChange={setActiveTab} />
      {loading && !cachedData[`${activeTab}-${page}`] && (
        <div className="overflow-x-auto rounded-2xl border border-[#23272b] bg-[#181c20] mt-2">
          <table className="min-w-full text-xs text-left text-gray-300">
            <thead>
              <tr className="bg-[#20242a] text-gray-400">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">1h %</th>
                <th className="px-4 py-3 font-semibold">24h %</th>
                <th className="px-4 py-3 font-semibold">7d %</th>
                <th className="px-4 py-3 font-semibold">Market Cap</th>
                <th className="px-4 py-3 font-semibold">Volume(24h)</th>
                <th className="px-4 py-3 font-semibold">Circulating Supply</th>
                <th className="px-4 py-3 font-semibold">Graph</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} className="border-b border-[#23272b] animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-6"></div></td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-600 rounded w-20"></div>
                  </td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-16"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-12"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-12"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-12"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-20"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-20"></div></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-600 rounded w-24"></div></td>
                  <td className="px-4 py-3"><div className="w-20 h-6 bg-gray-600 rounded"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <div className="text-red-400 py-8 text-center">{error}</div>}
      {!loading && !error && (
        <>
          <CryptoTable coins={coins.map((coin, idx) => ({ ...coin, rank: startIdx + idx }))} />
          <div className="flex flex-col items-center justify-center mt-4">
            {totalCount !== null && (
              <div className="mb-2 text-gray-400 text-sm">
                Showing <span className="font-bold">{startIdx}</span> to <span className="font-bold">{endIdx}</span> of <span className="font-bold">{totalCount}</span> results
              </div>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 mx-1 rounded bg-[#23272b] text-gray-300 disabled:opacity-50">&lt;</button>
              {renderPageButtons()}
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 mx-1 rounded bg-[#23272b] text-gray-300 disabled:opacity-50">&gt;</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssetTable; 