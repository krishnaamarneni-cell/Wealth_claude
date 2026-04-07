import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerSideClient(cookieStore)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabase()
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from('jobs')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('[jobs] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabase()
    const { id } = await params

    const { error } = await supabase.from('jobs').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[jobs] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
