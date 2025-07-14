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

export class DataFetcher {
  private async fetchNewsArticles(query: string, days: number = 7): Promise<DataSource[]> {
    const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          from: fromDate,
          sortBy: 'publishedAt',
          apiKey: process.env.NEWS_API_KEY,
          language: 'en'
        }
      });

      return response.data.articles.map((article: any) => ({
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
    const startTime = subDays(new Date(), days).toISOString();
    
    try {
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        params: {
          query: `${query} -is:retweet`,
          'tweet.fields': 'created_at,public_metrics',
          'user.fields': 'username',
          expansions: 'author_id',
          max_results: 50,
          start_time: startTime
        },
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      });

      return response.data.data?.map((tweet: any) => ({
        title: `Tweet by @${tweet.author_id}`,
        content: tweet.text,
        url: `https://twitter.com/i/web/status/${tweet.id}`,
        date: tweet.created_at,
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
        title: item.url,
        content: item.summary,
        url: item.url,
        date: item.snippet.publishedAt,
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