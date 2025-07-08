import { Router, Request, Response } from "express";
import { asyncHandler } from "../lib/helper";
import * as vader from "vader-sentiment";

const router = Router();


router.get("/", (req, res) => {
  res.send("Mindshare API Server 🚀");
});

router.post("/",asyncHandler(async(req: Request, res: Response)=>{
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Data is required" });
    }
    let score = 0;
    data.forEach((input: string) => {
        const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(JSON.stringify(input));
        score += intensity.compound;
        console.log("Sentiment intensity:", intensity);
    });
    res.json({ score });
}));

export default router;