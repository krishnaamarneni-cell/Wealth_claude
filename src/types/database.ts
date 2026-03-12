// ============================================
// WealthClaude Social Media Agent System
// TypeScript Types - Database Schema
// ============================================

// ============================================
// ENUMS
// ============================================

export type AgentStatus = 'active' | 'paused' | 'draft';
export type PostStatus = 'draft' | 'scheduled' | 'posted' | 'failed' | 'cancelled';
export type Platform = 'x' | 'linkedin' | 'instagram';
export type TrendSource = 'x_trending' | 'perplexity' | 'news_rss';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type ApiKeyName =
  | 'groq'
  | 'perplexity'
  | 'fal_ai'
  | 'buffer'
  | 'telegram_bot_token'
  | 'cloudinary_cloud_name'
  | 'cloudinary_api_key'
  | 'cloudinary_api_secret'
  | 'google_drive'
  | 'gmail'
  | 'calendly'
  | 'x_bearer_token';

export type ActivityType =
  | 'trend_detected'
  | 'trend_approved'
  | 'trend_rejected'
  | 'post_created'
  | 'post_scheduled'
  | 'post_published'
  | 'post_failed'
  | 'post_cancelled'
  | 'post_edited'
  | 'image_generated'
  | 'email_received'
  | 'email_sent'
  | 'email_replied'
  | 'meeting_scheduled'
  | 'meeting_cancelled'
  | 'agent_created'
  | 'agent_updated'
  | 'agent_paused'
  | 'agent_resumed'
  | 'api_key_added'
  | 'api_key_updated'
  | 'buffer_connected'
  | 'telegram_command';

// ============================================
// API KEYS
// ============================================

