import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mediumRoutes from "./routes/medium";
import twitterRoutes from "./routes/twitter";
import tokenRoutes from "./routes/tokens";

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

// Mount Twitter routes at /twitter
app.use("/twitter", twitterRoutes);
app.use("/medium", mediumRoutes);
app.use("/tokens", tokenRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("API Server Running 🚀");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
