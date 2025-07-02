import React, { useEffect, useState } from "react";
import MiniGraph from "./MiniGraph";
import { FaBitcoin } from "react-icons/fa";
import axios from "axios";

interface Coin {
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
  id?: string;
  coingeckoId?: string;
}

interface CryptoTableProps {
  coins?: Coin[];
}

const SparklineCell: React.FC<{ coingeckoId?: string }> = ({ coingeckoId }) => {
  const [data, setData] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coingeckoId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await axios.get<{ prices: number[] }>(`http://localhost:8080/tokens/${coingeckoId}/coingecko-sparkline`);
        setData(res.data.prices);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [coingeckoId]);

  if (loading) return <div className="w-20 h-6 flex items-center justify-center text-xs text-gray-400">...</div>;
  if (!data || data.length === 0) return <div className="w-20 h-6 bg-[#23272b] rounded" />;
  return <MiniGraph data={data} />;
};

const CryptoTable: React.FC<CryptoTableProps> = ({ coins = [] }) => (
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
        {coins.map((coin) => (
          <tr key={coin.rank} className="border-b border-[#23272b] hover:bg-[#23272b]/60 transition">
            <td className="px-4 py-3 font-bold text-gray-400">{coin.rank}</td>
            <td className="px-4 py-3 flex items-center gap-2">
              {/* Render icon as image if available */}
              {coin.icon ? (
                <img src={coin.icon} alt={coin.symbol} className="w-5 h-5" />
              ) : null}
              <span className="font-semibold text-gray-100">{coin.name}</span>
              <span className="text-gray-400 text-xs">{coin.symbol}</span>
            </td>
            <td className="px-4 py-3">{coin.price}</td>
            <td className="px-4 py-3 text-green-400">{coin.change1h}</td>
            <td className="px-4 py-3 text-red-400">{coin.change24h}</td>
            <td className="px-4 py-3 text-green-400">{coin.change7d}</td>
            <td className="px-4 py-3">{coin.marketCap}</td>
            <td className="px-4 py-3">{coin.volume24h}</td>
            <td className="px-4 py-3">{coin.supply}</td>
            <td className="px-4 py-3">
              <SparklineCell coingeckoId={coin.coingeckoId} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CryptoTable; 