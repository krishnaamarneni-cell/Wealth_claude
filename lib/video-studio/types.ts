export type VideoStatusType = 'pending' | 'processing' | 'approved' | 'posted' | 'skipped' | 'ready' | 'failed'
export type VideoPlatform = 'youtube' | 'twitter' | 'instagram' | 'linkedin'
export type VideoContentType = 'reel' | 'image' | 'youtube'

export interface VideoQueueItem {
  id: string
  title: string | null
  source_url: string | null
  source_type: string
  source_title: string | null
  platform: string
  duration: string | null
  duration_seconds: number | null
  thumbnail: string | null
  thumbnail_url: string | null
  url: string | null
  views: number
  status: VideoStatusType
  text_content: string | null
  content_type: VideoContentType
  platforms: string[]
  scheduled_for: string | null
  media_url: string | null
  processed_video_url: string | null
  video_type: 'short' | 'long' | null
  ai_title: string | null
  ai_description: string | null
  ai_tags: string[] | null
  youtube_video_id: string | null
  error_message: string | null
  created_at: string
  posted_at: string | null
  processed_at: string | null
  approved_at: string | null
  updated_at: string
}

export interface VideoStats {
  pending: number
  approved: number
  postedToday: number
  totalPosted: number
}

export interface VideoActivityItem {
  id: string
  video_id: string | null
  title: string | null
  status: string
  platform: string | null
  url: string | null
  views: number
  created_at: string
}
