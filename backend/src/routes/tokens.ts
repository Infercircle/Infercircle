import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import { token } from "../interfaces/tokens";
import dotenv from "dotenv";
import { asyncHandler } from "../lib/helper";

dotenv.config();

const router = Router();

const CMC_API_KEY = process.env.CMC_API_KEY as string;
const BASE_URL_CMC = "https://pro-api.coinmarketcap.com";

// Health check
router.get("/", (req: Request, res: Response) => {
  res.send("Tokens API Server 🚀");
});

// Search for tokens by symbol, token address, slug(coinmarketcap special names for token), or id(coinmarketcap token id)
router.get("/search", asyncHandler(async (req: Request, res: Response) => {
  const { symbol, slug, address, id } = req.query;
  const params = [symbol, slug, address, id];
  const definedParamsCount = params.filter(Boolean).length;

  if (definedParamsCount > 1) {
    return res.status(400).json({ error: "Only one query parameter is allowed: symbol, slug, address, or id." });
  }

  if (!symbol && !slug && !address && !id) {
    return res.status(400).json({ error: "Query parameters 'symbol', 'slug', 'address', or 'id' is required" });
  }
  try {
    const token = await fetch(`${BASE_URL_CMC}/v1/cryptocurrency/info` + `${symbol? `?symbol=${symbol}`  : slug ? `?slug=${slug}`  : address ? `?address=${address}` : id ? `?id=${id}` : ""}`, {
      method: "GET",
      headers: {
        "X-CMC_PRO_API_KEY": CMC_API_KEY,
      },
    });
    const response = (await token.json());
    if(response.status.error_code !== 0) {
      return res.status(response.status.error_code).json({ error: response.status.error_message });
    }
    const tokenData = response.data[Object.keys(response.data)[0]];
    const tokenReturnDTO: token = {
      id: tokenData.id,
      name: tokenData.name,
      description: tokenData.description,
      symbol: tokenData.symbol,
      logo: tokenData.logo,
      tokenAddress: tokenData.platform ? tokenData.platform.token_address : "",
      chain:{
        name: tokenData.platform ? tokenData.platform.name : "",
        id: tokenData.platform ? tokenData.platform.id : "",
        symbol: tokenData.platform ? tokenData.platform.symbol : "",
      },
      explorer: tokenData.urls.explorer[0],
      twitter: tokenData.urls.twitter[0],
    }
    res.status(200).json(tokenReturnDTO);
  } catch (error) {
    console.error("Error fetching token data:", error);
    res.status(500).json({ error: "Failed to fetch token details" });
  }
}));

// GET /tokens - List tokens (latest, trending, most-visited, gainers-losers, or by category)
router.get("/tokens", asyncHandler(async (req: Request, res: Response) => {
  const { type, category } = req.query;
  let url = "";

  if (type === "trending") {
    url = `${BASE_URL_CMC}/v1/cryptocurrency/trending/latest`;
  } else if (type === "most-visited") {
    url = `${BASE_URL_CMC}/v1/cryptocurrency/trending/most-visited`;
  } else if (type === "gainers-losers") {
    url = `${BASE_URL_CMC}/v1/cryptocurrency/trending/gainers-losers`;
  } else if (category) {
    url = `${BASE_URL_CMC}/v1/cryptocurrency/category?category=${category}`;
  } else {
    url = `${BASE_URL_CMC}/v1/cryptocurrency/listings/latest`;
  }

  try {
    const response = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching tokens list:", error);
    res.status(500).json({ error: "Failed to fetch tokens list" });
  }
}));

// GET /tokens/:id/sparkline - 7-day price sparkline for a token
router.get("/tokens/:id/sparkline", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const url = `${BASE_URL_CMC}/v2/cryptocurrency/ohlcv/historical?id=${id}&count=7&interval=1d`;
  try {
    const response = await fetch(url, {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY }
    });
    const data = await response.json();
    console.log('CMC OHLCV data for id', id, ':', JSON.stringify(data)); // Debug log
    // Extract closing prices
    const quotes = data.data && data.data[id]?.quotes ? data.data[id].quotes : [];
    const prices = quotes.map((q: any) => q.close);
    res.json({ prices });
  } catch (error) {
    console.error("Error fetching sparkline data:", error);
    res.status(500).json({ error: "Failed to fetch sparkline data" });
  }
}));

// GET /tokens/:id/coingecko-sparkline - 7-day price sparkline from CoinGecko
router.get("/tokens/:id/coingecko-sparkline", asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // CoinGecko id, e.g., 'bitcoin'
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}&sparkline=true`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0 && data[0].sparkline_in_7d) {
      res.json({ prices: data[0].sparkline_in_7d.price });
    } else {
      res.json({ prices: [] });
    }
  } catch (error) {
    console.error("Error fetching CoinGecko sparkline data:", error);
    res.status(500).json({ error: "Failed to fetch CoinGecko sparkline data" });
  }
}));

export default router;