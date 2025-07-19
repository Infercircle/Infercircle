import { z } from 'zod';
import { StructuredTool } from 'langchain/tools';

interface ComponentResult {
  componentName: string;
  props: Record<string, unknown>;
}

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

export class TSXGeneratorTool extends StructuredTool {
  name = "get_price_chart";
  description = "Get price chart data for a cryptocurrency token and render it visually. Use contractAddress parameter to specify the token contract address and optional days parameter for historical data range.";
  schema = z.object({
    contractAddress: z.string().describe('The contract address of the token'),
    days: z.number().optional().describe('Number of days for historical data (default: 30)')
  });
  
  protected async _call(params: { contractAddress: string; days?: number }): Promise<string> {
    const { contractAddress, days = 7 } = params;
    
    if (!contractAddress) {
      throw new Error('Contract address is required');
    }
    
    try {
      const tokenId = await this.getTokenId(contractAddress);
      const priceHistory = await this.getPriceHistory(tokenId, days);
      
      let result: ComponentResult;
      
      if (!priceHistory || priceHistory.length === 0) {
        result = {
          componentName: 'DefaultComponent',
          props: {
            title: 'Error',
            message: "Failed to fetch price chart data. Please check the contract address.",
            timestamp: new Date().toISOString()
          }
        };
      } else {
        result = {
          componentName: 'PriceChart',
          props: {
            data: priceHistory,
            days
          }
        };
      }

      return JSON.stringify({
        success: true,
        result,
        toolName: this.name,
        executionTime: Date.now(),
        isHtml: false,
        isReactComponent: true,
        componentName: result.componentName,
        componentProps: result.props
      });
    } catch (error) {
      console.error('Error fetching price chart:', error);
      const errorResult: ComponentResult = {
        componentName: 'DefaultComponent',
        props: {
          title: 'Error',
          message: "Failed to fetch price chart data. Please check the contract address.",
          timestamp: new Date().toISOString()
        }
      };
      
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolName: this.name,
        executionTime: 0,
        result: errorResult,
        isReactComponent: true,
        componentName: errorResult.componentName,
        componentProps: errorResult.props
      });
    }
  }


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
  
  private generateDefault(input: string): ComponentResult {
    return {
      componentName: 'DefaultComponent',
      props: {
        title: 'Generated Content',
        message: `You requested: "${input}"`,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Get parameter metadata for the AI to understand what parameters are needed
  getParameterInfo(): string {
    const shape = this.schema.shape;
    
    const paramInfo: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      const zodField = value as z.ZodTypeAny;
      const isOptional = zodField.isOptional();
      const description = zodField._def.description || 'No description';
      
      paramInfo.push(`${key} (${isOptional ? 'optional' : 'required'}): ${description}`);
    }
    
    return paramInfo.join('\n    ');
  }
}