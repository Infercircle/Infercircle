import axios from "axios";
import { createAssetMindShare, getAllAssetSentimentScores, getAssetById, createDailySentimentScore } from "./queries";

export async function startMindShareCalculation() {
    console.log("Starting the mindshare calculation............");
    // const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
    //   params: {
    //     vs_currency: "usd",
    //     order: "market_cap_desc",
    //     per_page: 200,
    //     page: 1,
    //     sparkline: true,
    //     price_change_percentage: "1h,24h,7d"
    //   },
    //   headers: {
    //     // If you have a CoinGecko API key, uncomment below and set COINGECKO_API_KEY in your env
    //     // 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
    //   }
    // });
    // console.log("GOT tokens...........");
    
    const data = await getAllAssetSentimentScores() as {"id": string, "symbol": string, "name": string, "image": string}[];
    // Filter unique assets by symbol
    const uniqueData = data.filter((asset, index, self) => 
      index === self.findIndex(a => a.symbol.toLowerCase() === asset.symbol.toLowerCase() && a.name.toLowerCase() === asset.name.toLowerCase())
    );

    console.log("Filtered unique assets: ", uniqueData.length);

    const batches = [];
    const batchSize = 8;

    for(let i =0; i<uniqueData.length; i+=batchSize){
      let tempBatch = uniqueData.slice(i, i+batchSize);
      await getSentiment(tempBatch);
      setTimeout(()=>{
        console.log(i+batchSize+" Done!");
      },5000);
    }
}

interface resultType {symbol: string, sentiment: string, image: string, positiveTweets: number, negativeTweets: number, neutralTweets: number }

// Helper function to calculate sentiment score from tweet counts
function calculateSentimentScore(positiveTweets: number, negativeTweets: number, neutralTweets: number): number {
    const SentimentIndex = (positiveTweets - negativeTweets) / (positiveTweets + neutralTweets + negativeTweets);
    const totalTweets = positiveTweets + negativeTweets + neutralTweets;
    if (totalTweets === 0) return 0;
    
    const mindshare = ((SentimentIndex*50) + 50).toFixed(2);
    
    return parseFloat(mindshare);
}

// Helper function to get today's date at midnight (for consistent daily records)
function getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

export async function getSentiment(data: { id: string, symbol: string, name: string, image?: string }[]): Promise<resultType[]> {
    console.log("getting sentiment for ",data.length);
    const result = await axios.post(`${process.env.BASE_URL}/twitter/sentiment-batch`, {
        assets: data.map(asset => ({ id: asset.id, symbol: asset.symbol, name: asset.name, image: asset.image }))
    });
    const Fresult = Object.values((result.data as any).results as {id: string, name: string, image: string, symbol: string, sentiment: string, positiveTweets: number, negativeTweets: number, neutralTweets: number}[]).flat();
    console.log("Got Fresult.....");

    let resultArray: resultType[] = [];
    const todayDate = getTodayDate();

    await Promise.all(Fresult.map(async(res)=>{
        try {
          if(!res.image || res.image === "") {
            const getAsset = await getAssetById(res.id);
            res.image = getAsset?.image || "";
          }
          
            // Update the main AssetSentiMentScore table
            await createAssetMindShare({
                id: res.id,
                name: res.name,
                image: res.image as string,
                symbol: res.symbol,
                sentiment: res.sentiment.toString(),
                positiveTweets: res.positiveTweets,
                negativeTweets: res.negativeTweets,
                neutralTweets: res.neutralTweets
            });

            // Calculate sentiment score for daily record
            const sentimentScore = calculateSentimentScore(
                res.positiveTweets || 0,
                res.negativeTweets || 0,
                res.neutralTweets || 0
            );

            const totalTweets = (res.positiveTweets || 0) + (res.negativeTweets || 0) + (res.neutralTweets || 0);

            // Save daily sentiment data for graphing
            await createDailySentimentScore({
                assetId: res.id,
                date: todayDate,
                sentimentScore: sentimentScore,
                positiveTweets: res.positiveTweets || 0,
                negativeTweets: res.negativeTweets || 0,
                neutralTweets: res.neutralTweets || 0,
                totalTweets: totalTweets
            });

            resultArray.push({
                symbol: res.symbol,
                sentiment: res.sentiment.toString(),
                image: res.image as string,
                positiveTweets: res.positiveTweets || 0,
                negativeTweets: res.negativeTweets || 0,
                neutralTweets: res.neutralTweets || 0
            });
            console.log(`Saved daily sentiment data for ${res.name} - Score: ${sentimentScore}, Total Tweets: ${totalTweets}`);
            setTimeout(() => {
                console.log("Waiting for 5 seconds before next request...");
            }, 5000);
        } catch (error) {
            console.error(`Failed to create/update asset ${res.name}:`, error);
        }
    }));
    return resultArray;
}