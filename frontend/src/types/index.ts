export interface VideoData {
  id: "A" | "B";
  title: string;
  creator: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  follower_count: number;
  hashtags: string[];
  upload_date: string;
  duration: number;
  transcript_chunks: number;
  video_url: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: number;
}

export interface Source {
  video: "A" | "B";
  chunk_id: string;
  text: string;
}
