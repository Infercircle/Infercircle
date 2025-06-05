const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

const port = 5000;

app.use(cors(corsOptions));
app.use(bodyParser.json());

// In-memory store (latest 100 tweets)
let tweets = [];

// Helper: format relative time like "2m ago"
function getRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = (now - then) / 1000;

  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// Parse keywords from the rule_value string
function extractKeywords(ruleValue) {
  return ruleValue
    .split(/OR|,/i)
    .map((kw) => kw.trim())
    .filter((kw) => kw.length > 0);
}

// Extract matched keyword from tweet text
function findMatchedKeyword(tweetText, keywordList) {
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
app.get("/", (req, res) => {
  res.send("Crypto Twitter Feed Server 🚀");
});

// Webhook GET (test)
app.get("/webhook", (req, res) => {
  res.send("Twitter Webhook Active ✅");
});

// Webhook POST
app.post("/webhook", (req, res) => {
  try {
    const payload = req.body;

    if (!payload.tweets || !Array.isArray(payload.tweets)) {
      return res.status(200).send("No valid tweets found");
    }

    const ruleValue = payload.rule_value || "";
    const keywordList = extractKeywords(ruleValue);

    const newTweets = payload.tweets.map((tweet) => {
      const matched = findMatchedKeyword(tweet.text || "", keywordList);
      return {
        matchedRule: matched.toUpperCase(), // ✅ fixed name here
        name: tweet.author?.name || "unknown",
        text: tweet.text,
        tweetUrl: tweet.url || tweet.twitterUrl || "https://twitter.com",
        timestamp: getRelativeTime(tweet.createdAt),
      };
    });

    tweets = [...newTweets, ...tweets].slice(0, 100);

    console.log(`✅ Added ${newTweets.length} tweets`);
    res.status(200).send("Tweets processed successfully");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(200).send("Webhook error caught");
  }
});

// Client endpoint to fetch stored tweets
app.get("/tweets", (req, res) => {
  res.status(200).json({
    status: "success",
    count: tweets.length,
    data: tweets,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
