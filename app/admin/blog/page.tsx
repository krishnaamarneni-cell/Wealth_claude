'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Edit3, Image, Tag, Link } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  images?: string[]
  tags: string[]
  published: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

export default function BlogAdmin() {
  const supabase = createBrowserClient()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    slug: '',
    title: '',
    content: '',
    images: '',
    tags: '',
    published: false,
    published_at: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
    const channel = supabase
      .channel('blog_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, fetchPosts)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
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

    const postData = {
      ...form,
      images: form.images ? JSON.parse(form.images) : [],
      tags: form.tags ? JSON.parse(form.tags) : [],
      published_at: form.published && !form.published_at ? new Date().toISOString() : form.published_at,
      updated_at: new Date().toISOString()
    }

    if (editingId) {
      await supabase.from('blog_posts').update(postData).eq('id', editingId)
    } else {
      await supabase.from('blog_posts').insert(postData)
    }

    setForm({ slug: '', title: '', content: '', images: '', tags: '', published: false, published_at: '' })
    setEditingId(null)
    setLoading(false)
  }

  const deletePost = async (id: string) => {
    if (confirm('Delete post?')) {
      await supabase.from('blog_posts').delete().eq('id', id)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Blog Posts ({posts.length})</h1>

      {/* FORM */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Post' : 'New Post'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit}>
            <Input placeholder="Slug (auto-generate?)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Textarea placeholder="Content (HTML/Markdown)" value={form.content} rows={6} onChange={(e) => setForm({ ...form, content: e.target.value })} required />

            <div className="grid grid-cols-2 gap-4">
              <Input placeholder='Images JSON ["url1.jpg","url2.jpg"]' value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
              <Input placeholder='Tags JSON ["tech","ai"]' value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <label>Published</label>
              {form.published && (
                <Input type="datetime-local" value={form.published_at.slice(0, 16)} onChange={(e) => setForm({ ...form, published_at: e.target.value + ':00Z')} className="w-48" />
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button type="submit" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
              {editingId && <Button variant="outline" onClick={() => { setForm({ slug: '', title: '', content: '', images: '', tags: '', published: false, published_at: '' }); setEditingId(null) }}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LIST */}
      {posts.map(post => (
        <Card key={post.id} className="mb-4">
          <CardHeader className="flex-row items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">{post.title}</CardTitle>
                <Badge>{post.published ? 'Published' : 'Draft'}</Badge>
                {post.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
              {post.images?.[0] && <img src={post.images[0]} alt={post.title} className="w-24 h-24 object-cover rounded mb-2" />}
              <p className="text-sm line-clamp-2">{post.content.replace(/<[^>]*>/g, '')}</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={() => {
                setForm({
                  slug: post.slug, title: post.title, content: post.content,
                  images: JSON.stringify(post.images || []),
                  tags: JSON.stringify(post.tags),
                  published: post.published,
                  published_at: post.published_at || ''
                })
                setEditingId(post.id)
              }}>
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deletePost(post.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
