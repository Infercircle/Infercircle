import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

// Throttle helper: runs async tasks with a concurrency limit
async function throttleAll<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  const run = async () => {
    while (i < tasks.length) {
      const cur = i++;
      try {
        results[cur] = await tasks[cur]();
      } catch (e) {
        results[cur] = undefined as any;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, run));
  return results;
}

// Helper to format balances (e.g., 10000 -> 10K, 0.058 -> 0.058)
function formatBalance(balance: number, symbol: string) {
  if (balance >= 10000) return `${(balance / 1000).toFixed(0)}K ${symbol}`;
  if (balance >= 1) return `${balance.toFixed(3)} ${symbol}`;
  if (balance > 0) return `${balance.toPrecision(3)} ${symbol}`;
  return `0 ${symbol}`;
}

interface OnChainActivitiesProps { refreshKey?: number; }
const OnChainActivities: React.FC<OnChainActivitiesProps> = ({ refreshKey = 0 }) => {
  const { data: session } = useSession();
  const twitterId = (session?.user as any)?.id || (session?.user as any)?.twitter_id || '';
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoCache, setLogoCache] = useState<Record<string, string>>({});
  const fetchingSymbols = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!twitterId) return;
    let retryInterval: NodeJS.Timeout | null = null;
    const fetchAssets = async () => {
      try {
        setLoading(true);
        // 1. Fetch all wallets for the user
        const walletsRes = await axios.get(`${API_BASE}/userwallets/${twitterId}`);
        const walletsArr = ((walletsRes.data as any).wallets || []) as Array<{wallet_address: string, chain: string}>;
        // 2. For each wallet, fetch balances
        let allTokens: any[] = [];
        let uniqueSymbols = new Set<string>();
        for (const w of walletsArr) {
          const balancesRes = await axios.get(`${API_BASE}/balances/address/${w.wallet_address}`);
          const balances = (balancesRes.data as any).balances;
          for (const chain in balances) {
            for (const token of balances[chain]) {
              allTokens.push({
                name: token.name,
                symbol: token.symbol,
                chain: chain.charAt(0).toUpperCase() + chain.slice(1),
                price: token.price, // number
                balance: token.balance, // number
                value: token.usd, // number
                priceChange: token.priceChange24h, // number
                balanceChange: token.balanceChange24h !== undefined ? token.balanceChange24h : undefined, // if available
                sentimentChange: token.sentimentChange24h !== undefined ? token.sentimentChange24h : undefined, // if available
                sentiment: token.sentiment !== undefined ? token.sentiment : undefined, // if available
                icon: '', // will be filled in below
              });
              if (token.symbol) uniqueSymbols.add(token.symbol.toLowerCase());
            }
          }
        }
        // 3. Throttled icon fetches (5 at a time), only for missing icons
        const newLogoCache: Record<string, string> = { ...logoCache };
        const toFetch = Array.from(uniqueSymbols).filter(symbol => !newLogoCache[symbol]);
        await throttleAll(
          toFetch.map((symbol) => async () => {
            try {
              const logoRes = await axios.get(`${API_BASE}/tokens/cmc?symbol=${symbol}`);
              if (logoRes.data && typeof logoRes.data === 'object' && 'logo' in logoRes.data && typeof logoRes.data.logo === 'string' && logoRes.data.logo) {
                newLogoCache[symbol] = logoRes.data.logo;
              }
            } catch {}
          }),
          5 // concurrency limit
        );
        setLogoCache(newLogoCache);
        // 4. Attach logos to tokens from cache
        allTokens = allTokens.map(t => ({ ...t, icon: newLogoCache[t.symbol?.toLowerCase()] || '' }));
        setAssets(allTokens);
        setLoading(false);

        // 5. Periodic retry for missing icons every 5 seconds
        if (retryInterval) clearInterval(retryInterval);
        retryInterval = setInterval(async () => {
          const missingSymbols = Array.from(uniqueSymbols).filter(symbol => !newLogoCache[symbol]);
          if (missingSymbols.length === 0) return;
          await throttleAll(
            missingSymbols.map(symbol => async () => {
              try {
                const logoRes = await axios.get(`${API_BASE}/tokens/cmc?symbol=${symbol}`);
                if (logoRes.data && typeof logoRes.data === 'object' && 'logo' in logoRes.data && typeof logoRes.data.logo === 'string' && logoRes.data.logo) {
                  newLogoCache[symbol] = logoRes.data.logo;
                  setLogoCache({ ...newLogoCache });
                }
              } catch {}
            }),
            5
          );
        }, 5000);
      } catch {
        setAssets([]);
        setLoading(false);
      }
    };
    fetchAssets();
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
    // eslint-disable-next-line
  }, [twitterId, refreshKey]);

  // Recompute assets with new logos whenever logoCache changes
  useEffect(() => {
    setAssets(prevAssets => prevAssets.map(t => ({ ...t, icon: logoCache[t.symbol?.toLowerCase()] || '' })));
  }, [logoCache]);

  return (
    <div className="bg-[#181A20] border border-[#23272b]  rounded-2xl p-4 shadow-lg w-full h-full flex flex-col min-h-[320px] relative">
      {/* Preloader overlay */}
      <div className={`absolute inset-0 flex items-center justify-center bg-[#181A20] transition-opacity duration-500 z-20 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <img src="/icons/preloader.gif" alt="Loading..." style={{ width: 200, height: 160 }} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-white">Portfolio Overview</div>
        <span className="text-[#A259FF] text-sm flex items-center gap-1">
          Total Assets
          <span className="ml-2 bg-violet-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full align-middle inline-block">{assets.length}</span>
        </span>
      </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-[#A259FF]/40 scrollbar-track-transparent flex-1">
        <table className="min-w-full text-sm text-left align-middle">
          <thead>
            <tr className="text-[#A3A3A3] border-b border-[#23262F]">
              <th className="py-2 px-2 font-medium text-left">Asset</th>
              <th className="py-2 px-2 font-medium text-left">Price</th>
              <th className="py-2 px-2 font-medium text-left">Holdings</th>
              <th className="py-2 px-2 font-medium text-left">Value</th>
              <th className="py-2 px-2 font-medium text-center">Δ Price</th>
              <th className="py-2 px-2 font-medium text-center">Δ Sentiment</th>
              <th className="py-2 px-2 font-medium text-center">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
              <tr key={asset.symbol + asset.chain + idx} className="border-b border-[#23262F] last:border-0 hover:bg-[#23262F]/40 transition">
                <td className="py-2 px-2 flex items-center gap-2 justify-start">
                  {asset.icon ? (
                    <img src={asset.icon} alt={asset.symbol} className="w-6 h-6 rounded-full object-contain" />
                  ) : (
                    <span className="text-2xl">{asset.symbol ? asset.symbol[0] : '?'}</span>
                  )}
                  <div>
                    <div className="text-white font-medium">{asset.name}</div>
                    <div className="text-xs text-[#A3A3A3]">{asset.symbol} <span className="text-[#666]">({asset.chain})</span></div>
                  </div>
                </td>
                <td className="py-2 px-2 text-white text-left align-middle">{asset.price !== undefined ? `$${Number(asset.price).toLocaleString(undefined, { maximumFractionDigits: 4 })}` : '--'}</td>
                <td className="py-2 px-2 text-white text-left align-middle">{asset.balance !== undefined && asset.symbol ? formatBalance(Number(asset.balance), asset.symbol) : '--'}</td>
                <td className="py-2 px-2 text-white text-left align-middle">{asset.value !== undefined ? `$${Number(asset.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}</td>
                <td className={`py-2 px-2 font-semibold text-center align-middle ${asset.priceChange !== undefined && parseFloat(asset.priceChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{asset.priceChange !== undefined ? `${asset.priceChange >= 0 ? '+' : ''}${Number(asset.priceChange).toFixed(2)}` : '--'}</td>
                <td className={`py-2 px-2 font-semibold text-center align-middle`}>{asset.sentimentChange !== undefined ? asset.sentimentChange : '--'}</td>
                <td className="py-2 px-2 text-center align-middle">
                  {/* Placeholder for circular progress */}
                  <div className="relative w-10 h-10 flex items-center justify-center m-auto">
                    <svg className="absolute top-0 left-0" width="40" height="40">
                      <circle cx="20" cy="20" r="18" stroke="#23262F" strokeWidth="4" fill="none" />
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke={asset.sentiment !== undefined && asset.sentiment >= 50 ? '#22c55e' : '#ef4444'}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="113"
                        strokeDashoffset={asset.sentiment !== undefined ? 113 - (asset.sentiment / 100) * 113 : 113}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-white text-xs font-bold z-10">{asset.sentiment !== undefined ? `${asset.sentiment}%` : '--'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OnChainActivities; 