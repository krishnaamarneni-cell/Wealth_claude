'use client'

import { useEffect } from 'react'

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Fire once when the page mounts
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {
      // Silently fail — never break the page for tracking
    })
  }, [slug])

  return null
}
