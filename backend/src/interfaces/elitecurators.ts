export interface TopFollower {
  twitter_id: string;
  username: string;
  name: string;
  description: string;
  twitter_score: number;
  followers_count: number;
  profile_image: string;
  tags: any[];
  categories: Array<{
    id: number;
    name: string;
  }>;
  subscribed_at: string;
}

export interface TwitterScoreResponse {
  success: boolean;
  total: number;
  page: number;
  size: number;
  pages: number;
  top_followers: TopFollower[];
}
