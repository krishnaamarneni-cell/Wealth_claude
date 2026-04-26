"use client"

import { useEffect, useState } from "react"

/**
 * Reusable scroll-aware hook.
 *
 * @param threshold pixel scroll Y to flip the `scrolled` state (default 80)
 * @returns object with:
 *   - scrolled: true once user passes threshold
 *   - direction: 'up' | 'down' | null — last meaningful scroll direction
 *   - y: current scroll position in pixels
 */
export function useScrolled(threshold = 80) {
  const [scrolled, setScrolled] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)
  const [y, setY] = useState(0)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (ticking) return
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        setY(currentY)
        setScrolled(currentY > threshold)
        // Only flip direction if scroll change is meaningful (avoid jitter)
        if (Math.abs(currentY - lastY) > 4) {
          setDirection(currentY > lastY ? 'down' : 'up')
          lastY = currentY
        }
        ticking = false
      })
      ticking = true
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return { scrolled, direction, y }
}
