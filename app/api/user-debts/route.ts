import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

// DB columns: id, user_id, name, type, balance, apr, min_payment, created_at
// No monthly_payment, minimum_payment, due_date, status columns exist

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 401 })

    const { data, error } = await supabase
      .from('user_debts')
      .select('id, user_id, name, type, balance, apr, min_payment, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error

    // Map DB columns to frontend camelCase
    return NextResponse.json((data || []).map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      balance: Number(d.balance),
      apr: Number(d.apr),
      monthlyPayment: Number(d.min_payment),
      minimumPayment: Number(d.min_payment),
    })))
  } catch (e) {
    console.error('[user-debts] GET error:', e)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const { error, data } = await supabase
      .from('user_debts')
      .insert({
        user_id: user.id,
        name: body.name,
        type: body.type,
        balance: Number(body.balance) || 0,
        apr: Number(body.apr) || 0,
        min_payment: Number(body.monthlyPayment || body.minimumPayment) || 0,
      })
      .select('id, name, type, balance, apr, min_payment')
      .single()
    if (error) throw error

    return NextResponse.json({
      success: true,
      debt: {
        id: data.id,
        name: data.name,
        type: data.type,
        balance: Number(data.balance),
        apr: Number(data.apr),
        monthlyPayment: Number(data.min_payment),
        minimumPayment: Number(data.min_payment),
      }
    })
  } catch (e) {
    console.error('[user-debts] POST error:', e)
    return NextResponse.json({ error: 'Failed to save debt' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { debts } = body

    if (!Array.isArray(debts)) {
      return NextResponse.json({ error: 'Debts must be an array' }, { status: 400 })
    }

    // Step 1: Delete ALL existing debts for THIS user only
    const { error: deleteError } = await supabase
      .from('user_debts')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) throw deleteError

    // Step 2: Re-insert the current list (only if non-empty)
    if (debts.length > 0) {
      const rows = debts.map((debt: any) => ({
        user_id: user.id,
        name: debt.name,
        type: debt.type || 'Other',
        balance: Number(debt.balance) || 0,
        apr: Number(debt.apr) || 0,
        min_payment: Number(debt.monthlyPayment || debt.minimumPayment) || 0,
      }))

      const { error: insertError } = await supabase
        .from('user_debts')
        .insert(rows)
      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true, count: debts.length })
  } catch (e: any) {
    console.error('[user-debts] PUT error:', e)
    return NextResponse.json({ error: 'Failed to save debts', details: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabase
      .from('user_debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[user-debts] DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
