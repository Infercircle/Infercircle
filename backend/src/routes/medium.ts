import { Router, Request, Response } from "express";
import axios from "axios";
import { MediumArticle } from "../interfaces/medium";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY as string;
const RAPIDAPI_HOST = "medium2.p.rapidapi.com";

// Health check
router.get("/", (req: Request, res: Response) => {
  res.send("Medium API Server 🚀");
});

// Search for articles by tags (e.g., "blockchain,defi,data-science")
router.get("/search", async (req: Request, res: Response) => {
  const tags = (req.query.q as string) || "blockchain,defi,data-science";
  try {
    // Fetch article IDs for each tag
    const tagList = tags.split(",").map((tag) => tag.trim());
    let articleIds: string[] = [];
    for (const tag of tagList) {
      if (!tag) continue;
      const url = `https://medium2.p.rapidapi.com/topfeeds/${tag}/new`;
      const response = await axios.get(url, {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      });
      const data = response.data as { topfeeds?: string[] };
      if (data && Array.isArray(data.topfeeds)) {
        articleIds.push(...data.topfeeds);
      }
    }
    // Remove duplicate IDs
    articleIds = Array.from(new Set(articleIds));
    // Fetch article details for each ID (limit to 10 for speed)
    const articleDetailPromises = articleIds.slice(0, 10).map((id) =>
      axios
        .get(`https://medium2.p.rapidapi.com/article/${id}`, {
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
        })
        .then((r) => r.data)
        .catch(() => null)
    );
    const articles = (await Promise.all(articleDetailPromises)).filter(
      (a: MediumArticle | null): a is MediumArticle => a !== null
    );

    res.json({ data: articles });
  } catch (error) {
    res.status(500).json({ error: "Failed to search Medium articles" });
  }
});

// Get article info by articleId
router.get("/article/:articleId", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    const response = await axios.get(
      `https://medium2.p.rapidapi.com/article/${articleId}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch article info" });
  }
});

// Get article content by articleId
router.get(
  "/article/:articleId/content",
  async (req: Request, res: Response) => {
    const { articleId } = req.params;
    try {
      const response = await axios.get(
        `https://medium2.p.rapidapi.com/article/${articleId}/content`,
        {
          headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": RAPIDAPI_HOST,
          },
        }
      );
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article content" });
    }
  }
);

// Get user info by userId
router.get("/user/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const response = await axios.get(
      `https://medium2.p.rapidapi.com/user/${userId}`,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

export default router;