'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  slug: string
}

export function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    // Small delay to not block page render
    const timer = setTimeout(() => {
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      }).catch(() => {
        // Silent fail - don't break UX for analytics
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [slug])

  // Renders nothing
  return null
}
