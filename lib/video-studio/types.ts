export type VideoStatusType = 'pending' | 'approved' | 'posted' | 'skipped' | 'ready'
export type VideoPlatform = 'youtube' | 'twitter' | 'instagram' | 'linkedin'
export type VideoContentType = 'reel' | 'image'

export interface VideoQueueItem {
  id: string
  title: string | null
  source_url: string | null
  source_type: string
  platform: string
  duration: string | null
  thumbnail: string | null
  url: string | null
  views: number
  status: VideoStatusType
  text_content: string | null
  content_type: VideoContentType
  platforms: string[]
  scheduled_for: string | null
  media_url: string | null
  created_at: string
  posted_at: string | null
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
