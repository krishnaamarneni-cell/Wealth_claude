-- ============================================
-- VIDEO STUDIO SCHEMA FOR SUPABASE
-- Project: AIagents
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Video Queue: Main table for all videos to process
CREATE TABLE video_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source info
    source_url TEXT NOT NULL,
    source_type TEXT DEFAULT 'youtube', -- youtube, cspan, whitehouse, etc.
    source_title TEXT,
    
    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'approved', 'posted', 'skipped', 'failed')),
    
    -- Video metadata (filled after processing)
    title TEXT,
    description TEXT,
    tags TEXT[],
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    
    -- Generated content
    video_type TEXT CHECK (video_type IN ('short', 'long')),
    processed_video_url TEXT,
    
    -- AI generated
    ai_title TEXT,
    ai_description TEXT,
    ai_tags TEXT[],
    ai_hook TEXT,
    
    -- Posting info
    platforms TEXT[] DEFAULT '{}', -- ['youtube', 'twitter', 'instagram', 'linkedin']
    posted_platforms TEXT[] DEFAULT '{}',
    youtube_video_id TEXT,
    twitter_post_id TEXT,
    instagram_post_id TEXT,
    linkedin_post_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Activity Log: Track all actions for dashboard
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    action TEXT NOT NULL, -- 'video_queued', 'video_processed', 'video_approved', 'video_posted', 'video_skipped', 'settings_changed', 'account_connected'
    description TEXT NOT NULL,
    status TEXT, -- For status badge display
    
    video_id UUID REFERENCES video_queue(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings: App configuration
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Posting settings
    auto_post_enabled BOOLEAN DEFAULT FALSE,
    max_posts_per_day INTEGER DEFAULT 10,
    add_logo_to_videos BOOLEAN DEFAULT TRUE,
    
    -- Logo
    logo_url TEXT,
    
    -- Connected accounts
    youtube_connected BOOLEAN DEFAULT FALSE,
    youtube_channel_id TEXT,
    youtube_channel_name TEXT,
    
    twitter_connected BOOLEAN DEFAULT FALSE,
    twitter_username TEXT,
    
    instagram_connected BOOLEAN DEFAULT FALSE,
    instagram_username TEXT,
    
    linkedin_connected BOOLEAN DEFAULT FALSE,
    linkedin_profile_id TEXT,
    
    -- API credentials (encrypted or use env vars)
    -- These are just flags, actual keys should be in env
    youtube_credentials_set BOOLEAN DEFAULT FALSE,
    twitter_credentials_set BOOLEAN DEFAULT FALSE,
    instagram_credentials_set BOOLEAN DEFAULT FALSE,
    linkedin_credentials_set BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posting History: Track all posts
CREATE TABLE posting_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    video_id UUID REFERENCES video_queue(id) ON DELETE SET NULL,
    
    platform TEXT NOT NULL, -- 'youtube', 'twitter', 'instagram', 'linkedin'
    platform_post_id TEXT,
    platform_url TEXT,
    
    title TEXT,
    
    -- Stats (can be updated later)
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'posted', -- 'posted', 'failed', 'deleted'
    error_message TEXT,
    
    posted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_video_queue_status ON video_queue(status);
CREATE INDEX idx_video_queue_created ON video_queue(created_at DESC);
CREATE INDEX idx_video_queue_posted ON video_queue(posted_at DESC);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_posting_history_posted ON posting_history(posted_at DESC);
CREATE INDEX idx_posting_history_platform ON posting_history(platform);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER video_queue_updated_at
    BEFORE UPDATE ON video_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- Dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM video_queue WHERE status = 'pending') as pending_count,
    (SELECT COUNT(*) FROM video_queue WHERE status = 'approved') as approved_count,
    (SELECT COUNT(*) FROM video_queue WHERE status = 'ready') as ready_count,
    (SELECT COUNT(*) FROM video_queue WHERE status = 'posted' AND posted_at >= CURRENT_DATE) as posted_today,
    (SELECT COUNT(*) FROM video_queue WHERE status = 'posted') as total_posted,
    (SELECT COUNT(*) FROM video_queue WHERE status = 'processing') as processing_count,
    (SELECT COUNT(*) FROM video_queue WHERE status = 'failed') as failed_count;

-- Queue view with computed fields
CREATE OR REPLACE VIEW queue_view AS
SELECT 
    vq.*,
    COALESCE(vq.ai_title, vq.source_title, 'Untitled') as display_title,
    CASE 
        WHEN vq.duration_seconds < 60 THEN 'short'
        ELSE 'long'
    END as computed_type
FROM video_queue vq
ORDER BY 
    CASE vq.status
        WHEN 'ready' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'pending' THEN 3
        WHEN 'processing' THEN 4
        ELSE 5
    END,
    vq.created_at DESC;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create default settings row
INSERT INTO settings (id) VALUES (uuid_generate_v4());

-- Add welcome activity
INSERT INTO activity_log (action, description, status)
VALUES ('system', 'Video Studio initialized', 'Ready');

-- ============================================
-- ROW LEVEL SECURITY (Optional - Enable if needed)
-- ============================================

-- ALTER TABLE video_queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posting_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANTS (for service role)
-- ============================================

-- These are typically auto-granted in Supabase
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
