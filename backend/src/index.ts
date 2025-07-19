import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mediumRoutes from "./routes/medium";
import twitterRoutes from "./routes/twitter";
import articleRoutes from "./routes/article";
import tokenRoutes from "./routes/tokens";
import ytRoutes from "./routes/Youtube";
import twitterspacesRoutes from "./routes/twitterspaces";
import eliteCuratorsRoutes from "./routes/eliteCurators";
import { automationManager } from "./automation";
import suggestionsRoutes from "./routes/suggestions";

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
app.use("/yt", ytRoutes);
app.use("/twitterspaces", twitterspacesRoutes);
app.use("/elite-curators", eliteCuratorsRoutes);

app.use("/suggestions", suggestionsRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("API Server Running 🚀");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  
  // Start Elite Curators automation after server starts
  // setTimeout(() => {
  //   console.log('🤖 Starting Elite Curators automation...');
  //   automationManager.start().catch(error => {
  //     console.error('Failed to start automation:', error);
  //   });
  // }, 5000); // Wait 5 seconds for server to fully start
});
