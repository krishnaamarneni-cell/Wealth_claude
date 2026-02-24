'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase' // ← YOUR working client
import { BlogPostForm } from '@/components/blog-post-form' // ← Your advanced form
import { Button } from '@/components/ui/button'
// ... other imports

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  featured_image: string
  status: 'draft' | 'published'
  created_at: string
}

export function BlogAdmin() {
  const supabase = createBrowserClient()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  // Fetch posts (your working code)
  useEffect(() => {
    fetchPosts()
    // realtime...
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }

  // When BlogPostForm saves → refresh list
  const handlePostSaved = () => {
    fetchPosts()
    setSelectedPost(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between mb-8">
        <h1 className="text-3xl font-bold">Blog Posts ({posts.length})</h1>
      </div>

      {/* Sidebar: Post List */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {posts.map(post => (
            <Card key={post.id} className={selectedPost?.id === post.id ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="font-semibold mb-1">{post.title}</div>
                <Badge>{post.status === 'published' ? 'Published' : 'Draft'}</Badge>
                <div className="text-xs text-muted-foreground mt-2">{new Date(post.created_at).toLocaleDateString()}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-auto p-0 text-xs"
                  onClick={() => setSelectedPost(post)}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main: BlogPostForm */}
        <div className="lg:col-span-2">
          <BlogPostForm
            onSave={handlePostSaved}
            initialData={selectedPost || undefined}
          />
        </div>
      </div>
    </div>
  )
}
