import { z } from 'zod';

const API_KEY = process.env.CG_API_KEY;
const BASE_URL = process.env.CG_BASE_URL || 'https://api.coingecko.com/api/v3';

const tokenSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
});

const priceHistorySchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});

export class PriceData {

  public async getTokenId(contractAddress: string): Promise<string> {
    if(!API_KEY){
      throw new Error('API key not found');
    }
    const url = `${BASE_URL}/coins/solana/contract/${contractAddress}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': API_KEY,
      },
    };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('Failed to fetch token ID');
  }

  const data = await response.json();
  const parsed = tokenSchema.parse(data);
  return parsed.id;
  };

  public async getPriceHistory(tokenId: string, days: number = 7): Promise<{ time: string; value: number }[]> {
    if(!API_KEY){
      throw new Error('API key not found');
    }
    const url = `${BASE_URL}/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}&precision=18`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': API_KEY,
      },
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Failed to fetch price history');
    }

    const data = await response.json();
    const parsed = priceHistorySchema.parse(data);
    return parsed.prices.map(([time, value]) => ({ time: new Date(time).toLocaleString(), value }));
  };

  public async getCurrentPrice(tokenId: string): Promise<{
    currentPrice: number;
    priceChange24h: number;
    priceChangePercent24h: number;
  }> {
    if(!API_KEY){
      throw new Error('API key not found');
    }
    const url = `${BASE_URL}/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-cg-demo-api-key': API_KEY,
      },
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error('Failed to fetch current price');
    }

    const data = await response.json();
    return {
      currentPrice: data.market_data.current_price.usd,
      priceChange24h: data.market_data.price_change_24h,
      priceChangePercent24h: data.market_data.price_change_percentage_24h
    };
  };
}
