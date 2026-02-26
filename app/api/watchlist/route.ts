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

    // Map snake_case DB columns → camelCase for the frontend
    const mapped = (data || []).map((w: any) => ({
      id: w.id,
      symbol: w.symbol,
      companyName: w.company_name,   // snake → camel
      addedDate: w.added_date,       // snake → camel
      addedPrice: w.added_price,     // snake → camel
      priceAlert: w.price_alert,     // snake → camel
      alertEnabled: w.alert_enabled, // snake → camel
    }))

    return NextResponse.json(mapped)
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
          company_name: body.companyName || body.company_name || null,  // accept either format
          added_date: body.addedDate || body.added_date,
          added_price: body.addedPrice ?? body.added_price ?? null,
          price_alert: body.priceAlert ?? body.price_alert ?? null,
          alert_enabled: body.alertEnabled ?? body.alert_enabled ?? false,
        },
      ])
      .select()

    if (error) {
      console.error('[/api/watchlist POST] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return camelCase too
    const w = data?.[0]
    return NextResponse.json(w ? {
      id: w.id,
      symbol: w.symbol,
      companyName: w.company_name,
      addedDate: w.added_date,
      addedPrice: w.added_price,
      priceAlert: w.price_alert,
      alertEnabled: w.alert_enabled,
    } : null)
  } catch (err: any) {
    console.error('[/api/watchlist POST] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('symbol', symbol)

    if (error) {
      console.error('[/api/watchlist DELETE] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[/api/watchlist DELETE] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}