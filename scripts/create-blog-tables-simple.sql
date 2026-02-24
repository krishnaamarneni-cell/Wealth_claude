-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  featured_image_alt TEXT,
  secondary_image TEXT,
  secondary_image_alt TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to create blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow users to update their own posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow anyone to read published posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow users to read their own draft posts" ON blog_posts;

-- Allow authenticated users to create posts
CREATE POLICY "Allow authenticated users to create blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Allow authenticated users to update their own posts
CREATE POLICY "Allow users to update their own posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Allow anyone to read published posts
CREATE POLICY "Allow anyone to read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Allow users to read their own draft posts
CREATE POLICY "Allow users to read their own draft posts"
  ON blog_posts FOR SELECT
  USING (status = 'draft' AND auth.uid() = author_id);
