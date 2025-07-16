import { DataFetcher } from '../dataFetchers';
import { TopicAnalysis, DataSource } from '../types/agent.types';
import { ResponseFormatter } from '../formatter/responseFormatter';

export class DataProcessor {
  private dataFetcher: DataFetcher;
  private responseFormatter: ResponseFormatter;

  constructor(dataFetcher: DataFetcher, responseFormatter: ResponseFormatter) {
    this.dataFetcher = dataFetcher;
    this.responseFormatter = responseFormatter;
  }

  async processDataFetching(
    topicAnalysis: TopicAnalysis,
    options: { days?: number; maxSources?: number; skipDataFetching?: boolean } = {}
  ): Promise<{ recentData: string; fetchedSources: DataSource[] }> {
    const { days = 7, maxSources = 8, skipDataFetching = false } = options;
    
    let recentData = '';
    let fetchedSources: DataSource[] = [];

    // Skip data fetching if explicitly requested
    if (skipDataFetching) {
      console.log('Data fetching skipped by request');
      return { recentData, fetchedSources };
    }

    // Determine if we should fetch data based on analysis
    const shouldFetchData = topicAnalysis.isCrypto || 
                           topicAnalysis.intentType === 'news' || 
                           topicAnalysis.confidence > 0.5;

    if (shouldFetchData) {
      try {
        console.log(`Fetching recent data for topic: "${topicAnalysis.topic}"`);
        const data = await this.dataFetcher.fetchAllData(topicAnalysis.topic, days);
        console.log(`Fetched ${data.length} results`);
        
        fetchedSources = data.slice(0, maxSources);
        recentData = this.responseFormatter.formatDataSources(data, topicAnalysis.topic);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        recentData = `\n\n[Note: Attempted to fetch recent data about "${topicAnalysis.topic}" but external sources are currently unavailable]`;
      }
    } else {
      console.log('Skipping data fetching - topic analysis indicates no need for recent data');
    }

    return { recentData, fetchedSources };
  }

  async fetchSpecificData(query: string, days: number = 7): Promise<DataSource[]> {
    try {
      console.log(`Fetching specific data for query: "${query}"`);
      const data = await this.dataFetcher.fetchAllData(query, days);
      console.log(`Fetched ${data.length} results for specific query`);
      return data;
    } catch (error) {
      console.error('Error fetching specific data:', error);
      return [];
    }
  }

  formatDataForResponse(data: DataSource[], topic: string): string {
    return this.responseFormatter.formatDataSources(data, topic);
  }
}
