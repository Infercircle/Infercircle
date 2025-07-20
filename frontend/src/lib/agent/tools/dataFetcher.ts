import { z } from 'zod';
import { StructuredTool } from 'langchain/tools';
import axios from 'axios';

export interface DataSource {
    title: string;
    content: string;
    url: string;
    date: string;
    source: 'news' | 'twitter' | 'medium' | 'youtube';
}

interface MediumArticle {
    id: string;
    title: string;
    url: string;
    author?: {
        id: string;
        name: string;
        profileUrl: string;
    };
    publication?: {
        id: string;
        name: string;
        url: string;
    };
    date: string;
    content?: string;
    summary?: string;
    publishedAt?: string;
    description?: string;
}

const ActiveRSSFeeds: {source: string, lang: string}[] = [
  {source: "coindesk", lang: "EN"},
  {source: "cointelegraph", lang: "EN"},
  {source: "dailyhodl", lang: "EN"},
  {source: "blockworks", lang: "EN"},
  {source: "cryptopotato", lang: "EN"},
  {source: "decrypt", lang: "EN"},
  {source: "bitcoin.com", lang: "EN"},
  {source: "newsbtc", lang: "EN"},
  {source: "utoday", lang: "EN"},
  {source: "bitcoinist", lang: "EN"},
  {source: "coinpedia", lang: "EN"},
  {source: "timestabloid", lang: "EN"},
  {source: "cryptointelligence", lang: "EN"},
  {source: "bitcoinsistemi", lang: "EN"},
  {source: "themerkle", lang: "EN"},
  {source: "cryptodaily", lang: "EN"},
  {source: "trustnodes", lang: "EN"},
  {source: "coinpaper", lang: "EN"},
  {source: "bitzo", lang: "EN"},
  {source: "coinotag", lang: "EN"},
  {source: "bloomberg_crypto_", lang: "EN"},
  {source: "bitdegree", lang: "EN"},
  {source: "finbold", lang: "EN"},
  {source: "chainwire", lang: "EN"},
  {source: "cryptoknowmics", lang: "EN"},
  {source: "coinquora", lang: "EN"},
  {source: "invezz", lang: "EN"},
  {source: "seekingalpha", lang: "EN"},
  {source: "cryptopolitan", lang: "EN"},
  {source: "thecryptobasic", lang: "EN"},
  {source: "huobi", lang: "EN"},
  {source: "bitfinexblog", lang: "EN"},
  {source: "zycrypto", lang: "EN"},
  {source: "btcpulse", lang: "EN"},
  {source: "thecoinrise", lang: "EN"},
  {source: "crypto_news", lang: "EN"},
  {source: "krakenblog", lang: "EN"},
  {source: "cryptocoinnews", lang: "EN"},
  {source: "cryptonews", lang: "EN"},
  {source: "cryptocompare", lang: "EN"},
  {source: "cryptonewsz", lang: "EN"},
  {source: "financialtimes_crypto_", lang: "EN"},
  {source: "bitcoinworld", lang: "EN"},
  {source: "blokt", lang: "EN"},
  {source: "ambcrypto", lang: "EN"},
  {source: "cointurken", lang: "EN"},
  {source: "forbes", lang: "EN"},
  {source: "coinpaprika", lang: "EN"},
  {source: "diariobitcoin", lang: "ES"}
];

export class DataFetcher extends StructuredTool {
  name = "get_data_about_topic";
  description = "Fetch comprehensive data from multiple sources (news, Twitter, Medium, YouTube) about any cryptocurrency, blockchain project, or market topic. Use this tool when you need current information, sentiment analysis, or market updates to provide informed responses with source citations.";
  
  schema = z.object({
    topic: z.string().describe('The topic to fetch data about (e.g., "Solana", "Bitcoin", "DeFi", "Ethereum")'),
    source: z.enum(['news', 'twitter', 'medium', 'youtube', 'all']).describe('The source to fetch data from').default('all'),
    days: z.number().optional().describe('Number of days for historical data (default: 7)').default(7)
  });

  protected async _call(params: { topic: string; source: 'news' | 'twitter' | 'medium' | 'youtube' | 'all'; days?: number }): Promise<string> {
    const { topic, source, days = 7 } = params;
    const startTime = Date.now();

    try {
      const allData = await this.fetchAllData(topic, days);
      
      if (!allData || allData.length === 0) {
        return JSON.stringify({
          success: true,
          result: `No recent data found for "${topic}" in the last ${days} days. You may want to try a different search term or increase the date range.`,
          toolName: this.name,
          executionTime: Date.now() - startTime,
          isReactComponent: false
        });
      }

      // Create a summary for the AI to use in its response
      const summary = this.createDataSummary(allData, topic);
      
      const result = {
        componentName: 'DataAnalysis',
        props: {
          title: `Analysis: ${topic}`,
          items: allData,
          source: source,
          timestamp: new Date().toISOString()
        }
      };

      return JSON.stringify({
        success: true,
        result: summary,
        toolName: this.name,
        executionTime: Date.now() - startTime,
        isReactComponent: true,
        componentName: result.componentName,
        componentProps: result.props
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolName: this.name,
        executionTime: Date.now() - startTime,
        result: `Failed to fetch data about "${topic}". This could be due to network issues or the topic might not have recent coverage.`,
        isReactComponent: false
      });
    }
  }

