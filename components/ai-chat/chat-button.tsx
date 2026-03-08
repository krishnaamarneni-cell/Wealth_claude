'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

export function AIChatButton() {
  const [isVisible, setIsVisible] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)

  if (!isVisible) return null

  return (
    <>
      {/* Chat Panel Placeholder — will be built in Step 2 */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 h-96 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Chat coming in Step 2</p>
        </div>
      )}

      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {/* Dismiss button — only visible when chat is closed */}
        {!isChatOpen && (
          <button
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            aria-label="Dismiss chat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Main chat toggle button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="group relative h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          aria-label={isChatOpen ? 'Close chat' : 'Open AI chat'}
        >
          {/* Subtle pulse ring — only when chat is closed */}
          {!isChatOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping [animation-duration:3s]" />
          )}

          {isChatOpen ? (
            <X className="h-5 w-5 transition-transform duration-200" />
          ) : (
            <MessageSquare className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>
      </div>
    </>
  )
}
