'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Edit3 } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  content: string
  published: boolean
  created_at: string
}

export default function BlogAdmin() {
  const supabase = createClient()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', published: false })
  const [editingId, setEditingId] = useState<string | null>(null)

  // Realtime posts
  useEffect(() => {
    // Initial load
    fetchPosts()
    
    // Realtime subscription
    const channel = supabase
      .channel('blog-posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blog_posts' }, 
        () => fetchPosts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (editingId) {
      // Update
      await supabase
        .from('blog_posts')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', editingId)
    } else {
      // Create
      await supabase.from('blog_posts').insert(form)
    }
    
    setForm({ title: '', content: '', published: false })
    setEditingId(null)
    setLoading(false)
  }

  const deletePost = async (id: string) => {
    if (confirm('Delete post?')) {
      await supabase.from('blog_posts').delete().eq('id', id)
    }
  }

  const editPost = (post: BlogPost) => {
    setForm({ 
      title: post.title, 
      content: post.content, 
      published: post.published 
    })
    setEditingId(post.id)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Badge variant="secondary">{posts.length} posts</Badge>
      </div>

      {/* Create/Edit Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Post' : 'New Post'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Post title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Textarea
              placeholder="Post content (Markdown supported)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              required
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              <label>Published</label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Update' : 'Create'} Post
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setForm({ title: '', content: '', published: false })
                    setEditingId(null)
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{post.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant={post.published ? 'default' : 'secondary'}>
                  {post.published ? 'Published' : 'Draft'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-3 mb-4">{post.content}</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => editPost(post)}
                >
                  <Edit3 className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => deletePost(post.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
