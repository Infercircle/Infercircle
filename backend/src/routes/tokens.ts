import { Router, Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import { asyncHandler } from "../lib/helper";
import { token } from "../interfaces/tokens";

dotenv.config();

const router = Router();


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
    const token = await fetch(`https://api.coingecko.com/api/v3/coins/list` + `${symbol? `?symbol=${symbol}`  : slug ? `?slug=${slug}`  : address ? `?address=${address}` : id ? `?id=${id}` : ""}`, {
      method: "GET",
      headers: {
        // If you have a CoinGecko API key, uncomment below and set COINGECKO_API_KEY in your env
        // 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
      },
    });
    const response = (await token.json());
    if(response.status.error_code !== 0) {
      return res.status(response.status.error_code).json({ error: response.status.error_message });
    }
    const tokenData = response.data[Object.keys(response.data)[0]];
    const tokenReturnDTO = {
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

export default router;