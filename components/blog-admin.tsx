'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BlogPost, BlogPostFormData } from '@/types/blog'
import { titleToSlug, parseTags, formatTags } from '@/lib/blog-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Edit2, Plus, Zap } from 'lucide-react'
import { BlogPostForm } from './blog-post-form'

export function BlogAdmin() {
  const supabase = createClient()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  // Load posts on mount and setup realtime
  useEffect(() => {
    loadPosts()
    setupRealtimeListener()
  }, [])

  async function loadPosts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('[v0] Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupRealtimeListener() {
    const channel = supabase
      .channel('blog_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blog_posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts((prev) => [payload.new as BlogPost, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPosts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as BlogPost) : p))
            )
          } else if (payload.eventType === 'DELETE') {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function generateWithAI(topic: string) {
    if (!topic.trim()) return

    try {
      setIsGenerating(true)
      const response = await fetch('/api/ai-generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })

      if (!response.ok) throw new Error('Failed to generate blog post')
      const data = await response.json()

      // Create new post with AI data
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const newPost: Partial<BlogPost> = {
        slug: titleToSlug(data.title),
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        tags: data.tags,
        status: 'draft',
        author_id: user.id,
      }

      const { data: savedPost, error } = await supabase
        .from('blog_posts')
        .insert([newPost])
        .select()
        .single()

      if (error) throw error

      setSelectedPost(savedPost)
      setIsFormOpen(true)
      setAiTopic('')
    } catch (error) {
      console.error('[v0] AI generation error:', error)
      alert('Failed to generate blog post')
    } finally {
      setIsGenerating(false)
    }
  }

  async function deletePost(id: string) {
    if (!confirm('Delete this post?')) return

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[v0] Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main content area */}
      <div className="lg:col-span-3">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Posts ({posts.length})</h2>
          <Button
            onClick={() => {
              setSelectedPost(null)
              setIsFormOpen(true)
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No posts yet. Create one to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {post.featured_image && (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="outline">{post.status}</Badge>
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post)
                          setIsFormOpen(true)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        {/* AI Generate section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              AI Write
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <input
              type="text"
              placeholder="Topic (e.g., NVDA earnings)"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  generateWithAI(aiTopic)
                }
              }}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={() => generateWithAI(aiTopic)}
              disabled={!aiTopic.trim() || isGenerating}
              className="w-full"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Form section */}
        {isFormOpen && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedPost ? 'Edit Post' : 'New Post'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BlogPostForm
                post={selectedPost}
                onClose={() => {
                  setIsFormOpen(false)
                  setSelectedPost(null)
                }}
                onSave={() => {
                  setIsFormOpen(false)
                  setSelectedPost(null)
                  loadPosts()
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

