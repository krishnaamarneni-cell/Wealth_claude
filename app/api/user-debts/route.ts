import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
// v6 DEPLOYMENT FORCE - Ensure type normalization deploys: "Credit Card" -> "credit_card"

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
    
    // Explicit type mapping
    const typeMap: { [key: string]: string } = {
      'Credit Card': 'credit_card',
      'credit_card': 'credit_card',
      'Auto Loan': 'auto_loan',
      'auto_loan': 'auto_loan',
      'Mortgage': 'mortgage',
      'mortgage': 'mortgage',
      'Student Loan': 'student_loan',
      'student_loan': 'student_loan',
      'Personal Loan': 'personal_loan',
      'personal_loan': 'personal_loan',
      'Other': 'other',
      'other': 'other',
    }
    
    let debtType = typeMap[body.type]
    if (!debtType) {
      debtType = body.type.toLowerCase().replace(/\s+/g, '_')
    }
    
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

    // Explicit type mapping - handle both formats
    const typeMap: { [key: string]: string } = {
      'Credit Card': 'credit_card',
      'credit_card': 'credit_card',
      'Auto Loan': 'auto_loan',
      'auto_loan': 'auto_loan',
      'Mortgage': 'mortgage',
      'mortgage': 'mortgage',
      'Student Loan': 'student_loan',
      'student_loan': 'student_loan',
      'Personal Loan': 'personal_loan',
      'personal_loan': 'personal_loan',
      'Other': 'other',
      'other': 'other',
    }
    
    console.log('[user-debts] PUT: Type mapping ready. Processing', debts.length, 'debts')

    // Delete existing debts for this user
    console.log('[user-debts] PUT: Deleting existing debts for user', user.id)
    const { error: deleteError } = await supabase
      .from('user_debts')
      .delete()
      .eq('user_id', user.id)
    if (deleteError) {
      console.error('[user-debts] PUT: Delete error:', deleteError)
      throw deleteError
    }

    // Insert all debts - ONLY with valid columns
    console.log('[user-debts] PUT: Inserting', debts.length, 'new debts')
    for (const debt of debts) {
      // Normalize type - convert "Credit Card" to "credit_card" format
      const rawType = String(debt.type || 'other')
      const normalizedType = typeMap[rawType] || rawType.toLowerCase().replace(/\s+/g, '_') || 'other'
      
      console.log(`[user-debts] PUT: Debt "${debt.name}" | Raw Type: "${rawType}" | Normalized: "${normalizedType}"`)
      
      const insertPayload = {
        user_id: user.id,
        name: debt.name,
        type: normalizedType,  // MUST be: credit_card, auto_loan, mortgage, student_loan, personal_loan, or other
        balance: Number(debt.balance) || 0,
        apr: Number(debt.apr) || 0,
        min_payment: Number(debt.monthlyPayment) || 0,
      }
      
      console.log(`[user-debts] PUT: Payload for ${debt.name}:`, JSON.stringify(insertPayload))
      
      const { error: insertError } = await supabase
        .from('user_debts')
        .insert(insertPayload)
      
      if (insertError) {
        console.error(`[user-debts] PUT: FAILED inserting ${debt.name}. Type was "${normalizedType}". Error:`, insertError)
        throw insertError
      }
      console.log(`[user-debts] PUT: Successfully inserted "${debt.name}" with type "${normalizedType}"`)
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
