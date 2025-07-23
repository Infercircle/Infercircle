"use client";

import React, { useEffect, useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
const GLASSNODE_API_KEY = process.env.NEXT_PUBLIC_GLASSNODE_API_KEY;

const COINGECKO_ID = "bitcoin";
const SYMBOL = "btc";

const GLASSNODE_ADDR_DIST = `https://api.glassnode.com/v1/metrics/addresses/supply_distribution_relative?a=BTC&f=json&i=24h`;
const GLASSNODE_ENTITIES_DIST = `https://api.glassnode.com/v1/metrics/entities/supply_distribution_relative?a=BTC&f=json&i=24h`;

const fetchWithKey = async (url: string) => {
  const res = await fetch(url, {
    headers: { "X-Glassnode-Api-Key": GLASSNODE_API_KEY || "" },
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  return res.json();
};

const Display = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [addressDist, setAddressDist] = useState<any>(null);
  const [whaleDist, setWhaleDist] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [tweetIndex, setTweetIndex] = useState(0);

  // Cycle tweet index every 5 seconds
  useEffect(() => {
    if (!tweets.length) return;
    setTweetIndex(0); // reset to first tweet on new data
    const interval = setInterval(() => {
      setTweetIndex((prev) => (prev + 1) % tweets.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tweets]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Price, change, rank, logo
      try {
        const cgRes = await fetch(`${API_BASE}/tokens/assets?page=1&per_page=1`);
        const cgData = await cgRes.json();
        const btc = Array.isArray(cgData) ? cgData.find((c: any) => c.symbol?.toLowerCase() === SYMBOL) : null;
        setPrice(btc?.current_price ?? null);
        setChange24h(btc?.price_change_percentage_24h_in_currency ?? null);
        setRank(btc?.market_cap_rank ?? 1);
        setLogo(btc?.image ?? null);
      } catch (e) {
        setPrice(null);
        setChange24h(null);
        setRank(1);
        setLogo(null);
        console.warn("Price fetch failed", e);
      }

      // 2. Address distribution
      try {
        const addrDist = await fetchWithKey(GLASSNODE_ADDR_DIST);
        setAddressDist(addrDist?.[0]?.o ?? null);
      } catch (e) {
        setAddressDist(null);
        console.warn("Glassnode address fetch failed", e);
      }

      // 3. Whale distribution
      try {
        const whaleDist = await fetchWithKey(GLASSNODE_ENTITIES_DIST);
        setWhaleDist(whaleDist?.[0]?.o ?? null);
      } catch (e) {
        setWhaleDist(null);
        console.warn("Glassnode whale fetch failed", e);
      }

      // 4. Always fetch tweets, even if above fails
      try {
        const tweetRes = await fetch(`${API_BASE}/twitter/tweets?query=bitcoin`);
        const tweetData = await tweetRes.json();
        setTweets(Array.isArray(tweetData?.data) ? tweetData.data : []);
      } catch (e) {
        setTweets([]);
        console.warn("Tweet fetch failed", e);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
      console.error("Error in fetchData:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Helper for address bands
  const getBand = (band: string) => {
    if (!addressDist) return 0;
    return (addressDist[band] ?? 0) * 100;
  };
  // Helper for whale bands
  const getWhale = (band: string) => {
    if (!whaleDist) return 0;
    return (whaleDist[band] ?? 0) * 100;
  };

  return (
    <div className="bg-[#181A20] border border-[#23272b]  rounded-2xl p-6 shadow-lg w-full h-full flex flex-col min-h-[320px] overflow-x-auto">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-2 lg:gap-0">
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="BTC" className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-3xl">🟠</span>
          )}
          <div>
            <div className="text-white font-semibold text-lg flex items-center gap-2">
              Bitcoin <span className="text-xs text-[#A3A3A3] font-normal">BTC</span>
              <span className="bg-[#23262F] text-xs px-2 py-0.5 rounded-full ml-2">#{rank ?? 1}</span>
            </div>
          </div>
        </div>
        <button className="text-[#A3A3A3] text-xs bg-[#23262F] px-3 py-1 rounded-lg mt-2 sm:mt-0" onClick={fetchData}>
          Refresh
        </button>
      </div>
      {/* Price and change */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-4">
        <div className="text-2xl font-bold text-white">
          {loading ? <span className="animate-pulse">...</span> : price !== null ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "N/A"}
        </div>
        <div className={
          change24h !== null && change24h >= 0
            ? "text-green-400 font-semibold text-sm"
            : "text-red-400 font-semibold text-sm"
        }>
          {loading ? <span className="animate-pulse">...</span> : change24h !== null ? `${change24h.toFixed(2)}% (24h) ${change24h >= 0 ? "▲" : "▼"}` : "N/A"}
        </div>
      </div>
      {/* Holdings */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 bg-[#23262F] rounded-xl p-3 w-full">
          <div className="text-xs text-[#A3A3A3] mb-1">Addresses by Holdings</div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-[#A3A3A3]">$0 - $1k</span>
            <span className="text-[#A3A3A3]">$1k - $100k</span>
            <span className="text-[#A3A3A3]">$100k+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 bg-[#A259FF] rounded-full" style={{ width: `${getBand("less_0001") + getBand("0001_001") + getBand("001_01") + getBand("01_1") + getBand("1_10")}%`, minWidth: 10 }} />
            <div className="h-2 bg-[#F7931A] rounded-full" style={{ width: `${getBand("10_100") + getBand("100_1k")}%`, minWidth: 10 }} />
            <div className="h-2 bg-[#A3A3A3] rounded-full" style={{ width: `${getBand("1k_10k") + getBand("10k_100k") + getBand("above_100k")}%`, minWidth: 10 }} />
          </div>
          <div className="flex items-center gap-6 mt-1 text-xs text-white">
            <span>{(getBand("less_0001") + getBand("0001_001") + getBand("001_01") + getBand("01_1") + getBand("1_10")).toFixed(2)}%</span>
            <span>{(getBand("10_100") + getBand("100_1k")).toFixed(2)}%</span>
            <span>{(getBand("1k_10k") + getBand("10k_100k") + getBand("above_100k")).toFixed(2)}%</span>
          </div>
        </div>
        <div className="flex-1 bg-[#23262F] rounded-xl p-3 w-full">
          <div className="text-xs text-[#A3A3A3] mb-1">Whale Holdings</div>
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-[#A3A3A3]">Whales</span>
            <span className="text-[#A3A3A3]">Others</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 bg-[#A259FF] rounded-full" style={{ width: `${getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k")}%`, minWidth: 10 }} />
            <div className="h-2 bg-[#A3A3A3] rounded-full" style={{ width: `${100 - (getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k"))}%`, minWidth: 10 }} />
          </div>
          <div className="flex items-center gap-6 mt-1 text-xs text-white">
            <span>{(getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k")).toFixed(2)}%</span>
            <span>{(100 - (getWhale("1k_10k") + getWhale("10k_100k") + getWhale("above_100k"))).toFixed(2)}%</span>
          </div>
        </div>
      </div>
      {/* Social Sentiment */}
      <div className="mt-2">
        <div className="text-[#A259FF] font-semibold mb-2">Social Sentiment</div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🧑‍💻</span>
              <span className="text-white font-medium text-sm">{tweets.length ? tweets[tweetIndex]?.name : "-"}</span>
            </div>
            <div className="text-xs text-[#A3A3A3] mb-1">
              {tweets.length && tweets[tweetIndex]?.text ? <span className="text-[#F7931A] font-bold">$BTC</span> : null} {tweets.length ? tweets[tweetIndex]?.text : (loading ? <span className="animate-pulse">Loading tweet...</span> : "No recent tweet found.")}
            </div>
          </div>
          {/* Chart placeholder */}
          <div className="w-28 h-16 bg-[#23262F] rounded-lg flex items-center justify-center mt-2 lg:mt-0">
            <span className="text-[#A259FF] text-2xl">📊</span>
          </div>
        </div>
      </div>
      {error && <div className="text-red-400 mt-2 text-xs">{error}</div>}
    </div>
  );
};

export default Display;
