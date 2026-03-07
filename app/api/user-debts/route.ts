import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
// v8 DEPLOYMENT FORCE - Fixed: No type conversion, no due_date column, only valid columns

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
    
    // Pass type exactly as-is - database expects Title Case: "Credit Card", "Auto Loan", etc.
    const debtType = body.type || 'Other'

    const { error, data } = await supabase
      .from('user_debts')
      .insert({
        user_id: user.id,
        name: body.name,
        type: debtType,
        balance: parseFloat(String(body.balance)) || 0,
        apr: parseFloat(String(body.apr)) || 0,
        min_payment: parseFloat(String(body.monthlyPayment)) || 0,
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
  console.log('[user-debts] PUT: === HANDLER CALLED - v9 DEPLOYED ===')
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

    // FIRST: Delete all existing debts for this user to prevent duplicates
    console.log('[user-debts] PUT: Deleting existing debts for user', user.id)
    const { error: deleteError } = await supabase
      .from('user_debts')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) {
      console.error('[user-debts] PUT: Delete error:', deleteError)
      throw deleteError
    }

    // SECOND: Insert all debts - ONLY with valid columns
    console.log('[user-debts] PUT: Inserting', debts.length, 'new debts')
    for (const debt of debts) {
      // Pass type exactly as-is - database expects Title Case: "Credit Card", "Auto Loan", etc.
      const debtType = debt.type || 'Other'
      
      const insertPayload = {
        user_id: user.id,
        name: debt.name,
        type: debtType,
        balance: Number(debt.balance) || 0,
        apr: Number(debt.apr) || 0,
        min_payment: Number(debt.monthlyPayment) || 0,
      }
      
      console.log(`[user-debts] PUT: Inserting "${debt.name}" with type: "${debtType}"`)
      
      const { error: insertError } = await supabase
        .from('user_debts')
        .insert(insertPayload)
      
      if (insertError) {
        console.error(`[user-debts] PUT: FAILED inserting "${debt.name}". Error:`, insertError)
        throw insertError
      }
      console.log(`[user-debts] PUT: Successfully inserted "${debt.name}"`)
    }

    console.log('[user-debts] PUT: Successfully saved', debts.length, 'debts')
    return NextResponse.json({ success: true, count: debts.length })
  } catch (e: any) {
    console.error('[v0] [user-debts] PUT error:', e)
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

    const { error } = await supabase.from('user_debts').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[user-debts] DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
