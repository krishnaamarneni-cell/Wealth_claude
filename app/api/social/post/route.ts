import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { v2 as cloudinary } from 'cloudinary'

function configureCloudinary() {
  const url = process.env.CLOUDINARY_URL
  if (!url) return false
  const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/)
  if (!match) return false
  cloudinary.config({
    cloud_name: match[3],
    api_key: match[1],
    api_secret: match[2],
  })
  return true
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const { platform, text, image_url, content_type } = body

    if (!process.env.MAKE_WEBHOOK_URL) {
      return NextResponse.json({ error: 'MAKE_WEBHOOK_URL not configured' }, { status: 500 })
    }

    let finalImageUrl = image_url

    // Upload image to Cloudinary for reliable public URL
    if (image_url && content_type === 'image') {
      const configured = configureCloudinary()
      if (configured) {
        try {
          const upload = await cloudinary.uploader.upload(image_url, {
            folder: 'wealthclaude/posts',
            resource_type: 'image',
          })
          finalImageUrl = upload.secure_url
          console.log('Cloudinary upload success:', finalImageUrl)
        } catch (uploadErr: any) {
          console.error('Cloudinary upload failed:', uploadErr.message)
          return NextResponse.json({
            error: `Image upload failed: ${uploadErr.message}. Try a different image.`
          }, { status: 500 })
        }
      } else {
        console.warn('CLOUDINARY_URL not configured or invalid, using original URL')
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

    const res = await fetch(process.env.MAKE_WEBHOOK_URL, {
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
