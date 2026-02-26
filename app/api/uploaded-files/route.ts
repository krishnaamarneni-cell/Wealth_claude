import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 401 })

    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false })

    if (error) throw error
    return NextResponse.json(data?.map(f => ({
      id: f.file_id,
      name: f.name,
      uploadDate: f.upload_date,
      transactionCount: f.transaction_count
    })) || [])
  } catch (e) {
    console.error('[uploaded-files] GET error:', e)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const file = await request.json()
    const { error } = await supabase.from('uploaded_files').upsert({
      user_id: user.id,
      file_id: file.id,
      name: file.name,
      upload_date: file.uploadDate,
      transaction_count: file.transactionCount
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[uploaded-files] POST error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerSideClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabase.from('uploaded_files').delete().eq('user_id', user.id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[uploaded-files] DELETE error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}