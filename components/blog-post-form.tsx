'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Eye, Save, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/types/database'

interface BlogFormData {
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string[]
  featured_image: File | null
  featured_image_alt: string
  secondary_image: File | null
  secondary_image_alt: string
}

interface BlogFormProps {
  onSave?: (data: BlogFormData & { status: 'draft' | 'published' }) => void
}

// Auto-generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function BlogPostForm({ onSave }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: [],
    featured_image: null,
    featured_image_alt: '',
    secondary_image: null,
    secondary_image_alt: '',
  })

  const [previewImages, setPreviewImages] = useState<{
    featured: string | null
    secondary: string | null
  }>({
    featured: null,
    secondary: null,
  })

  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }))
  }

  const handleImageSelect = (type: 'featured' | 'secondary', file: File | null) => {
    if (!file) return

    setFormData(prev => ({
      ...prev,
      [type === 'featured' ? 'featured_image' : 'secondary_image']: file,
    }))

    const reader = new FileReader()
    reader.onload = e => {
      setPreviewImages(prev => ({
        ...prev,
        [type]: e.target?.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${folder}/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath)

      return publicUrlData.publicUrl
    } catch (err) {
      console.error('Image upload error:', err)
      throw err
    }
  }

  const handleSaveDraft = async () => {
    await savePost('draft')
  }

  const handlePublish = async () => {
    await savePost('published')
  }

  const savePost = async (status: 'draft' | 'published') => {
    try {
      setLoading(true)
      setError(null)

      if (!formData.title.trim()) {
        setError('Title is required')
        return
      }

      if (!formData.content.trim()) {
        setError('Content is required')
        return
      }

      let featured_image_url: string | null = null
      let secondary_image_url: string | null = null

      if (formData.featured_image) {
        featured_image_url = await uploadImage(formData.featured_image, 'featured')
      }

      if (formData.secondary_image) {
        secondary_image_url = await uploadImage(formData.secondary_image, 'secondary')
      }

      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError('Not authenticated')
        return
      }

      const { error: insertError } = await supabase.from('blog_posts').insert({
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        excerpt: formData.excerpt,
        featured_image: featured_image_url,
        featured_image_alt: formData.featured_image_alt,
        secondary_image: secondary_image_url,
        secondary_image_alt: formData.secondary_image_alt,
        tags: formData.tags,
        status,
        author_id: userData.user.id,
      } as Database['public']['Tables']['blog_posts']['Insert'])

      if (insertError) throw insertError

      // Reset form
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        tags: [],
        featured_image: null,
        featured_image_alt: '',
        secondary_image: null,
        secondary_image_alt: '',
      })
      setPreviewImages({ featured: null, secondary: null })

      if (onSave) {
        onSave({ ...formData, status })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Post Title</Label>
        <Input
          id="title"
          placeholder="Enter post title"
          value={formData.title}
          onChange={handleTitleChange}
          className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">Slug (auto-generated)</Label>
        <Input
          id="slug"
          value={formData.slug}
          readOnly
          className="bg-slate-900 border-slate-700 text-slate-400"
        />
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          placeholder="Brief description of your post"
          value={formData.excerpt}
          onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
          className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
          rows={3}
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          placeholder="Write your blog post content here..."
          value={formData.content}
          onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
          className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 font-mono text-sm"
          rows={12}
        />
      </div>

      {/* Featured Image */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base">Featured Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewImages.featured && (
            <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden">
              <img src={previewImages.featured} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageSelect('featured', e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload Image</span>
              </div>
            </label>
          </div>
          <Input
            placeholder="Alt text for image"
            value={formData.featured_image_alt}
            onChange={e => setFormData(prev => ({ ...prev, featured_image_alt: e.target.value }))}
            className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
          />
        </CardContent>
      </Card>

      {/* Secondary Image */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base">Secondary Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewImages.secondary && (
            <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden">
              <img src={previewImages.secondary} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={e => handleImageSelect('secondary', e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload Image</span>
              </div>
            </label>
          </div>
          <Input
            placeholder="Alt text for image"
            value={formData.secondary_image_alt}
            onChange={e => setFormData(prev => ({ ...prev, secondary_image_alt: e.target.value }))}
            className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add tag and press Enter"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
          />
          <Button onClick={handleAddTag} variant="outline" className="bg-slate-800 border-slate-600 hover:bg-slate-700">
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map(tag => (
              <div
                key={tag}
                className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-600 rounded-full text-sm"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSaveDraft}
          disabled={loading}
          variant="outline"
          className="gap-2 bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <Save className="h-4 w-4" />
          Save Draft
        </Button>
        <Button
          onClick={handlePublish}
          disabled={loading}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Eye className="h-4 w-4" />
          Publish
        </Button>
      </div>
    </div>
  )
}
