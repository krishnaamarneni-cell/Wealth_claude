'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AIChatButtonPublic as ChatButtonPublic } from './chat-button'

export function AIChatButtonPublic() {
  const pathname = usePathname()
  const [autoOpen, setAutoOpen] = useState(false)

  useEffect(() => {
    // Auto-open chat after 4 seconds on landing page, once per session
    if (pathname === '/' && typeof window !== 'undefined') {
      if (!sessionStorage.getItem('chat-auto-opened')) {
        const timer = setTimeout(() => {
          setAutoOpen(true)
          sessionStorage.setItem('chat-auto-opened', 'true')
        }, 4000)
        return () => clearTimeout(timer)
      }
    }
  }, [pathname])

  // Hide on dashboard routes (dashboard has its own chat button)
  if (pathname?.startsWith('/dashboard')) {
    return null
  }

  return <ChatButtonPublic autoOpen={autoOpen} />
}