  private createDataSummary(data: DataSource[], topic: string): string {
    const sourceBreakdown = this.getSourceBreakdown(data);
    const recentData = data.slice(0, 5);
    
    let summary = `Found ${data.length} recent sources about "${topic}":\n\n`;
    
    summary += `📊 **Source Breakdown:**\n`;
    Object.entries(sourceBreakdown).forEach(([source, count]) => {
      summary += `• ${source.charAt(0).toUpperCase() + source.slice(1)}: ${count} items\n`;
    });
    
    summary += `\n📰 **Recent Headlines & Sources:**\n`;
    recentData.forEach((item, index) => {
      const date = new Date(item.date).toLocaleDateString();
      summary += `${index + 1}. **${item.title}** (${item.source} - ${date})\n`;
      summary += `   ${item.content.substring(0, 150)}...\n`;
      if (item.url) {
        summary += `   🔗 Source: ${item.url}\n`;
      }
      summary += `\n`;
    });
    
    if (data.length > 5) {
      summary += `\n*Note: ${data.length - 5} additional sources available in the detailed analysis below.*\n`;
    }
    
    return summary;
  }

  private getSourceBreakdown(data: DataSource[]): Record<string, number> {
    return data.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async fetchNewsArticles(query: string): Promise<DataSource[]> { 
    try {
      const batchSize = 5;
      const results: unknown[] = [];
      
      for (let i = 0; i < ActiveRSSFeeds.length; i += batchSize) {
        const batch = ActiveRSSFeeds.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (activeFeed) => {
            try {
              const articles = await axios.get('http://localhost:5000/article/search', {
                params: {
                  query: query,
                  source: activeFeed.source,
                  lang: activeFeed.lang,
                },
                timeout: 10000, // 10 second timeout
              });
              const data = articles.data as { data: unknown[] };
              return data.data || [];
            } catch (error) {
              console.error(`Failed to fetch from ${activeFeed.source}:`, error);
              return [];
            }
          })
        );
        
        // Extract successful results
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push(...result.value);
          }
        });
        
        // Small delay between batches
        if (i + batchSize < ActiveRSSFeeds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results.map((article: unknown) => {
        const art = article as Record<string, unknown>;
        return {
          title: (art.title as string) || 'Untitled',
          content: (art.content as string) || (art.summary as string) || 'No content available',
          url: (art.url as string) || '',
          date: (art.publishedAt as string) || new Date().toISOString(),
          source: 'news' as const
        };
      });
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  private async fetchTweets(query: string, days: number = 7): Promise<DataSource[]> {
    console.log(`Fetching tweets for query: "${query}", days: ${days}`);
    
    try {
      const response = await axios.get('http://localhost:5000/twitter/tweets', {
        params: {
          query: query
        }
      });

      const data = response.data as { data?: unknown[] };
      
      return data.data?.map((tweet: unknown) => {
        const t = tweet as Record<string, unknown>;
        return {
          title: `Tweet by @${(t.name as string) || 'Unknown'}`,
          content: (t.text as string) || 'No content available',
          url: (t.tweetUrl as string) || '',
          date: (t.timestamp as string) || new Date().toISOString(),
          source: 'twitter' as const
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching tweets:', error);
      return [];
    }
  }

  private async fetchYouTubeTranscripts(query: string, days: number = 7): Promise<DataSource[]> {
    
    try {
      const searchResponse = await axios.get('http://localhost:5000/yt/yt-search', {
        params: {
          search_string: query,
          lastXDays: days,
          maxResults: 10
        }
      });

      const data = searchResponse.data as { items?: unknown[] };
      
      // Note: YouTube transcript extraction requires additional setup
      // You'll need to implement transcript extraction or use a service
      return data.items?.map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return {
          title: (i.title as string) || 'Untitled Video',
          content: (i.summary as string) || 'No summary available',
          url: (i.url as string) || '',
          date: (i.date as string) || new Date().toISOString(),
          source: 'youtube' as const
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      return [];
    }
  }

  private async fetchMediumPosts(query: string): Promise<DataSource[]> {
    try {
      const response = await axios.get('http://localhost:5000/medium/search', {
        params: {
          q: query
        }
      });
      
      const data = response.data as MediumArticle[];
      
      if (!Array.isArray(data)) {
        console.error('Unexpected API response:', data);
        return [];
      }

      return data.map((article) => ({
        title: article.title || 'Untitled',
        content: article.content || article.description || 'No content available',
        url: article.url || '',
        date: article.publishedAt || article.date || new Date().toISOString(),
        source: 'medium' as const
      }));
    } catch (error) {
      console.error('Error fetching medium posts:', error);
      return [];
    }
  }

  async fetchAllData(query: string, days: number = 7): Promise<DataSource[]> {
    console.log(`Fetching all data for query: "${query}"`);
    
    // Try to fetch from all sources but don't fail if one source fails
    const results = await Promise.allSettled([
      this.fetchNewsArticles(query),
      this.fetchTweets(query, days)
    ]);
    
    const allData: DataSource[] = [];
    
    results.forEach((result, index) => {
      const sourceName = ['news', 'tweets'][index];
      if (result.status === 'fulfilled') {
        console.log(`${sourceName}: ${result.value.length} items fetched`);
        allData.push(...result.value);
      } else {
        console.error(`${sourceName}: failed to fetch -`, result.reason);
      }
    });

    const filteredData = allData
      .filter(item => item && item.title && item.content) // Filter out invalid items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`Total valid items after filtering: ${filteredData.length}`);
    return filteredData;
  }

  getParameterInfo(): string {
    return `topic (required): The topic to fetch data about (e.g., "Solana", "Bitcoin", "DeFi", "Ethereum")
    source (optional): The source to fetch data from (default: all)
    days (optional): Number of days for historical data (default: 7)`;
  }
}
