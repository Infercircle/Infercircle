import { createClient } from '@supabase/supabase-js';
import { TwitterAuthor, TwitterAuthorCreate } from '../interfaces/tweets';
import { UserWallet } from '../interfaces/userwallet';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database operations for tweets
export class TwitterAuthorService {
  private tableName = 'twitter_authors';

  // Upsert (insert or update) authors
  async upsertAuthors(authors: TwitterAuthorCreate[]): Promise<TwitterAuthor[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(authors, { onConflict: 'id' })
        .select();
      if (error) {
        console.error('Error upserting authors:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in upsertAuthors:', error);
      return [];
    }
  }

  // Get all authors
  async getAuthors(): Promise<TwitterAuthor[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*');
      if (error) {
        console.error('Error fetching authors:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getAuthors:', error);
      return [];
    }
  }
} 