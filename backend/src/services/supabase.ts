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

export class UserWalletService {
  private tableName = 'user_wallets';

  async addWallet(wallet: UserWallet): Promise<UserWallet | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(wallet)
      .select()
      .single();
    if (error) {
      console.error('Error adding wallet:', error);
      return null;
    }
    return data;
  }

  async getWalletsByTwitterId(twitter_id: string): Promise<UserWallet[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('twitter_id', twitter_id);
    if (error) {
      console.error('Error fetching wallets:', error);
      return [];
    }
    return data || [];
  }

  async deleteWallet(twitter_id: string, wallet_address: string, chain: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('twitter_id', twitter_id)
      .eq('wallet_address', wallet_address)
      .eq('chain', chain);
    return { error };
  }

  async updateWallet(twitter_id: string, old_wallet_address: string, new_wallet_address: string, chain: string) {
    const { error } = await supabase
      .from(this.tableName)
      .update({ wallet_address: new_wallet_address })
      .eq('twitter_id', twitter_id)
      .eq('wallet_address', old_wallet_address)
      .eq('chain', chain);
    return { error };
  }
} 