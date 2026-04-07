-- Video Queue Management Tables
-- Run this in Supabase SQL Editor

-- Video queue table
CREATE TABLE IF NOT EXISTS video_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'instagram',
  platform TEXT DEFAULT 'instagram',
  duration TEXT,
  thumbnail TEXT,
  url TEXT,
  views INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'posted', 'skipped', 'ready')),
  text_content TEXT,
  content_type TEXT DEFAULT 'reel' CHECK (content_type IN ('reel', 'image')),
  platforms TEXT[] DEFAULT ARRAY['instagram'],
  scheduled_for TIMESTAMPTZ,
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS video_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES video_queue(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT,
  platform TEXT,
  url TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_queue_status ON video_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_queue_created_at ON video_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_activity_log_created_at ON video_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE video_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow authenticated users (admin check is in the app layer)
CREATE POLICY "Allow authenticated select on video_queue" ON video_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on video_queue" ON video_queue FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on video_queue" ON video_queue FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on video_queue" ON video_queue FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on video_activity_log" ON video_activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on video_activity_log" ON video_activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Also allow service role (for Python script)
CREATE POLICY "Allow service role on video_queue" ON video_queue FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role on video_activity_log" ON video_activity_log FOR ALL TO service_role USING (true);
