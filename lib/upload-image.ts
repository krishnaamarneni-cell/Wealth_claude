import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Downloads an image from an external URL and uploads it to Supabase Storage.
 * Returns the permanent Supabase public URL, or the original URL on failure.
 */
export async function downloadAndUpload(
  supabase: SupabaseClient,
  externalUrl: string,
  slug: string
): Promise<string> {
  if (!externalUrl) return ''

  try {
    const response = await fetch(externalUrl, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) return externalUrl

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('webp') ? 'webp'
      : 'jpg'

    const buffer = Buffer.from(await response.arrayBuffer())
    const key = `posts/${slug}.${ext}`

    const { error } = await supabase.storage
      .from('blog-images')
      .upload(key, buffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      console.warn('[upload-image] Storage upload failed:', error.message)
      return externalUrl
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(key)

    return publicUrl
  } catch (err) {
    console.warn('[upload-image] Download failed, keeping external URL:', err)
    return externalUrl
  }
}
