-- ============================================================================
-- RLS Policies for WealthClaude Admin Tables
-- Run this in Supabase SQL Editor (supabase-pink-elephant)
-- ============================================================================

-- Helper: Check if the current user is the admin
-- Uses auth.jwt() to get the email from the session token
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) = (SELECT current_setting('app.admin_email', true));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simpler approach: hardcode admin email (more reliable)
-- Replace with your actual admin email
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) = 'krishna.amarneni@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 1. JOBS TABLE
-- Public can read active jobs (for /careers page)
-- Only admin can insert, update, delete
-- ============================================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can read active jobs" ON jobs;
DROP POLICY IF EXISTS "Admin can do everything with jobs" ON jobs;

-- Public read for active jobs only
CREATE POLICY "Public can read active jobs"
  ON jobs FOR SELECT
  USING (status = 'active');

-- Admin full access
CREATE POLICY "Admin can do everything with jobs"
  ON jobs FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


-- ============================================================================
-- 2. VIDEO_QUEUE TABLE
-- Only admin can read, insert, update, delete
-- ============================================================================

ALTER TABLE video_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to video_queue" ON video_queue;

CREATE POLICY "Admin full access to video_queue"
  ON video_queue FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


-- ============================================================================
-- 3. VIDEO_ACTIVITY_LOG TABLE
-- Only admin can read, insert, update, delete
-- ============================================================================

ALTER TABLE video_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to video_activity_log" ON video_activity_log;

CREATE POLICY "Admin full access to video_activity_log"
  ON video_activity_log FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


-- ============================================================================
-- 4. SUBSCRIBERS TABLE
-- Only admin can read all subscribers
-- Anyone can insert (for newsletter signup)
-- ============================================================================

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
DROP POLICY IF EXISTS "Admin can read all subscribers" ON subscribers;
DROP POLICY IF EXISTS "Admin can manage subscribers" ON subscribers;

-- Public insert for newsletter signup
CREATE POLICY "Anyone can subscribe"
  ON subscribers FOR INSERT
  WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin can manage subscribers"
  ON subscribers FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


-- ============================================================================
-- 5. LEADS TABLE
-- Only admin can read leads
-- Anyone can insert (for contact forms)
-- ============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON leads;
DROP POLICY IF EXISTS "Admin can manage leads" ON leads;

-- Public insert for contact/lead forms
CREATE POLICY "Anyone can submit a lead"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admin can manage leads"
  ON leads FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


-- ============================================================================
-- 6. BLOG_POSTS TABLE
-- Public can read published posts
-- Only admin can insert, update, delete
-- ============================================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Admin can manage blog posts" ON blog_posts;

-- Public read for published posts only
CREATE POLICY "Public can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Admin full access
CREATE POLICY "Admin can manage blog posts"
  ON blog_posts FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


-- ============================================================================
-- 7. AI_CHAT_LOGS TABLE
-- Users can insert their own logs
-- Only admin can read all logs
-- ============================================================================

ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own chat logs" ON ai_chat_logs;
DROP POLICY IF EXISTS "Admin can read all chat logs" ON ai_chat_logs;

-- Users can insert their own logs
CREATE POLICY "Users can insert own chat logs"
  ON ai_chat_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admin can read all chat logs"
  ON ai_chat_logs FOR SELECT
  USING (is_admin_user());


-- ============================================================================
-- VERIFICATION: Check RLS is enabled
-- ============================================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'jobs', 'video_queue', 'video_activity_log',
  'subscribers', 'leads', 'blog_posts', 'ai_chat_logs'
);
