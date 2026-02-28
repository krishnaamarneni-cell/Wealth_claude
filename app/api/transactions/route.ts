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

    // Support both single transaction and bulk array { transactions: [...] }
    const items: any[] = Array.isArray(body.transactions)
      ? body.transactions
      : [body]

    const rows = items.map((tx: any) => ({
      user_id: user.id,
      date: tx.date,
      symbol: tx.symbol,
      type: tx.type,
      shares: tx.shares,
      price: tx.price,
      total: tx.total,
      broker: tx.broker || null,
      file_id: tx.fileId || tx.file_id || null,
      fees: tx.fees || 0,
      source: tx.source || 'manual',
    }))

    const { data, error } = await supabase
      .from('transactions')
      .insert(rows)
      .select()

    if (error) {
      console.error('[/api/transactions POST] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mapped = (data || []).map((t: any) => ({
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
    }))

    return NextResponse.json(mapped)
  } catch (err: any) {
    console.error('[/api/transactions POST] Error:', err)
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

    const body = await request.json()
    const { fileId, deleteAll } = body

    if (deleteAll) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
      if (error) {
        console.error('[/api/transactions DELETE] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('file_id', fileId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[/api/transactions DELETE] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[/api/transactions DELETE] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
