import axios from 'axios';
import { subDays, format } from 'date-fns';

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
    [key: string]: any; // For any extra fields
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

export class DataFetcher {
  private async fetchNewsArticles(query: string, days: number = 7): Promise<DataSource[]> {
    const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    try {
      const results = await Promise.all(ActiveRSSFeeds.map(async (activeFeed) => {
        const articles = await axios.get('http://localhost:5000/article/search', {
          params: {
            query: query,
            source: activeFeed.source,
            lang: activeFeed.lang
          }
        });
        return articles.data;
      }));

      return results.map((article: any) => ({
        title: article.title,
        content: article.description || article.content,
        url: article.url,
        date: article.publishedAt,
        source: 'news' as const
      }));
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  private async fetchTweets(query: string, days: number = 7): Promise<DataSource[]> {
    
    try {
      const response = await axios.get('http://localhost:5000/twitter/tweets', {
        params: {
          query: query
        }
      });

      return response.data.data?.map((tweet: any) => ({
        title: `Tweet by @${tweet.name}`,
        content: tweet.text,
        url: tweet.tweetUrl,
        date: tweet.timestamp,
        source: 'twitter' as const
      })) || [];
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

      // Note: YouTube transcript extraction requires additional setup
      // You'll need to implement transcript extraction or use a service
      return searchResponse.data.items.map((item: any) => ({
        title: item.title,
        content: item.summary,
        url: item.url,
        date: item.date,
        source: 'youtube' as const
      }));
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      return [];
    }
  }

  private async fetchMediumPosts(query: string): Promise<DataSource[]> {
    try {
      const response = await axios.get('http://localhost:8080/medium/search', {
        params: {
          q: query
        }
      });
      if (!Array.isArray(response.data)) {
        console.error('Unexpected API response:', response.data);
        return [];
      }

      const mediumArticles: MediumArticle[] = response.data;

      return mediumArticles.map((article) => ({
        title: article.title,
        content: article.content || article.description,
        url: article.url,
        date: article.publishedAt,
        source: 'medium' as const
      }));
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  async fetchAllData(query: string, days: number = 7): Promise<DataSource[]> {
    const [news, tweets, youtube, medium] = await Promise.all([
      this.fetchNewsArticles(query, days),
      this.fetchTweets(query, days),
      this.fetchYouTubeTranscripts(query, days),
      this.fetchMediumPosts(query, days)
    ]);

    return [...news, ...tweets, ...youtube, ...medium]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}