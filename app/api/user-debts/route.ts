import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
// v5 Force rebuild - ensuring normalizeDebtType deploys correctly

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
    
    // Convert debt type from title case to snake_case for Supabase enum
    const typeMap: { [key: string]: string } = {
      'Credit Card': 'credit_card',
      'Auto Loan': 'auto_loan',
      'Mortgage': 'mortgage',
      'Student Loan': 'student_loan',
      'Personal Loan': 'personal_loan',
      'Other': 'other',
    }
    
    const debtType = typeMap[body.type] || body.type.toLowerCase().replace(/\s+/g, '_')
    
    const { error, data } = await supabase
      .from('user_debts')
      .insert({
        user_id: user.id,
        name: body.name,
        type: debtType,
        balance: body.balance,
        apr: body.apr,
        min_payment: body.monthlyPayment || 0,
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

    // Type conversion - convert from UI format to database enum values
    const normalizeDebtType = (type: string): string => {
      if (!type) return 'other'
      // Convert to lowercase and replace spaces with underscores
      const normalized = type.toLowerCase().replace(/\s+/g, '_')
      // List of valid database enum values
      const validTypes = ['credit_card', 'auto_loan', 'mortgage', 'student_loan', 'personal_loan', 'other']
      return validTypes.includes(normalized) ? normalized : 'other'
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
      const debtType = normalizeDebtType(debt.type)
      console.log('[user-debts] PUT: Debt:', debt.name, '| Original type:', debt.type, '| Normalized type:', debtType)
      const { error: insertError } = await supabase
        .from('user_debts')
        .insert({
          user_id: user.id,
          name: debt.name,
          type: debtType,
          balance: debt.balance,
          apr: debt.apr,
          min_payment: debt.monthlyPayment || 0,
        })
      if (insertError) {
        console.error('[user-debts] PUT: Insert error for debt', debt.name, 'normalized type:', debtType, 'error:', insertError)
        throw insertError
      }
    }

    console.log('[user-debts] PUT: Successfully saved', debts.length, 'debts')
    return NextResponse.json({ success: true, count: debts.length })
  } catch (e: any) {
    console.error('[v0] [user-debts] PUT error:', e)
    console.error('[v0] [user-debts] Error details:', {
      message: e.message,
      code: e.code,
      status: e.status,
      details: e.details,
      hint: e.hint,
    })
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
