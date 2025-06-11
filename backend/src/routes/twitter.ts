import { Router, Request, Response, RequestHandler } from "express";
import { Tweet } from "../interfaces/tweets";
import { asyncHandler } from "../lib/helper";


const router = Router();

// In-memory store (latest 100 tweets)
let tweets: Tweet[] = [];

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

// Webhook POST
router.post("/webhook", ((req: Request, res: Response) => {
  try {
    const payload = req.body;

    console.log("Received webhook payload:", payload);

    if (!payload.tweets || !Array.isArray(payload.tweets)) {
      return res.status(200).send("No valid tweets found");
    }

    const ruleValue = payload.rule_value || "";
    const keywordList = extractKeywords(ruleValue);

    const newTweets: Tweet[] = payload.tweets.map((tweet: any) => {
      const matched = findMatchedKeyword(tweet.text || "", keywordList);
      return {
        matchedRule: matched.toUpperCase(),
        name: tweet.author?.name || "unknown",
        text: tweet.text,
        tweetUrl: tweet.url || tweet.twitterUrl || "https://twitter.com",
        timestamp: getRelativeTime(tweet.createdAt),
      };
    });

    tweets = [...newTweets, ...tweets].slice(0, 100);

    res.status(200).send("Tweets processed successfully");
  } catch (err) {
    res.status(200).send("Webhook error caught");
  }
}) as RequestHandler);

// Client endpoint to fetch stored tweets
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
    const newTweets: Tweet[] = TweetsJson.tweets.map((tweet: any) => {
      return {
        matchedRule: lowerQuery.toUpperCase(),
        name: tweet.author?.name || "unknown",
        text: tweet.text,
        tweetUrl: tweet.url || tweet.twitterUrl || "https://twitter.com",
        timestamp: getRelativeTime(tweet.createdAt),
      };
    })
    return res.status(200).json({
      status: "success",
      data: newTweets,
    });
  }

  return res.status(200).json({
    status: "success",
    count: tweets.length,
    data: tweets,
  });
}));


export default router;