import { Router, Request, Response } from "express";
import axios from "axios";
import { Article } from "../interfaces/article";


const router = Router();

const BaseURL = "https://data-api.coindesk.com";

// Health check
router.get("/", (req: Request, res: Response) => {
  res.send("Medium API Server 🚀");
});

// Search for articles by any query from a source
router.get("/search", async (req, res) => {
  const { source, query, lang } = req.query;
  try {
    const response = await fetch(`${BaseURL}/news/v1/search?source_key=${source}&search_string=${query}&lang=${lang}`);
    const data = await response.json();
    if (data.Err && data.Data.length<=0) {
        return res.status(500).json({ error: data.Err.message || "Failed to fetch articles" });
    }
    const articles: Article[] = data.Data.map((article) => ({
        id: article.ID,
        title: article.TITLE,
        url: article.URL,
        author: {
            name: article.AUTHORS
        },
        publication: {
            id: article.SOURCE_DATA.ID,
            name: article.SOURCE_DATA.NAME,
            url: article.SOURCE_DATA.URL,
        },
        date: new Date(article.PUBLISHED_ON).toLocaleString(),
        content: article.BODY,
        summary: article.SUBTITLE,
        sentiment: article.SENTIMENT
    }));
    res.status(200).json({ data: articles });
  } catch (error) {
    console.log("-----------------------------------------------");
    console.log("error message", error);
    res.status(500).json({ error: "Failed to search Medium articles" });
  }
});

export default router;