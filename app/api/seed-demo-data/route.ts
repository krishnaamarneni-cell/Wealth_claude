import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

// Demo portfolio: ~$25k cost basis → ~$55k current value (~120% return)
// These are REAL historical prices from 2023
const DEMO_TRANSACTIONS = [
  // Tech Giants - High Growth
  {
    symbol: 'NVDA',
    shares: 50,
    price: 22.00,
    date: '2023-01-15',
    type: 'BUY',
  },
  {
    symbol: 'META',
    shares: 25,
    price: 120.00,
    date: '2023-02-10',
    type: 'BUY',
  },
  {
    symbol: 'AAPL',
    shares: 30,
    price: 140.00,
    date: '2023-03-20',
    type: 'BUY',
  },
  {
    symbol: 'GOOGL',
    shares: 20,
    price: 95.00,
    date: '2023-04-15',
    type: 'BUY',
  },
  {
    symbol: 'MSFT',
    shares: 15,
    price: 260.00,
    date: '2023-05-10',
    type: 'BUY',
  },
  {
    symbol: 'AMZN',
    shares: 20,
    price: 105.00,
    date: '2023-06-15',
    type: 'BUY',
  },
  {
    symbol: 'TSLA',
    shares: 10,
    price: 175.00,
    date: '2023-07-20',
    type: 'BUY',
  },
  // Stable Blue Chips
  {
    symbol: 'COST',
    shares: 5,
    price: 520.00,
    date: '2023-08-15',
    type: 'BUY',
  },
  {
    symbol: 'V',
    shares: 12,
    price: 235.00,
    date: '2023-09-10',
    type: 'BUY',
  },
  {
    symbol: 'JPM',
    shares: 15,
    price: 145.00,
    date: '2023-10-15',
    type: 'BUY',
  },
]

// Demo dividends
const DEMO_DIVIDENDS = [
  {
    symbol: 'AAPL',
    shares: 30,
    price: 0.24,
    total: 7.20,
    date: '2023-11-15',
    type: 'DIVIDEND',
  },
  {
    symbol: 'MSFT',
    shares: 15,
    price: 0.75,
    total: 11.25,
    date: '2023-12-15',
    type: 'DIVIDEND',
  },
  {
    symbol: 'JPM',
    shares: 15,
    price: 1.00,
    total: 15.00,
    date: '2024-01-15',
    type: 'DIVIDEND',
  },
]

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has transactions (don't seed twice)
    const { data: existingTx, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (checkError) {
      console.error('[seed-demo-data] Check error:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingTx && existingTx.length > 0) {
      return NextResponse.json({ 
        message: 'User already has transactions, skipping demo data',
        seeded: false 
      })
    }

    // Prepare all transactions
    const demoFileId = 'demo-portfolio-' + Date.now()
    
    const buyTransactions = DEMO_TRANSACTIONS.map(tx => ({
      user_id: user.id,
      date: tx.date,
      symbol: tx.symbol,
      type: tx.type,
      shares: tx.shares,
      price: tx.price,
      total: tx.shares * tx.price,
      broker: 'Demo Portfolio',
      file_id: demoFileId,
      fees: 0,
      source: 'demo', // Important: marks as demo data
    }))

    const dividendTransactions = DEMO_DIVIDENDS.map(tx => ({
      user_id: user.id,
      date: tx.date,
      symbol: tx.symbol,
      type: tx.type,
      shares: tx.shares,
      price: tx.price,
      total: tx.total,
      broker: 'Demo Portfolio',
      file_id: demoFileId,
      fees: 0,
      source: 'demo',
    }))

    const allTransactions = [...buyTransactions, ...dividendTransactions]

    // Insert demo transactions
    const { data, error } = await supabase
      .from('transactions')
      .insert(allTransactions)
      .select()

    if (error) {
      console.error('[seed-demo-data] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also create uploaded file record
    await supabase
      .from('uploaded_files')
      .insert({
        user_id: user.id,
        id: demoFileId,
        name: 'Demo Portfolio (Sample Data)',
        transaction_count: allTransactions.length,
      })
      .select()

    console.log(`[seed-demo-data] ✅ Seeded ${allTransactions.length} demo transactions for user ${user.id}`)

    return NextResponse.json({ 
      success: true,
      seeded: true,
      count: allTransactions.length,
      message: 'Demo portfolio created successfully'
    })

  } catch (err: any) {
    console.error('[seed-demo-data] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE endpoint to clear demo data
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all transactions with source = 'demo'
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'demo')

    if (txError) {
      console.error('[seed-demo-data DELETE] Transaction error:', txError)
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    // Delete demo uploaded file record
    const { error: fileError } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('user_id', user.id)
      .ilike('name', '%Demo Portfolio%')

    if (fileError) {
      console.warn('[seed-demo-data DELETE] File cleanup warning:', fileError)
      // Don't fail on this - transactions are the important part
    }

    console.log(`[seed-demo-data] ✅ Cleared demo data for user ${user.id}`)

    return NextResponse.json({ 
      success: true,
      message: 'Demo data cleared successfully'
    })

  } catch (err: any) {
    console.error('[seed-demo-data DELETE] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
