import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[DELETE /api/transactions] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // NEXT.JS 16: params is a Promise - MUST BE AWAITED
    const { id: transactionId } = await params

    if (!transactionId) {
      console.error('[DELETE /api/transactions] No transaction ID provided')
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    console.log('[DELETE /api/transactions] Deleting:', transactionId, 'for user:', user.id)

    // Delete transaction from Supabase
    // RLS policy ensures user can only delete their own transactions
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/transactions] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
    }

    console.log('[DELETE /api/transactions] ✅ Deleted transaction:', transactionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/transactions] Unexpected error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
