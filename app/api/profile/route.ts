import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json(null, { status: 401 })

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) return NextResponse.json(null)

    return NextResponse.json({
      fullName: data.full_name || '',
      username: data.username || '',
      email: user.email || '',
      bio: data.bio || '',
      timezone: data.timezone || 'UTC',
      currency: data.currency || 'USD',
      avatar: data.avatar_url || data.avatar || '',
      memberSince: data.created_at || new Date().toISOString(),
    })
  } catch (err) {
    console.error('[/api/profile] GET error:', err)
    return NextResponse.json(null, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await request.json()

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: profile.fullName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        timezone: profile.timezone || 'UTC',
        currency: profile.currency || 'USD',
        avatar: profile.avatar || '',
        avatar_url: profile.avatar || '',
      }, { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/profile] POST error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}