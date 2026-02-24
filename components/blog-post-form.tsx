'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { BlogPost, BlogPostFormData } from '@/types/blog'
import { titleToSlug, parseTags, formatTags } from '@/lib/blog-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, X } from 'lucide-react'

interface BlogPostFormProps {
  post?: BlogPost | null
  onClose?: () => void
  onSave?: () => void
}

export function BlogPostForm({ post, onClose, onSave }: BlogPostFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: post?.title || '',
    slug: post?.slug || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    tags: post?.tags || [],
    featured_image: post?.featured_image || '',
    status: post?.status || 'draft',
  })
  const [tagInput, setTagInput] = useState(formatTags(formData.tags))

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !post) {
      setFormData((prev) => ({
        ...prev,
        slug: titleToSlug(formData.title),
      }))
    }
  }, [formData.title, post])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !post?.id) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${post.id}/featured.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('blog-images').getPublicUrl(fileName)

      setFormData((prev) => ({
        ...prev,
        featured_image: publicUrl,
      }))
    } catch (error) {
      console.error('[v0] Image upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent, status: 'draft' | 'published') {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required')
      return
    }

    try {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        tags: parseTags(tagInput),
        featured_image: formData.featured_image || null,
        status,
        author_id: userData.user.id,
        ...(status === 'published' && { published_at: new Date().toISOString() }),
      }

      if (post?.id) {
        // Update
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', post.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData])

        if (error) throw error
      }

      onSave?.()
    } catch (error) {
      console.error('[v0] Error saving post:', error)
      alert('Failed to save post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input
          placeholder="Post title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
        />
      </div>

      {/* Slug */}
      <div>
        <label className="text-sm font-medium mb-1 block">Slug</label>
        <Input
          placeholder="url-slug"
          value={formData.slug}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, slug: e.target.value }))
          }
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="text-sm font-medium mb-1 block">Excerpt</label>
        <Textarea
          placeholder="Brief summary (50-70 words)"
          value={formData.excerpt}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
          }
          rows={2}
        />
      </div>

      {/* Content */}
      <div>
        <label className="text-sm font-medium mb-1 block">Content</label>
        <Textarea
          placeholder="Post content (supports HTML)"
          value={formData.content}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, content: e.target.value }))
          }
          rows={6}
          className="font-mono text-xs"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium mb-1 block">Tags</label>
        <Input
          placeholder="finance, ai, stocks (comma-separated)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {parseTags(tagInput).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Featured Image */}
      {post?.id && (
        <div>
          <label className="text-sm font-medium mb-1 block">Featured Image</label>
          {formData.featured_image && (
            <div className="relative mb-2 rounded-md overflow-hidden">
              <img
                src={formData.featured_image}
                alt="Featured"
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, featured_image: '' }))
                }
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-4 w-4" />
            <span className="text-sm">Upload image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, 'draft')}
          disabled={loading}
          variant="outline"
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Draft'
          )}
        </Button>
        <Button
          type="button"
          onClick={(e) => handleSubmit(e, 'published')}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish'
          )}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

