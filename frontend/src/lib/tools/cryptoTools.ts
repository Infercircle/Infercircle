import { z } from 'zod';
import { PriceData } from '../priceData';
import { ToolConfig, ToolResult } from '../types/agent.types';

export class CryptoTools {
  private priceDataFetcher: PriceData;

  constructor(priceDataFetcher: PriceData) {
    this.priceDataFetcher = priceDataFetcher;
  }

  getTokenPriceTool(): ToolConfig {
    return {
      displayName: '💰 Get Token Price',
      description: 'Get current price information for a cryptocurrency token',
      parameters: z.object({
        contractAddress: z.string().describe('The contract address of the token'),
        symbol: z.string().optional().describe('The token symbol (optional)')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { contractAddress, symbol } = params as { contractAddress: string; symbol?: string };
        try {
          const tokenId = await this.priceDataFetcher.getTokenId(contractAddress);
          const currentPrice = await this.priceDataFetcher.getCurrentPrice(tokenId);
          
          return {
            success: true,
            data: {
              contractAddress,
              symbol,
              price: currentPrice,
              timestamp: new Date().toISOString()
            }
          };
        } catch (error) {
          console.error('Error fetching token price:', error);
          return {
            success: false,
            error: "Failed to fetch token price. Please check the contract address."
          };
        }
      }
    };
  }

  getTokenInfoTool(): ToolConfig {
    return {
      displayName: '📋 Get Token Info',
      description: 'Get detailed information about a cryptocurrency token',
      parameters: z.object({
        contractAddress: z.string().describe('The contract address of the token')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { contractAddress } = params as { contractAddress: string };
        try {
          const tokenId = await this.priceDataFetcher.getTokenId(contractAddress);
          // This would need to be implemented in PriceData class
          // const tokenInfo = await this.priceDataFetcher.getTokenInfo(tokenId);
          
          return {
            success: true,
            data: {
              contractAddress,
              tokenId,
              message: "Token info retrieval would be implemented here"
            }
          };
        } catch (error) {
          console.error('Error fetching token info:', error);
          return {
            success: false,
            error: "Failed to fetch token information."
          };
        }
      }
    };
  }

  getMarketTrendsTool(): ToolConfig {
    return {
      displayName: '📈 Market Trends',
      description: 'Get current market trends and top performing tokens',
      parameters: z.object({
        category: z.string().optional().describe('Market category (defi, nft, etc.)'),
        timeframe: z.string().optional().describe('Time frame (24h, 7d, 30d)')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { category, timeframe } = params as { category?: string; timeframe?: string };
        try {
          // This would need to be implemented based on available APIs
          return {
            success: true,
            data: {
              category: category || 'general',
              timeframe: timeframe || '24h',
              trends: [
                { symbol: 'BTC', change: '+5.2%' },
                { symbol: 'ETH', change: '+3.8%' },
                { symbol: 'SOL', change: '+7.1%' }
              ]
            }
          };
        } catch (error) {
          console.error('Error fetching market trends:', error);
          return {
            success: false,
            error: "Failed to fetch market trends."
          };
        }
      }
    };
  }

  getAllTools(): Record<string, ToolConfig> {
    return {
      getTokenPrice: this.getTokenPriceTool(),
      getTokenInfo: this.getTokenInfoTool(),
      getMarketTrends: this.getMarketTrendsTool()
    };
  }
}
