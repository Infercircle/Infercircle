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
    
    // Setup headers for CoinGecko API calls
    const coinGeckoHeaders: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (process.env.COINGECKO_PRO_API_KEY) {
      coinGeckoHeaders['x-cg-pro-api-key'] = process.env.COINGECKO_PRO_API_KEY;
      console.log(`Using Pro API key for search: ${process.env.COINGECKO_PRO_API_KEY.substring(0, 10)}...`);
    } else {
      console.log(`No Pro API key found, using free tier for search`);
    }
    
    if (symbol) {
      // 1. Get all coins, find by symbol
      const listRes = await fetch("https://pro-api.coingecko.com/api/v3/coins/list", {
        headers: coinGeckoHeaders
      });
      const coins = await listRes.json();
      const match = coins.find((c: any) => c.symbol.toLowerCase() === String(symbol).toLowerCase());
      if (!match) {
        return res.status(404).json({ error: `No coin found with symbol '${symbol}'` });
      }
      // 2. Fetch details by id
      const detailsRes = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${match.id}`, {
        headers: coinGeckoHeaders
      });
      if (!detailsRes.ok) {
        return res.status(404).json({ error: `No details found for symbol '${symbol}'` });
      }
      coinData = await detailsRes.json();
    } else if (id) {
      const detailsRes = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${id}`, {
        headers: coinGeckoHeaders
      });
      if (!detailsRes.ok) {
        return res.status(404).json({ error: `No details found for id '${id}'` });
      }
      coinData = await detailsRes.json();
    } else if (address) {
      // Only Ethereum supported here
      const detailsRes = await fetch(`https://pro-api.coingecko.com/api/v3/coins/ethereum/contract/${address}`, {
        headers: coinGeckoHeaders
      });
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
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (process.env.COINGECKO_PRO_API_KEY) {
      headers['x-cg-pro-api-key'] = process.env.COINGECKO_PRO_API_KEY;
      console.log(`Using Pro API key for assets: ${process.env.COINGECKO_PRO_API_KEY.substring(0, 10)}...`);
    } else {
      console.log(`No Pro API key found, using free tier for assets`);
    }
    
    const response = await axios.get("https://pro-api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page,
        page,
        sparkline: true,
        price_change_percentage: "1h,24h,7d"
      },
      headers
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

// CMC price, rank, and change proxy
router.get('/cmc/price', asyncHandler(async (req: Request, res: Response) => {
  let { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') return res.status(400).json({ error: 'symbol is required' });
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: { symbol },
      headers: { 'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY }
    });
    const data = (response.data as any).data[symbol.toUpperCase()];
    if (!data) return res.status(404).json({ error: 'Token not found' });
    const quote = data.quote && data.quote.USD ? data.quote.USD : {};
    res.json({
      symbol: data.symbol,
      name: data.name,
      price: quote.price ?? null,
      rank: data.cmc_rank ?? null,
      change24h: quote.percent_change_24h ?? null
      // CMC does not provide supply distribution/percentage by holding in this endpoint
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price from CMC' });
  }
}));

// CoinGecko market chart data for price charts
router.get('/chart', asyncHandler(async (req: Request, res: Response) => {
  const { id, symbol, days = '365', vs_currency = 'usd' } = req.query;
  
  if (!id && !symbol) {
    return res.status(400).json({ error: 'Either id or symbol is required' });
  }

  try {
    let coinId = id as string;
    
    // Setup headers for CoinGecko API calls
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (process.env.COINGECKO_PRO_API_KEY) {
      headers['x-cg-pro-api-key'] = process.env.COINGECKO_PRO_API_KEY;
      console.log(`Using Pro API key for ${symbol || id}: ${process.env.COINGECKO_PRO_API_KEY.substring(0, 10)}...`);
    } else {
      console.log(`No Pro API key found, using free tier for ${symbol || id}`);
    }
    
    // If symbol is provided, we need to find the coin ID first
    if (symbol && !id) {
      console.log(`Looking up coin ID for symbol: ${symbol}`);
      const listRes = await fetch("https://pro-api.coingecko.com/api/v3/coins/list", {
        headers
      });
      
      if (!listRes.ok) {
        const errorText = await listRes.text();
        console.error(`Coin list API Error:`, errorText);
        return res.status(listRes.status).json({ 
          error: `Failed to fetch coin list`, 
          status: listRes.status,
          details: errorText 
        });
      }
      
      const coins = await listRes.json();
      const match = coins.find((c: any) => c.symbol.toLowerCase() === String(symbol).toLowerCase());
      if (!match) {
        console.log(`No coin found for symbol: ${symbol}`);
        return res.status(404).json({ error: `No coin found with symbol '${symbol}'` });
      }
      coinId = match.id;
      console.log(`Found coin ID: ${coinId} for symbol: ${symbol}`);
    }

    // Fetch market chart data with Pro API key
    
    const chartRes = await fetch(`https://pro-api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vs_currency}&days=${days}`, {
      headers
    });
    
    console.log(`Chart API Response Status: ${chartRes.status} for ${coinId}`);
    
    if (!chartRes.ok) {
      const errorText = await chartRes.text();
      console.error(`Chart API Error for ${coinId}:`, errorText);
      return res.status(chartRes.status).json({ 
        error: `No chart data found for '${coinId}'`, 
        status: chartRes.status,
        details: errorText 
      });
    }

    const chartData = await chartRes.json();
    console.log(`Chart data received for ${coinId}:`, {
      prices: chartData.prices?.length || 0,
      market_caps: chartData.market_caps?.length || 0,
      total_volumes: chartData.total_volumes?.length || 0
    });
    
    // Transform the data to a more usable format
    const transformedData = {
      prices: chartData.prices.map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
        date: new Date(timestamp).toISOString()
      })),
      market_caps: chartData.market_caps.map(([timestamp, marketCap]: [number, number]) => ({
        timestamp,
        marketCap,
        date: new Date(timestamp).toISOString()
      })),
      total_volumes: chartData.total_volumes.map(([timestamp, volume]: [number, number]) => ({
        timestamp,
        volume,
        date: new Date(timestamp).toISOString()
      }))
    };

    res.status(200).json(transformedData);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
}));

export default router;