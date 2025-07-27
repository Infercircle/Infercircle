import { supabase } from './supabase';
import axios from 'axios';
import { TopFollower, TwitterScoreResponse } from '../interfaces/elitecurators';

export class EliteCuratorsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TWITTERSCORE_API_KEY || '';
    this.baseUrl = 'https://twitterscore.io/api/v1';
  }

  /**
   * Fetch top followers for a given curator (fetches ALL pages, handles 429 rate limits)
   */
  async fetchTopFollowers(curatorTwitterId: string): Promise<TopFollower[]> {
    const allFollowers: TopFollower[] = [];
    let page = 1;
    const size = 100; // Use a large page size for efficiency
    let consecutive429s = 0;

    while (true) {
      try {
        const response = await axios.get<TwitterScoreResponse>(
          `${this.baseUrl}/get_followers`,
          {
            params: {
              api_key: this.apiKey,
              twitter_id: curatorTwitterId,
              page,
              size
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Connection': 'keep-alive'
            }
          }
        );

        if (response.data.success && response.data.top_followers) {
          allFollowers.push(...response.data.top_followers);
          if (page >= response.data.pages) break; // No more pages
          page++;
          consecutive429s = 0; // reset on success
          await new Promise(res => setTimeout(res, 2000)); // 2s delay between pages
        } else {
          break; // Stop if error or no more data
        }
      } catch (error: any) {
        if (error.response && error.response.status === 429) {
          consecutive429s++;
          const waitTime = Math.min(60000 * consecutive429s, 5 * 60 * 1000); // exponential backoff, max 5 min
          console.warn(`429 Too Many Requests. Waiting ${waitTime / 1000}s before retrying page ${page}...`);
          await new Promise(res => setTimeout(res, waitTime));
          // retry same page
        } else {
          console.error(`Error fetching top followers for ${curatorTwitterId} (page ${page}):`, error instanceof Error ? error.message : String(error));
          break;
        }
      }
    }

    return allFollowers;
  }

  /**
   * Add a new top elite curator
   */
  async addTopEliteCurator(twitterId: string, username: string) {
    try {
      const { data, error } = await supabase
        .from('top_elite_curators')
        .insert({
          twitter_id: twitterId,
          username: username
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding top elite curator:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding top elite curator:', error);
      throw error;
    }
  }

  /**
   * Add a discovered elite curator
   */
  async addEliteCurator(follower: TopFollower) {
    try {
      const { data, error } = await supabase
        .from('elite_curators')
        .upsert({
          twitter_id: follower.twitter_id,
          username: follower.username,
          twitter_score: follower.twitter_score,
          tags: follower.tags,
          categories: follower.categories,
          subscribed_at: follower.subscribed_at,
          followers_count: follower.followers_count // <-- save followers_count
        }, {
          onConflict: 'twitter_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding elite curator:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error adding elite curator:', error);
      throw error;
    }
  }

  /**
   * Get all top elite curators
   */
  async getTopEliteCurators() {
    try {
      const { data, error } = await supabase
        .from('top_elite_curators')
        .select('*');

      if (error) {
        console.error('Error fetching top elite curators:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching top elite curators:', error);
      throw error;
    }
  }

  /**
   * Get all elite curators
   */
  async getEliteCurators(limit?: number) {
    try {
      let query = supabase
        .from('elite_curators')
        .select('*')
        .order('twitter_score', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching elite curators:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching elite curators:', error);
      throw error;
    }
  }

  /**
   * Get all top elite curators that have not been processed
   */
  async getUnprocessedTopEliteCurators() {
    try {
      const { data, error } = await supabase
        .from('top_elite_curators')
        .select('*')
        .eq('processed', false);

      if (error) {
        console.error('Error fetching unprocessed top elite curators:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching unprocessed top elite curators:', error);
      throw error;
    }
  }

  /**
   * Mark a top elite curator as processed
   */
  async markCuratorAsProcessed(twitterId: string) {
    try {
      const { error } = await supabase
        .from('top_elite_curators')
        .update({ processed: true })
        .eq('twitter_id', twitterId);
      if (error) {
        console.error('Error marking curator as processed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error marking curator as processed:', error);
      throw error;
    }
  }

  /**
   * Run the full automation to process all unprocessed top elite curators, prioritizing Elon Musk first
   */
  async runAutomation() {
    console.log('🚀 Starting Elite Curators automation...');

    try {
      // 1. Try to fetch Elon Musk first (if unprocessed)
      const elon = await supabase
        .from('top_elite_curators')
        .select('*')
        .eq('twitter_id', '44196397')
        .eq('processed', false)
        .single();

      if (elon.data) {
        console.log(`\n==============================`);
        console.log(`Processing Elon Musk first: ${elon.data.username} (${elon.data.twitter_id})`);
        const result = await this.processCurator(elon.data.twitter_id, elon.data.username, 1, 1);
        console.log(`Summary for Elon Musk:`, result);
        if (result && result.processed) {
          await this.markCuratorAsProcessed(elon.data.twitter_id);
        }
        // Optional: delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 2. Now get all other unprocessed curators (excluding Elon Musk)
      const topCurators = await this.getUnprocessedTopEliteCurators();
      const filteredCurators = topCurators.filter(c => c.twitter_id !== '44196397');
      console.log(`📋 Found ${filteredCurators.length} unprocessed top elite curators to process (excluding Elon Musk)`);

      // 3. Continue as before
      for (let i = 0; i < filteredCurators.length; i++) {
        const curator = filteredCurators[i];
        console.log(`\n==============================`);
        console.log(`Curator ${i + 1}/${filteredCurators.length}: ${curator.username} (${curator.twitter_id})`);
        const result = await this.processCurator(curator.twitter_id, curator.username, i + 1, filteredCurators.length);
        console.log(`Summary for ${curator.username}:`, result);
        if (result && result.processed) {
          await this.markCuratorAsProcessed(curator.twitter_id);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('✅ Elite Curators automation completed');
    } catch (error) {
      console.error('❌ Elite Curators automation failed:', error);
      throw error;
    }
  }

  /**
   * Process a single curator and discover their top followers
   */
  async processCurator(curatorTwitterId: string, curatorUsername: string, curatorIndex?: number, totalCurators?: number) {
    if (curatorIndex && totalCurators) {
      console.log(`🔍 Processing curator ${curatorIndex}/${totalCurators}: ${curatorUsername} (${curatorTwitterId})`);
    } else {
      console.log(`🔍 Processing curator: ${curatorUsername} (${curatorTwitterId})`);
    }

    try {
      // Fetch all top followers and get the main curator's smart followers count from the first page
      let smartFollowersCount: number | null = null;
      let page = 1;
      const size = 100;
      const allFollowers: TopFollower[] = [];
      let pages = 1;

      while (true) {
        const response = await axios.get<TwitterScoreResponse>(
          `${this.baseUrl}/get_followers`,
          {
            params: {
              api_key: this.apiKey,
              twitter_id: curatorTwitterId,
              page,
              size
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Connection': 'keep-alive'
            }
          }
        );

        if (response.data.success && response.data.top_followers) {
          if (page === 1) {
            smartFollowersCount = response.data.total; // <-- Use smart followers count
            pages = response.data.pages;
            console.log(`  Total smart followers to process: ${smartFollowersCount}`);
          }
          allFollowers.push(...response.data.top_followers);
          console.log(`    Page ${page}/${pages} - Fetched ${allFollowers.length}/${smartFollowersCount ?? '?'} followers so far`);
          if (page >= pages) break;
          page++;
          await new Promise(res => setTimeout(res, 2000));
        } else {
          break;
        }
      }

      // Save main curator's smart followers count (from 'total')
      if (smartFollowersCount !== null) {
        await this.addEliteCurator({
          twitter_id: curatorTwitterId,
          username: curatorUsername,
          twitter_score: undefined as any,
          tags: undefined as any,
          categories: undefined as any,
          subscribed_at: undefined as any,
          followers_count: smartFollowersCount, // <-- Save smart followers count
          name: undefined as any,
          description: undefined as any,
          profile_image: undefined as any
        });
      }

      // Save all top followers (with their own followers_count)
      let addedCount = 0;
      for (const [idx, follower] of allFollowers.entries()) {
        try {
          await this.addEliteCurator(follower);
          addedCount++;
          if ((idx + 1) % 50 === 0 || idx === allFollowers.length - 1) {
            console.log(`      Saved ${addedCount}/${allFollowers.length} followers for ${curatorUsername}`);
          }
        } catch (error) {
          console.error(`Error adding follower ${follower.username}:`, error);
        }
      }

      console.log(`✅ Added/Updated ${addedCount} elite curators from ${curatorUsername}`);
      return { processed: true, followersFound: allFollowers.length, added: addedCount };
    } catch (error: any) {
      console.error(`❌ Error processing curator ${curatorUsername}:`, error instanceof Error ? error.message : String(error));
      return { processed: false, error: error.message };
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary() {
    try {
      const [topCurators, eliteCurators] = await Promise.all([
        this.getTopEliteCurators(),
        this.getEliteCurators()
      ]);

      return {
        top_curators_count: topCurators.length,
        total_elite_curators: eliteCurators.length,
        discovered_curators: eliteCurators.length - topCurators.length,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting summary:', error);
      throw error;
    }
  }
} 