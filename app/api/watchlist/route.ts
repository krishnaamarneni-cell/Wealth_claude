import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id)
      .order('added_date', { ascending: false })

    if (error) {
      console.error('[/api/watchlist] Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err: any) {
    console.error('[/api/watchlist] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('watchlist')
      .insert([
        {
          user_id: user.id,
          symbol: body.symbol,
          company_name: body.company_name || null,
          added_date: body.added_date,
          added_price: body.added_price || null,
          price_alert: body.price_alert || null,
          alert_enabled: body.alert_enabled || false,
        },
      ])
      .select()

    if (error) {
      console.error('[/api/watchlist POST] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0])
  } catch (err: any) {
    console.error('[/api/watchlist POST] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
