import express, { Request, Response } from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      "https://api.coinmarketcap.com/chatbot/v3/question/fixed-question?scenario=homepage&langCode=en",
      {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en,en-US;q=0.9,ig;q=0.8,ru;q=0.7',
          'Cache-Control': 'no-cache',
          'Origin': 'https://coinmarketcap.com',
          'Platform': 'web',
          'Referer': 'https://coinmarketcap.com/',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching CoinMarketCap suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suggestions',
    });
  }
});

export default router; 