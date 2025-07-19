import React from 'react';
import { z } from 'zod';
import { DataFetcher } from '../dataFetchers';
import { PriceData } from '../priceData';
import { ToolConfig, ToolResult } from '../types/agent.types';
import PriceChart from '../../components/PriceChart';

export class CoreTools {
  private dataFetcher: DataFetcher;
  private priceDataFetcher: PriceData;

  constructor(dataFetcher: DataFetcher, priceDataFetcher: PriceData) {
    this.dataFetcher = dataFetcher;
    this.priceDataFetcher = priceDataFetcher;
  }

  getDataFetchTool(): ToolConfig {
    return {
      displayName: '📊 Fetch Recent Data',
      description: 'Fetch recent articles, tweets, and posts about a specific topic from the past 7 days',
      parameters: z.object({
        query: z.string().describe('The topic to search for'),
        days: z.number().optional().default(7).describe('Number of days to look back')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { query, days = 7 } = params as { query: string; days?: number };
        try {
          console.log(`Fetching data for query: "${query}"`);
          
          const data = await this.dataFetcher.fetchAllData(query, days);
          console.log(`Fetched ${data.length} results for query: "${query}"`);
          
          if (data.length === 0) {
            return {
              success: false,
              error: "No recent data found for this topic. The information sources might be unavailable or the query might be too specific."
            };
          }
          
          return {
            success: true,
            data: {
              query,
              totalResults: data.length,
              sources: data
            }
          };
        } catch (error) {
          console.error('Error in fetch_recent_data tool:', error);
          return {
            success: false,
            error: "Failed to fetch data from external sources. Backend services might be unavailable."
          };
        }
      }
    };
  }

  getPriceChartTool(): ToolConfig {
    return {
      displayName: '📈 Get Price Chart',
      description: 'Get historical price data for a cryptocurrency token contract address and display it as a chart',
      parameters: z.object({
        contractAddress: z.string().describe('The contract address of the token'),
        days: z.number().optional().default(30).describe('Number of days of price history')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { contractAddress, days = 30 } = params as { contractAddress: string; days?: number };
        try {
          const tokenId = await this.priceDataFetcher.getTokenId(contractAddress);
          const priceData = await this.priceDataFetcher.getPriceHistory(tokenId, days);
          
          return {
            success: true,
            data: priceData
          };
        } catch (error) {
          console.error('Error in get_price_chart tool:', error);
          return {
            success: false,
            error: "Failed to fetch price data for the given contract address."
          };
        }
      },
      render: (result: unknown) => {
        const typedResult = result as {
          success: boolean;
          data?: { time: string; value: number }[];
          error?: string;
        };

        if (!typedResult.success) {
          return React.createElement('div', { className: 'text-red-500 p-4' }, 
            `Error: ${typedResult.error}`);
        }

        if (!typedResult.data || typedResult.data.length === 0) {
          return React.createElement('div', { className: 'text-yellow-500 p-4' }, 
            'No price history data found');
        }

        return React.createElement('div', { className: 'bg-muted/50 p-4' },
          React.createElement(PriceChart, { data: typedResult.data })
        );
      }
    };
  }

  getAnalyzeTopicTool(): ToolConfig {
    return {
      displayName: '🔍 Analyze Topic',
      description: 'Analyze what topic/cryptocurrency the user is asking about using AI',
      parameters: z.object({
        query: z.string().describe('The user query to analyze')
      }),
      execute: async (params: unknown): Promise<ToolResult> => {
        const { query } = params as { query: string };
        // This would be implemented by the AI model calling service
        // For now, return a basic analysis
        return {
          success: true,
          data: {
            topic: query,
            isCrypto: this.containsCryptoKeywords(query),
            cryptoSymbol: null,
            intentType: this.containsPriceKeywords(query) ? 'price' : 'general',
            confidence: 0.8
          }
        };
      }
    };
  }

  private containsCryptoKeywords(query: string): boolean {
    const cryptoKeywords = [
      'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto', 
      'cryptocurrency', 'defi', 'nft', 'blockchain', 'token', 'coin', 
      'contract', 'price', 'chart', 'trading', 'wallet', 'dex', 'swap'
    ];
    const lowerQuery = query.toLowerCase();
    return cryptoKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  private containsPriceKeywords(query: string): boolean {
    const priceKeywords = [
      'price', 'chart', 'graph', 'historical', 'price history', 
      'token price', 'show me', 'display', 'contract'
    ];
    const lowerQuery = query.toLowerCase();
    return priceKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  getAllTools(): Record<string, ToolConfig> {
    return {
      fetchRecentData: this.getDataFetchTool(),
      getPriceChart: this.getPriceChartTool(),
      analyzeTopic: this.getAnalyzeTopicTool()
    };
  }
}