export interface ApiKey {
  id: string;
  user_id: string;
  key_name: ApiKeyName;
  key_value: string;
  agent_id: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyInsert {
  key_name: ApiKeyName;
  key_value: string;
  agent_id?: string | null;
  is_active?: boolean;
}

export interface ApiKeyUpdate {
  key_value?: string;
  is_active?: boolean;
}

// ============================================
// AGENTS
// ============================================

export interface PostingStyle {
  tone: string; // 'professional', 'casual', 'authoritative', 'friendly'
  emoji_usage: 'none' | 'minimal' | 'moderate' | 'heavy';
  hashtag_style: 'none' | 'minimal' | 'relevant' | 'trending';
  x_style: string;
  linkedin_style: string;
  instagram_style: string;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  topic_instructions: string;
  niche: string | null;
  posting_style: PostingStyle;
  image_style_prompt: string;
  posting_frequency_minutes: number;
  min_posting_gap_minutes: number;
  trend_sources: TrendSource[];
  trend_keywords: string[] | null;
  winning_content_folder_url: string | null;
  winning_content_folder_id: string | null;
  buffer_profile_ids: string[];
  status: AgentStatus;
  is_auto_posting: boolean;
  notify_on_trend_change: boolean;
  total_posts: number;
  last_post_at: string | null;
  last_trend_check_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentInsert {
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  topic_instructions: string;
  niche?: string | null;
  posting_style?: PostingStyle;
  image_style_prompt?: string;
  posting_frequency_minutes?: number;
  min_posting_gap_minutes?: number;
  trend_sources?: TrendSource[];
  trend_keywords?: string[] | null;
  winning_content_folder_url?: string | null;
  winning_content_folder_id?: string | null;
  buffer_profile_ids?: string[];
  status?: AgentStatus;
  is_auto_posting?: boolean;
  notify_on_trend_change?: boolean;
}

export interface AgentUpdate extends Partial<AgentInsert> { }

// ============================================
// BUFFER ACCOUNTS
// ============================================

export interface BufferAccount {
  id: string;
  user_id: string;
  buffer_profile_id: string;
  buffer_access_token: string | null;
  platform: Platform;
  account_name: string | null;
  account_handle: string | null;
  account_avatar_url: string | null;
  is_connected: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BufferAccountInsert {
  buffer_profile_id: string;
  buffer_access_token?: string | null;
  platform: Platform;
  account_name?: string | null;
  account_handle?: string | null;
  account_avatar_url?: string | null;
}

// ============================================
// TRENDS
// ============================================

export interface Trend {
  id: string;
  agent_id: string;
  topic: string;
  source: TrendSource;
  source_url: string | null;
  trend_score: number | null;
  volume: number | null;
  is_new: boolean;
  first_detected_at: string;
  last_seen_at: string;
  notification_sent: boolean;
  post_created: boolean;
  user_approved: boolean | null;
  created_at: string;
}

export interface TrendInsert {
  agent_id: string;
  topic: string;
  source: TrendSource;
  source_url?: string | null;
  trend_score?: number | null;
  volume?: number | null;
}

// ============================================
// POSTS
// ============================================

export interface EngagementStats {
  x?: { likes: number; retweets: number; replies: number; impressions: number };
  linkedin?: { likes: number; comments: number; shares: number; impressions: number };
  instagram?: { likes: number; comments: number; saves: number; reach: number };
}

export interface Post {
  id: string;
  agent_id: string;
  user_id: string;
  topic: string | null;
  research_summary: string | null;
  x_content: string | null;
  linkedin_content: string | null;
  instagram_content: string | null;
  image_prompt: string | null;
  image_url: string | null;
  fal_generation_id: string | null;
  trend_id: string | null;
  status: PostStatus;
  scheduled_for: string | null;
  posted_at: string | null;
  buffer_post_ids: Record<Platform, string>;
  posting_errors: Record<Platform, string> | null;
  platforms: Platform[];
  engagement_stats: EngagementStats;
  created_at: string;
  updated_at: string;
}

export interface PostInsert {
  agent_id: string;
  topic?: string | null;
  research_summary?: string | null;
  x_content?: string | null;
  linkedin_content?: string | null;
  instagram_content?: string | null;
  image_prompt?: string | null;
  image_url?: string | null;
  fal_generation_id?: string | null;
  trend_id?: string | null;
  status?: PostStatus;
  scheduled_for?: string | null;
  platforms?: Platform[];
}

export interface PostUpdate extends Partial<PostInsert> {
  posted_at?: string | null;
  buffer_post_ids?: Record<Platform, string>;
  posting_errors?: Record<Platform, string> | null;
}

// ============================================
// ACTIVITY LOGS
// ============================================

export interface ActivityLog {
  id: string;
  user_id: string;
  agent_id: string | null;
  action_type: ActivityType;
  action_description: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityLogInsert {
  agent_id?: string | null;
  action_type: ActivityType;
  action_description?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  status?: 'success' | 'failed' | 'pending';
  error_message?: string | null;
  metadata?: Record<string, any>;
}

// ============================================
// WINNING CONTENT (RAG)
// ============================================

export interface WinningContent {
  id: string;
  agent_id: string;
  drive_file_id: string;
  file_name: string | null;
  file_type: 'image' | 'text' | 'note' | null;
  file_url: string | null;
  extracted_text: string | null;
  style_notes: string | null;
  engagement_score: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  platform: Platform | null;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface WinningContentInsert {
  agent_id: string;
  drive_file_id: string;
  file_name?: string | null;
  file_type?: 'image' | 'text' | 'note' | null;
  file_url?: string | null;
  extracted_text?: string | null;
  style_notes?: string | null;
  engagement_score?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  platform?: Platform | null;
}

// ============================================
// EMAILS
// ============================================

export interface Email {
  id: string;
  user_id: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  subject: string | null;
  sender_email: string | null;
  sender_name: string | null;
  recipient_email: string | null;
  body_preview: string | null;
  body_full: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_replied: boolean;
  ai_summary: string | null;
  suggested_reply: string | null;
  labels: string[];
  received_at: string | null;
  created_at: string;
}

export interface EmailInsert {
  gmail_message_id: string;
  gmail_thread_id?: string | null;
  subject?: string | null;
  sender_email?: string | null;
  sender_name?: string | null;
  recipient_email?: string | null;
  body_preview?: string | null;
  body_full?: string | null;
  is_read?: boolean;
  is_starred?: boolean;
  labels?: string[];
  received_at?: string | null;
}

// ============================================
// MEETINGS
// ============================================

export interface Meeting {
  id: string;
  user_id: string;
  calendly_event_id: string | null;
  calendly_invitee_id: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  invitee_name: string | null;
  invitee_email: string | null;
  scheduled_start: string;
  scheduled_end: string;
  timezone: string | null;
  status: MeetingStatus;
  created_via: 'telegram' | 'dashboard' | 'calendly_direct' | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingInsert {
  calendly_event_id?: string | null;
  calendly_invitee_id?: string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  invitee_name?: string | null;
  invitee_email?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  timezone?: string | null;
  status?: MeetingStatus;
  created_via?: 'telegram' | 'dashboard' | 'calendly_direct' | null;
}

// ============================================
// TELEGRAM SESSIONS
// ============================================

export interface TelegramSession {
  id: string;
  user_id: string;
  telegram_chat_id: number;
  telegram_user_id: number | null;
  telegram_username: string | null;
  current_context: Record<string, any>;
  last_command: string | null;
  awaiting_response: 'trend_approval' | 'post_confirmation' | null;
  pending_trend_id: string | null;
  pending_post_id: string | null;
  last_activity_at: string;
  created_at: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  postsToday: number;
  postsScheduled: number;
  imagesGenerated: number;
  trendsDetected: number;
  activeAgents: number;
  totalPosts: number;
}

export interface AgentStats {
  agent_id: string;
  agent_name: string;
  posts_today: number;
  posts_week: number;
  posts_total: number;
  avg_engagement: number;
  last_post_at: string | null;
  status: AgentStatus;
}

// ============================================
// CONTENT GENERATION TYPES
// ============================================

export interface GeneratedContent {
  topic: string;
  research_summary: string;
  x_content: string;
  linkedin_content: string;
  instagram_content: string;
  image_prompt: string;
  suggested_hashtags: {
    x: string[];
    linkedin: string[];
    instagram: string[];
  };
}

export interface ImageGenerationResult {
  url: string;
  cloudinary_url: string;
  fal_generation_id: string;
  prompt_used: string;
}

// ============================================
// TELEGRAM COMMAND TYPES
// ============================================

export type TelegramCommand =
  | '/start'
  | '/help'
  | '/status'
  | '/post'
  | '/schedule'
  | '/queue'
  | '/trends'
  | '/pause'
  | '/resume'
  | '/agents'
  | '/email'
  | '/meetings';

export interface TelegramMessage {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: any;
}

// ============================================
// BUFFER API TYPES
// ============================================

export interface BufferProfile {
  id: string;
  service: string;
  formatted_service: string;
  avatar_https: string;
  formatted_username: string;
}

export interface BufferPostPayload {
  profile_ids: string[];
  text: string;
  media?: {
    link: string;
    photo?: string;
  };
  scheduled_at?: string;
}

// ============================================
// SUPABASE DATABASE TYPE EXPORT
// ============================================

export interface Database {
  public: {
    Tables: {
      api_keys: {
        Row: ApiKey;
        Insert: ApiKeyInsert & { user_id: string };
        Update: ApiKeyUpdate;
      };
      agents: {
        Row: Agent;
        Insert: AgentInsert & { user_id: string };
        Update: AgentUpdate;
      };
      buffer_accounts: {
        Row: BufferAccount;
        Insert: BufferAccountInsert & { user_id: string };
        Update: Partial<BufferAccountInsert>;
      };
      trends: {
        Row: Trend;
        Insert: TrendInsert;
        Update: Partial<TrendInsert>;
      };
      posts: {
        Row: Post;
        Insert: PostInsert & { user_id: string };
        Update: PostUpdate;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: ActivityLogInsert & { user_id: string };
        Update: never;
      };
      winning_content: {
        Row: WinningContent;
        Insert: WinningContentInsert;
        Update: Partial<WinningContentInsert>;
      };
      emails: {
        Row: Email;
        Insert: EmailInsert & { user_id: string };
        Update: Partial<EmailInsert>;
      };
      meetings: {
        Row: Meeting;
        Insert: MeetingInsert & { user_id: string };
        Update: Partial<MeetingInsert>;
      };
      telegram_sessions: {
        Row: TelegramSession;
        Insert: Omit<TelegramSession, 'id' | 'created_at'>;
        Update: Partial<TelegramSession>;
      };
    };
  };
}