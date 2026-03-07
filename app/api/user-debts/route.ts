import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 401 })

    const { data, error } = await supabase
      .from('user_debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json((data || []).map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      balance: d.balance,
      apr: d.apr,
      monthlyPayment: d.min_payment,
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
    const debtType = body.type || 'Other'

    const { error, data } = await supabase
      .from('user_debts')
      .insert({
        user_id: user.id,
        name: body.name,
        type: debtType,
        balance: Number(body.balance) || 0,
        apr: Number(body.apr) || 0,
        min_payment: Number(body.monthlyPayment) || 0,
      })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json({
      success: true,
      debt: {
        id: data.id,
        name: data.name,
        type: data.type,
        balance: data.balance,
        apr: data.apr,
        monthlyPayment: data.min_payment,
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

    // Delete all existing debts for this user
    const { error: deleteError } = await supabase
      .from('user_debts')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) throw deleteError

    // Insert only the valid 6 columns: user_id, name, type, balance, apr, min_payment
    for (const debt of debts) {
      const debtType = debt.type || 'Other'
      
      const { error: insertError } = await supabase
        .from('user_debts')
        .insert({
          user_id: user.id,
          name: debt.name,
          type: debtType,
          balance: Number(debt.balance) || 0,
          apr: Number(debt.apr) || 0,
          min_payment: Number(debt.monthlyPayment) || 0,
        })
      
      if (insertError) {
        console.error(`[user-debts] PUT: Insert error for debt ${debt.name} error:`, insertError)
        throw insertError
      }
    }

    return NextResponse.json({ success: true, count: debts.length })
  } catch (e: any) {
    console.error('[v0] [user-debts] PUT error:', e)
    return NextResponse.json({ error: 'Failed to save debts', details: e.message }, { status: 500 })
  }
}

    const body = await req.json()
    const { debts } = body
    
    if (!Array.isArray(debts)) {
      return NextResponse.json({ error: 'Debts must be an array' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('user_debts')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) throw deleteError

    for (const debt of debts) {
      const debtType = debt.type || 'Other'
      
      const { error: insertError } = await supabase
        .from('user_debts')
        .insert({
          user_id: user.id,
          name: debt.name,
          type: debtType,
          balance: Number(debt.balance) || 0,
          apr: Number(debt.apr) || 0,
          min_payment: Number(debt.monthlyPayment) || 0,
        })
      
      if (insertError) {
        console.error(`[user-debts] PUT: Insert error for debt ${debt.name}:`, insertError)
        throw insertError
      }
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
