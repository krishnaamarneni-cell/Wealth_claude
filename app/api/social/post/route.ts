import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { v2 as cloudinary } from 'cloudinary'

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL

// Configure Cloudinary from URL
const cloudinaryUrl = process.env.CLOUDINARY_URL
if (cloudinaryUrl) {
  const match = cloudinaryUrl.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/)
  if (match) {
    cloudinary.config({
      cloud_name: match[3],
      api_key: match[1],
      api_secret: match[2],
    })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { platform, text, image_url, content_type } = body

    if (!MAKE_WEBHOOK_URL) {
      return NextResponse.json({ error: 'MAKE_WEBHOOK_URL not configured' }, { status: 500 })
    }

    let finalImageUrl = image_url

    // Upload image to Cloudinary for reliable public URL
    if (image_url && content_type === 'image' && cloudinaryUrl) {
      try {
        const upload = await cloudinary.uploader.upload(image_url, {
          folder: 'wealthclaude/posts',
          resource_type: 'image',
        })
        finalImageUrl = upload.secure_url
      } catch (uploadErr: any) {
        console.error('Cloudinary upload failed, using original URL:', uploadErr.message)
      }
    }

    // Send to Make.com webhook
    const payload: Record<string, any> = {
      text: text || '',
      platform: platform || 'instagram',
      content_type: content_type || 'image',
      timestamp: new Date().toISOString(),
    }
    if (finalImageUrl) payload.image_url = finalImageUrl

    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json({ error: `Make.com webhook failed: ${res.status} ${errText}` }, { status: 500 })
    }

    // Log to activity
    await auth.supabase.from('video_activity_log').insert({
      title: (text || '').slice(0, 80),
      status: 'posted',
      platform: platform || 'instagram',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to post' }, { status: 500 })
  }
}
