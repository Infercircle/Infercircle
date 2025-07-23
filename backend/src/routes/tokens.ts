import { Router, Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { asyncHandler } from "../lib/helper";
import { token } from "../interfaces/tokens";

dotenv.config();

const router = Router();


router.get("/search", asyncHandler(async (req: Request, res: Response) => {
  const { symbol, id, address } = req.query;
  if ([symbol, id, address].filter(Boolean).length !== 1) {
    return res.status(400).json({ error: "Provide exactly one of: symbol, id, or address." });
  }

  try {
    let coinData;
    if (symbol) {
      // 1. Get all coins, find by symbol
      const listRes = await fetch("https://api.coingecko.com/api/v3/coins/list");
      const coins = await listRes.json();
      const match = coins.find((c: any) => c.symbol.toLowerCase() === String(symbol).toLowerCase());
      if (!match) {
        return res.status(404).json({ error: `No coin found with symbol '${symbol}'` });
      }
      // 2. Fetch details by id
      const detailsRes = await fetch(`https://api.coingecko.com/api/v3/coins/${match.id}`);
      if (!detailsRes.ok) {
        return res.status(404).json({ error: `No details found for symbol '${symbol}'` });
      }
      coinData = await detailsRes.json();
    } else if (id) {
      const detailsRes = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
      if (!detailsRes.ok) {
        return res.status(404).json({ error: `No details found for id '${id}'` });
      }
      coinData = await detailsRes.json();
    } else if (address) {
      // Only Ethereum supported here
      const detailsRes = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`);
      if (!detailsRes.ok) {
        return res.status(404).json({ error: `No details found for address '${address}'` });
      }
      coinData = await detailsRes.json();
    }

    // Compose DTO
    const tokenReturnDTO = {
      id: coinData.id,
      name: coinData.name,
      description: coinData.description?.en || "",
      symbol: coinData.symbol,
      logo: coinData.image?.large || coinData.image?.thumb || "",
      tokenAddress: coinData.platforms?.ethereum || "",
      chain: {
        name: "ethereum",
        id: "1",
        symbol: "ETH",
      },
      explorer: coinData.links?.blockchain_site?.[0] || "",
      twitter: coinData.links?.twitter_screen_name
        ? `https://twitter.com/${coinData.links.twitter_screen_name}`
        : "",
    };
    res.status(200).json(tokenReturnDTO);
  } catch (error) {
    console.error("Error fetching token data:", error);
    res.status(500).json({ error: "Failed to fetch token details" });
  }
}));

// Change the CoinGecko proxy endpoint from /tokens/coingecko to /asset
router.get("/assets", async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const per_page = Number(req.query.per_page) || 100;
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page,
        page,
        sparkline: true,
        price_change_percentage: "1h,24h,7d"
      },
      headers: {
        // If you have a CoinGecko API key, uncomment below and set COINGECKO_API_KEY in your env
        // 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("CoinGecko fetch error:", error);
    res.status(500).json({ error: "Failed to fetch from CoinGecko" });
  }
});

// CMC logo/info proxy
router.get('/cmc', asyncHandler(async (req: Request, res: Response) => {
  let { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') return res.status(400).json({ error: 'symbol is required' });
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/info', {
      params: { symbol },
      headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
    });
    const data = (response.data as any).data[symbol.toUpperCase()];
    if (!data) return res.status(404).json({ error: 'Token not found' });
    res.json({ logo: data.logo, name: data.name, symbol: data.symbol });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from CMC' });
  }
}));

export default router;