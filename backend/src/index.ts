import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mediumRoutes from "./routes/medium";
import twitterRoutes from "./routes/twitter";
import articleRoutes from "./routes/article";
import tokenRoutes from "./routes/tokens";
import mindShare from "./routes/mindshare";
import ytRoutes from "./routes/Youtube";
import twitterspacesRoutes from "./routes/twitterspaces";
import eliteCuratorsRoutes from "./routes/eliteCurators";
import suggestionsRoutes from "./routes/suggestions";
import balancesRoutes from "./routes/balances";
import { startMindShareCalculation } from "./lib/worker";
import { cacheWarmupService } from "./services/cacheWarmup";
dotenv.config();

const app: Application = express();

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

const port = process.env.PORT;

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount routes
app.use("/twitter", twitterRoutes);
app.use("/medium", mediumRoutes);
app.use("/article", articleRoutes);
app.use("/tokens", tokenRoutes);
app.use("/mindshare", mindShare);
app.use("/yt", ytRoutes);
app.use("/twitterspaces", twitterspacesRoutes);
app.use("/elite-curators", eliteCuratorsRoutes);
app.use("/balances", balancesRoutes);
app.use("/suggestions", suggestionsRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("API Server Running 🚀");
});


if(process.env.NODE_ENV === "PRODUCTION") {
  startMindShareCalculation();
}
setInterval(startMindShareCalculation, 24 * 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log('🔥 Initializing tweet cache warmup service...');
  cacheWarmupService.startPeriodicWarmup(30); // Warmup every 30 minutes
});

