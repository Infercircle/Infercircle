import { Router, Request, Response } from "express";
import { asyncHandler } from "../lib/helper";
import * as vader from "vader-sentiment";
import { getSentiment } from "../lib/worker";

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

router.post("/addAsset", asyncHandler(async(req: Request, res: Response) => {
    const { assets }:{ assets: {id: string, symbol: string, name: string, image: string, blockchain: string, address: string}[]} = req.body;
    if (!assets || !Array.isArray(assets)) {
      return res.status(400).json({ error: "Assets array is required" });
    }
    try {
      const batches = [];
      const batchSize = 8;

      for(let i =0; i<assets.length; i+=batchSize){
        let tempBatch = assets.slice(i, i+batchSize);
        batches.push(tempBatch);
      }

        // tempBatch.forEach(asset => {
        //   if (!asset.image || asset.image === "") {
        //   }
        // });
        // batch => getSentiment(batch)
      const results = await Promise.all(batches.map(async(batch)=>{
        const updatedBatch = await Promise.all(batch.map(async(asset) => {
          if (!asset.image || asset.image === "") {
            try {
              const getImage = (asset.address && asset.address.length>0) ? await fetch(`https://api.coingecko.com/api/v3/coins/${asset.blockchain.toLowerCase().replace(/_/g, '-')}/contract/${asset.address}`):
                              await fetch(`https://api.coingecko.com/api/v3/coins/${asset.name.toLowerCase()}`);
              if (!getImage.ok) {
                throw new Error(`Failed to fetch image for ${asset.name}`);
              }
              const data = await getImage.json();
              if (data.image && data.image.large) {
                asset.image = data.image.large;
              }
              return {
                id: asset.id,
                name: asset.name,
                symbol: asset.symbol,
                image: asset.image,
              };
            } catch (error) {
            const logoRes = await axios.get(`${process.env.BASE_URL}/tokens/cmc?symbol=${asset.symbol}`);
            if (logoRes.data && (logoRes.data as any).logo) {
              return {
                id: asset.id,
                name: asset.name,
                symbol: asset.symbol,
                image: (logoRes.data as any).logo,
              };
            }
              return {
                id: asset.id,
                name: asset.name,
                symbol: asset.symbol,
                image: "", // Fallback image
              };
            }
          } else {
            return {
              id: asset.id,
              name: asset.name,
              symbol: asset.symbol,
              image: asset.image
            };
          }
        }));
        return getSentiment(updatedBatch);
      }));
      const flattenedResults = results.flat();

      res.status(201).json({results: flattenedResults});
    } catch (error) {
      console.error("Error creating/updating asset mindshare:", error);
      res.status(500).json({ error: "Failed to create/update asset mindshare" });
    }
}));

export default router;