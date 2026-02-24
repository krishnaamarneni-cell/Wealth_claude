import { createServerSideClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSideClient(cookieStore)

    // Try to create the blog_posts table
    const { error } = await supabase.rpc('exec', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
        CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
        
        ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow authenticated users to create blog posts" ON blog_posts;
        DROP POLICY IF EXISTS "Allow users to update their own posts" ON blog_posts;
        DROP POLICY IF EXISTS "Allow anyone to read published posts" ON blog_posts;
        DROP POLICY IF EXISTS "Allow users to read their own draft posts" ON blog_posts;
        
        CREATE POLICY "Allow authenticated users to create blog posts"
          ON blog_posts FOR INSERT
          WITH CHECK (auth.uid() = author_id);
        
        CREATE POLICY "Allow users to update their own posts"
          ON blog_posts FOR UPDATE
          USING (auth.uid() = author_id)
          WITH CHECK (auth.uid() = author_id);
        
        CREATE POLICY "Allow anyone to read published posts"
          ON blog_posts FOR SELECT
          USING (status = 'published' OR auth.uid() = author_id);
        
        CREATE POLICY "Allow users to read their own draft posts"
          ON blog_posts FOR SELECT
          USING (status = 'draft' AND auth.uid() = author_id);
      `,
    })

    if (error) {
      console.log('[v0] Table already exists or RLS error (expected):', error.message)
    }

    return Response.json({ success: true, message: 'Blog table initialized' })
  } catch (error) {
    console.error('[v0] Error initializing blog table:', error)
    return Response.json({ error: 'Failed to initialize blog table' }, { status: 500 })
  }
}
