import { NextResponse } from "next/server";

const SOURCES = {
  wallchain: "https://api.wallchain.xyz/voices/companies/cards",
  breadcrumb: "https://www.breadcrumb.cash/api/leaderboard",
  alphabot: "https://www.alphabot.app/api/pulse",
  lurkyActive: "https://lurky.app/api/campaigns",
  lurkyEnded: "https://lurky.app/api/campaigns/ended",
  gomtuYapping: "https://gomtu.xyz/data/yapping-rewards.json",
  gomtuKaitoLeaderboard: "https://gomtu.xyz/api/kaito/leaderboard",
};

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error: any) {
    return { error: true, message: error?.message || "Failed to fetch" };
  }
}

export async function GET() {
  const [wallchain, breadcrumb, alphabot, lurkyActive, lurkyEnded, gomtuYapping, gomtuKaitoLeaderboard] = await Promise.all([
    fetchJson(SOURCES.wallchain),
    fetchJson(SOURCES.breadcrumb),
    fetchJson(SOURCES.alphabot),
    fetchJson(SOURCES.lurkyActive),
    fetchJson(SOURCES.lurkyEnded),
    fetchJson(SOURCES.gomtuYapping),
    fetchJson(SOURCES.gomtuKaitoLeaderboard),
  ]);

  return NextResponse.json({
    sources: SOURCES,
    data: {
      wallchain,
      breadcrumb,
      alphabot,
      lurky: {
        active: lurkyActive,
        ended: lurkyEnded,
      },
      gomtu: {
        yappingRewards: gomtuYapping,
        kaitoLeaderboard: gomtuKaitoLeaderboard,
      },
    },
    updatedAt: new Date().toISOString(),
  });
}


