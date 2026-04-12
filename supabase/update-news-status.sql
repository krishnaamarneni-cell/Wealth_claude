-- Add new statuses to news_image_posts for automation pipeline
-- Run this if the table already exists with the old constraint

ALTER TABLE news_image_posts
  DROP CONSTRAINT IF EXISTS news_image_posts_status_check;

ALTER TABLE news_image_posts
  ADD CONSTRAINT news_image_posts_status_check
  CHECK (status IN ('draft','queued','processing','exported','posted','error'));

-- Also allow service role access for cron/automation
CREATE POLICY IF NOT EXISTS "Service role full access to news posts"
  ON news_image_posts FOR ALL
  USING (true)
  WITH CHECK (true);
