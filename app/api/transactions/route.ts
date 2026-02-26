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
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('[/api/transactions] Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map snake_case DB columns → camelCase for the frontend
    const mapped = (data || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      symbol: t.symbol,
      type: t.type,
      shares: t.shares,
      price: t.price,
      total: t.total,
      broker: t.broker,
      fileId: t.file_id,       // snake → camel
      fees: t.fees,
      source: t.source,
    }))

    return NextResponse.json(mapped)
  } catch (err: any) {
    console.error('[/api/transactions] Error:', err)
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
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          date: body.date,
          symbol: body.symbol,
          type: body.type,
          shares: body.shares,
          price: body.price,
          total: body.total,
          broker: body.broker || null,
          file_id: body.fileId || body.file_id || null,  // accept either format
          fees: body.fees || 0,
          source: body.source || 'manual',
        },
      ])
      .select()

    if (error) {
      console.error('[/api/transactions POST] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return camelCase too
    const t = data?.[0]
    return NextResponse.json(t ? {
      id: t.id,
      date: t.date,
      symbol: t.symbol,
      type: t.type,
      shares: t.shares,
      price: t.price,
      total: t.total,
      broker: t.broker,
      fileId: t.file_id,
      fees: t.fees,
      source: t.source,
    } : null)
  } catch (err: any) {
    console.error('[/api/transactions POST] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}