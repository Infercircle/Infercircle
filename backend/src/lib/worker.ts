import axios from "axios";
import { createAssetMindShare, getAssetById } from "./queries";

export async function startMindShareCalculation() {
    console.log("Starting the mindshare calculation............");
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 200,
        page: 1,
        sparkline: true,
        price_change_percentage: "1h,24h,7d"
      },
      headers: {
        // If you have a CoinGecko API key, uncomment below and set COINGECKO_API_KEY in your env
        // 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY || ''
      }
    });
    console.log("GOT tokens...........");
    
    const data = response.data as {"id": string, "symbol": string, "name": string, "image": string}[];
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

export async function getSentiment(data: { id: string, symbol: string, name: string, image?: string }[]): Promise<{symbol: string, sentiment: string}[]> {
    console.log("getting sentiment for ",data.length);
    const result = await axios.post(`${process.env.BASE_URL}/twitter/sentiment-batch`, {
        assets: data.map(asset => ({ id: asset.id, symbol: asset.symbol, name: asset.name, image: asset.image }))
    });
    const Fresult = Object.values((result.data as unknown).results as {id: string, name: string, image: string, symbol: string, sentiment: string}[]).flat();
    console.log("Got Fresult.....");

    let resultArray: {symbol: string, sentiment: string, image: string}[] = [];
    
    await Promise.all(Fresult.map(async(res)=>{
        try {
          if(!res.image || res.image === "") {
            const getAsset = await getAssetById(res.id);
            res.image = getAsset?.image || "";
          }
            await createAssetMindShare({
                id: res.id,
                name: res.name,
                image: res.image as string,
                symbol: res.symbol,
                sentiment: res.sentiment.toString()
            });
            resultArray.push({
                symbol: res.symbol,
                sentiment: res.sentiment.toString(),
                image: res.image as string
            });
            console.log("done for ",res.name);
        } catch (error) {
            console.error(`Failed to create/update asset ${res.name}:`, error);
        }
    }));
    return resultArray;
}