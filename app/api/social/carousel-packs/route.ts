import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { data, error } = await auth.supabase
    .from('carousel_content_packs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await request.json()
  const { template_type, title, slides, category, description, is_featured } = body

  if (!template_type || !title || !slides) {
    return NextResponse.json({ error: 'template_type, title, and slides are required' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('carousel_content_packs')
    .insert({
      template_type,
      title,
      slides,
      category: category || 'product',
      description: description || null,
      is_featured: is_featured || false,
    } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
