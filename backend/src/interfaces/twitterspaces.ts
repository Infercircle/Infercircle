export interface TwitterSpace {
  id: string;
  title: string;
  creator_id: string;
  participant_count: number;
  scheduled_start?: string;
  started_at?: string;
  state: string;
  host_ids?: string[];
  speaker_ids?: string[];
  url?: string;
  [key: string]: any; // For any extra fields
}

export interface TwitterSpaceSearchResponse {
  data: TwitterSpace[];
  meta?: {
    result_count: number;
    next_token?: string;
  };
} 