// ============================================
// Regenerate Post Image API
// app/api/agents/posts/regenerate-image/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSideClient } from '@/lib/supabase';
import { generateImage } from '@/lib/agents/image-generator';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerSideClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { post_id, topic } = await request.json();

    if (!post_id) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    // Verify post belongs to user
    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .eq('user_id', user.id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only allow regeneration for draft/scheduled posts
    if (!['draft', 'scheduled'].includes(post.status)) {
      return NextResponse.json({
        error: 'Can only regenerate images for draft or scheduled posts'
      }, { status: 400 });
    }

    // Generate new image
    const imagePrompt = topic || post.topic || 'professional business visual';
    const imageResult = await generateImage(user.id, `Create a professional visual for: ${imagePrompt}`);

    if (!imageResult.success || !imageResult.url) {
      return NextResponse.json({
        error: imageResult.error || 'Failed to generate image'
      }, { status: 500 });
    }

    // Update post with new image
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        image_url: imageResult.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      agent_id: post.agent_id,
      action_type: 'image_regenerated',
      action_description: `Regenerated image using ${imageResult.provider}`,
      related_entity_type: 'post',
      related_entity_id: post_id,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      data: {
        image_url: imageResult.url,
        provider: imageResult.provider,
      },
      message: `Image regenerated using ${imageResult.provider}`,
    });

  } catch (error: any) {
    console.error('Regenerate image error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}