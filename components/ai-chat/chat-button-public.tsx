'use client'

import { usePathname } from 'next/navigation'
import { AIChatButton } from './chat-button'

/**
 * Conditionally renders AIChatButton only on non-dashboard pages.
 * Dashboard has its own AIChatButton inside PortfolioProvider.
 */
export function AIChatButtonPublic() {
  const pathname = usePathname()
  
  // Hide on dashboard routes (dashboard button will show instead)
  if (pathname?.startsWith('/dashboard')) {
    return null
  }
  
  return <AIChatButton />
}
