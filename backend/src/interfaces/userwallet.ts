export interface UserWallet {
  id?: string; // Optional, for DB primary key
  twitter_id: string; // Twitter user id
  wallet_address: string;
  chain: 'eth' | 'sol' | 'btc' | 'tron' | 'ton';
  created_at?: string;
} 