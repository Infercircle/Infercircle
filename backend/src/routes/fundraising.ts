import { Router, Request, Response } from "express";
import { asyncHandler } from "../lib/helper";
import fetch from "node-fetch";

const router = Router();

// Proxy endpoint for CryptoRank funding rounds with tiered investors
router.get("/funding-rounds/:coinKey", asyncHandler(async (req: Request, res: Response) => {
  try {
    const { coinKey } = req.params;
    
    const response = await fetch(`https://api.cryptorank.io/v0/funding-rounds/with-tiered-investors/by-coin-key/${coinKey}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Infercircle/1.0)'
      }
    });

    if (!response.ok) {
      // If the tiered endpoint fails, try the fallback
      const fallbackResponse = await fetch(`https://api.cryptorank.io/v0/coins/${coinKey}/funds-and-backers`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Infercircle/1.0)'
        }
      });

      if (!fallbackResponse.ok) {
        throw new Error(`CryptoRank API error: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      }

      const fallbackData = await fallbackResponse.json();
      return res.status(200).json({
        status: "success",
        data: fallbackData,
        source: "fallback"
      });
    }

    const data = await response.json();
    
    res.status(200).json({
      status: "success",
      data: data,
      source: "primary"
    });

  } catch (error) {
    console.error('Error fetching CryptoRank data:', error);
    res.status(500).json({ 
      error: "Failed to fetch CryptoRank data",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Proxy endpoint for CryptoRank funds and backers (fallback)
router.get("/coins/:coinKey/funds-and-backers", asyncHandler(async (req: Request, res: Response) => {
  try {
    const { coinKey } = req.params;
    
    const response = await fetch(`https://api.cryptorank.io/v0/coins/${coinKey}/funds-and-backers`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Infercircle/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`CryptoRank API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    res.status(200).json({
      status: "success",
      data: data
    });

  } catch (error) {
    console.error('Error fetching CryptoRank funds and backers:', error);
    res.status(500).json({ 
      error: "Failed to fetch CryptoRank funds and backers",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;
