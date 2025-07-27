import { Router, Request, Response, RequestHandler } from "express";
import { TwitterAuthor, TwitterAuthorCreate } from "../interfaces/tweets";
import { asyncHandler } from "../lib/helper";
import { TwitterAuthorService } from "../services/supabase";

const router = Router();
const authorService = new TwitterAuthorService();

// Helper: format relative time like "2m ago"
function getRelativeTime(timestamp: string) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = (now.getTime() - then.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Parse keywords from the rule_value string
function extractKeywords(ruleValue: string) {
  return ruleValue
    .split(/OR|,/i)
    .map((kw) => kw.trim())
    .filter((kw) => kw.length > 0);
}

// Extract matched keyword from tweet text
function findMatchedKeyword(tweetText: string, keywordList: string[]) {
  const lowerText = tweetText.toLowerCase();
  let firstKeyword = "N/A";
  let firstIndex = Infinity;
  for (const kw of keywordList) {
    const idx = lowerText.indexOf(kw.toLowerCase());
    if (idx !== -1 && idx < firstIndex) {
      firstIndex = idx;
      firstKeyword = kw;
    }
  }
  return firstKeyword;
}

// Health check
router.get("/", (req: Request, res: Response) => {
  res.send("Crypto Twitter Feed Server 🚀");
});

// Webhook GET (test)
router.get("/webhook", (req: Request, res: Response) => {
  res.send("Twitter Webhook Active ✅");
});

// Webhook POST: Save only authors to DB
router.post("/webhook", asyncHandler(async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.tweets || !Array.isArray(payload.tweets)) {
      return res.status(200).send("No valid tweets found");
    }
    // Extract unique authors from tweets
    const authorsMap: Record<string, TwitterAuthorCreate> = {};
    for (const tweet of payload.tweets) {
      if (tweet.author && tweet.author.id && tweet.author.userName) {
        authorsMap[tweet.author.id] = {
          id: tweet.author.id,
          username: tweet.author.userName,
        };
      }
    }
    const authors = Object.values(authorsMap);
    if (authors.length > 0) {
      await authorService.upsertAuthors(authors);
    }
    res.status(200).send("Authors processed successfully");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).send("Webhook error caught");
  }
}));

// Client endpoint to fetch stored authors
router.get("/authors", asyncHandler(async(req: Request, res: Response) => {
  const authors = await authorService.getAuthors();
  return res.status(200).json({
    status: "success",
    count: authors.length,
    data: authors,
  });
}));

// Client endpoint to fetch tweets from twitterapi.io (unchanged)
router.get("/tweets", asyncHandler(async(req: Request, res: Response) => {
  const { query } = req.query;

  if (query && typeof query === "string") {
    const lowerQuery = query.toLowerCase();
    const getTweets = await fetch(`https://api.twitterapi.io/twitter/tweet/advanced_search?queryType=Latest&query=${lowerQuery}`, {
      method: "GET",
      headers: {
        'X-API-Key': process.env.X_API_KEY || "",
      }
    });
    const TweetsJson = await getTweets.json();
    console.log("TweetsJson", TweetsJson);
    if (!TweetsJson || !TweetsJson.tweets || !Array.isArray(TweetsJson.tweets)) {
      return res.status(400).json({
        status: "error",
        message: "No tweets found for the given query",
      });
    }
    const newTweets = TweetsJson.tweets.map((tweet: any) => {
      return {
        matchedRule: lowerQuery.toUpperCase(),
        name: tweet.author?.name || "unknown",
        text: tweet.text,
        tweetUrl: tweet.url || tweet.twitterUrl || "https://twitter.com",
        timestamp: getRelativeTime(tweet.createdAt),
      };
    });
    
    return res.status(200).json({
      status: "success",
      data: newTweets,
    });
  }

  return res.status(400).json({
    status: "error",
    message: "Query parameter is required",
  });
}));

export default router;