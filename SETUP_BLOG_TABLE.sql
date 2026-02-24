-- Run this SQL in your Supabase dashboard (SQL Editor) to create the blog_posts table
-- https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql/new

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  featured_image_alt TEXT DEFAULT '',
  secondary_image TEXT,
  secondary_image_alt TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_author_id_idx ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON blog_posts(created_at DESC);

-- Enable Row-Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own posts
CREATE POLICY "Users can read own posts" ON blog_posts
  FOR SELECT
  USING (auth.uid() = author_id);

-- Allow authenticated users to read published posts
CREATE POLICY "Anyone can read published posts" ON blog_posts
  FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Allow users to create posts
CREATE POLICY "Users can create posts" ON blog_posts
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update own posts
CREATE POLICY "Users can update own posts" ON blog_posts
  FOR UPDATE
  USING (auth.uid() = author_id);

-- Allow users to delete own posts
CREATE POLICY "Users can delete own posts" ON blog_posts
  FOR DELETE
  USING (auth.uid() = author_id);
