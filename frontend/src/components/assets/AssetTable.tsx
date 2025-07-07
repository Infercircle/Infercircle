"use client"
import React, { useState, useEffect } from "react";
import Tabs from "./Tabs";
import CryptoTable from "./CryptoTable";
import axios from "axios";

interface TokenData {
  id: number;
  name: string;
  symbol: string;
  circulating_supply: number;
  quote?: {
    USD?: {
      price: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

interface TableToken {
  id: string;
  coingeckoId?: string;
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
}

const tabMap = [
  { label: "All Crypto", type: undefined },
  { label: "Socials", type: "trending" }, // Example: trending for demo
  { label: "Gainers", type: "gainers-losers" },
  { label: "Losers", type: "gainers-losers" },
  { label: "ATH", type: undefined },
  { label: "Ecosystems", type: undefined },
];

const coingeckoIdMap: Record<number, string> = {
  1: "bitcoin",
  1027: "ethereum",
  52: "xrp",
  // Add more mappings as needed
};

const mapTokenToTable = (token: TokenData, idx: number): TableToken => ({
  id: token.id.toString(),
  coingeckoId: coingeckoIdMap[token.id], // Add CoinGecko id for sparkline
  rank: idx + 1,
  name: token.name,
  symbol: token.symbol,
  price: token.quote?.USD?.price ? `$${token.quote.USD.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "-",
  change1h: token.quote?.USD?.percent_change_1h ? `${token.quote.USD.percent_change_1h.toFixed(2)}%` : "-",
  change24h: token.quote?.USD?.percent_change_24h ? `${token.quote.USD.percent_change_24h.toFixed(2)}%` : "-",
  change7d: token.quote?.USD?.percent_change_7d ? `${token.quote.USD.percent_change_7d.toFixed(2)}%` : "-",
  marketCap: token.quote?.USD?.market_cap ? `$${token.quote.USD.market_cap.toLocaleString()}` : "-",
  volume24h: token.quote?.USD?.volume_24h ? `$${token.quote.USD.volume_24h.toLocaleString()}` : "-",
  supply: token.circulating_supply ? `${token.circulating_supply.toLocaleString()} ${token.symbol}` : "-",
  icon: token.id ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${token.id}.png` : undefined,
});

const AssetTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [coins, setCoins] = useState<TableToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = "http://localhost:8080/tokens/tokens";
        const type = tabMap[activeTab].type;
        if (type) url += `?type=${type}`;
        const res = await axios.get<{ data: TokenData[] }>(url);
        const data = res.data;
        const tokens = data.data || [];
        setCoins(tokens.map(mapTokenToTable));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setCoins([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, [activeTab]);

  return (
    <div>
      <Tabs onTabChange={setActiveTab} />
      {loading && <div className="text-gray-400 py-8 text-center">Loading tokens...</div>}
      {error && <div className="text-red-400 py-8 text-center">{error}</div>}
      {!loading && !error && <CryptoTable coins={coins} />}
    </div>
  );
};

export default AssetTable; 