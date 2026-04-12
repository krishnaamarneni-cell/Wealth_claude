import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderNewsImage } from '@/lib/news-image-renderers'
import type { NewsTemplateType } from '@/src/types/database'

/**
 * NEWS QUEUE — Polled by local Python script.
 *
 * GET  → Fetch next queued news image to process (returns HTML + data)
 * POST → Mark as completed with Cloudinary URL
 *
 * Same pattern as /api/video/poll + /api/video/complete
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return auth === `Bearer ${secret}`
}

// GET — Fetch next queued news image
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('news_image_posts')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ post: null, message: 'No queued news images' })
  }

  // Mark as 'processing'
  await supabase
    .from('news_image_posts')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', data.id)

  // Generate the full HTML page for Playwright to screenshot
  const template = data.template_type as NewsTemplateType
  const html = renderNewsImage(template, {
    headline: data.headline,
    source: data.source,
    category: data.category,
    date: data.date,
    key_points: data.key_points,
    quote: data.quote,
    market_impact: data.market_impact,
    big_stat: data.big_stat,
    timeline_events: data.timeline_events,
    context_points: data.context_points,
  })

  const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0A0A08;}</style>
</head><body style="width:420px;height:525px;overflow:hidden;">
${html}
</body></html>`

  return NextResponse.json({
    post: data,
    html: fullHtml,
    screenshot: {
      width: 420,
      height: 525,
      scale: 2.5714, // 420 * 2.5714 = 1080px
      output_width: 1080,
      output_height: 1350,
    },
  })
}

// POST — Mark as completed with Cloudinary URL
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { post_id, cloudinary_url, status, error: errorMsg } = body

  if (!post_id) {
    return NextResponse.json({ error: 'post_id is required' }, { status: 400 })
  }

  const updates: any = {
    updated_at: new Date().toISOString(),
  }

  if (status === 'error') {
    updates.status = 'error'
  } else if (cloudinary_url) {
    updates.exported_url = cloudinary_url
    updates.status = 'exported'
  }

  const { error } = await supabase
    .from('news_image_posts')
    .update(updates)
    .eq('id', post_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If exported, also send to Make.com webhook for Instagram posting
  if (cloudinary_url && process.env.MAKE_WEBHOOK_URL) {
    try {
      // Get the post data for caption
      const { data: post } = await supabase
        .from('news_image_posts')
        .select('headline, category, source')
        .eq('id', post_id)
        .single()

      const caption = post
        ? `${post.headline}\n\nSource: ${post.source || 'CNBC'}\n\n#${(post.category || 'markets').toLowerCase()} #finance #investing #wealthclaude #news`
        : ''

      await fetch(process.env.MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: caption,
          image_url: cloudinary_url,
          platform: 'instagram',
          content_type: 'image',
          timestamp: new Date().toISOString(),
          source: 'auto-news',
        }),
      })

      // Update status to 'posted'
      await supabase
        .from('news_image_posts')
        .update({ status: 'posted', updated_at: new Date().toISOString() })
        .eq('id', post_id)

    } catch (e) {
      console.error('Make.com webhook failed:', e)
    }
  }

  return NextResponse.json({ success: true })
}
