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
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create posts (admin only in application logic)
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

-- Allow admin to see all posts (handled in application logic)
CREATE POLICY "Allow users to read their own draft posts"
  ON blog_posts FOR SELECT
  USING (status = 'draft' AND auth.uid() = author_id);

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images' AND
    (auth.role() = 'authenticated')
  );

-- Allow public access to read blog images
CREATE POLICY "Allow public access to blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');
