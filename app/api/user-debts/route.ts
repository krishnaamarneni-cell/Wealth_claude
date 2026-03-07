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

    // Map snake_case to camelCase for frontend
    return NextResponse.json((data || []).map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      balance: d.balance,
      apr: d.apr,
      monthlyPayment: d.monthly_payment,
      minimumPayment: d.minimum_payment,
      dueDate: d.due_date,
      status: d.status,
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
        balance: body.balance,
        apr: body.apr,
        monthly_payment: body.monthlyPayment,
        minimum_payment: body.minimumPayment,
        due_date: body.dueDate || null,
        status: body.status || 'active',
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
        monthlyPayment: data.monthly_payment,
        minimumPayment: data.minimum_payment,
        dueDate: data.due_date,
        status: data.status,
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
    if (!user) {
      console.error('[user-debts] PUT: Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { debts } = body
    console.log('[user-debts] PUT: Received', debts?.length || 0, 'debts for user', user.id)
    
    if (!Array.isArray(debts)) {
      console.error('[user-debts] PUT: Invalid debts format - not an array')
      return NextResponse.json({ error: 'Debts must be an array' }, { status: 400 })
    }

    // Delete existing debts for this user, then insert new ones
    console.log('[user-debts] PUT: Deleting existing debts for user', user.id)
    const { error: deleteError } = await supabase
      .from('user_debts')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) {
      console.error('[user-debts] PUT: Delete error:', deleteError)
      throw deleteError
    }

    // Insert all debts
    console.log('[user-debts] PUT: Inserting', debts.length, 'new debts')
    for (const debt of debts) {
      console.log('[user-debts] PUT: Inserting debt:', debt.name, 'balance:', debt.balance)
      const { error: insertError } = await supabase
        .from('user_debts')
        .insert({
          user_id: user.id,
          name: debt.name,
          type: debt.type,
          balance: debt.balance,
          apr: debt.apr,
          monthly_payment: debt.monthlyPayment,
          minimum_payment: debt.minimumPayment,
          due_date: debt.dueDate || null,
          status: debt.status || 'active',
        })
      if (insertError) {
        console.error('[user-debts] PUT: Insert error for debt', debt.name, ':', insertError)
        throw insertError
      }
    }

    console.log('[user-debts] PUT: Successfully saved', debts.length, 'debts')
    return NextResponse.json({ success: true, count: debts.length })
  } catch (e) {
    console.error('[user-debts] PUT error:', e)
    return NextResponse.json({ error: 'Failed to save debts' }, { status: 500 })
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

    const { error } = await supabase.from('user_debts').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[user-debts] DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
