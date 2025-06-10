import { Router, Request, Response } from "express";
import axios from "axios";
import { token } from "../interfaces/tokens";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const CMC_API_KEY = process.env.CMC_API_KEY as string;
const BASE_URL_CMC = "https://pro-api.coinmarketcap.com";

// Health check
router.get("/", (req: Request, res: Response) => {
  res.send("Tokens API Server 🚀");
});

// Search for tokens by symbol, token address, slug(coinmarketcap special names for token), or id(coinmarketcap token id)
router.get("/search", async (req: Request, res: Response) => {
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
});


export default router;