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

    const updateData: Record<string, unknown> = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    if (body.status === 'posted') {
      updateData.posted_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('video_queue')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[video-queue] PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[video-queue] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabase()
    const { id } = await params

    const { error } = await supabase
      .from('video_queue')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[video-queue] DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[video-queue] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
