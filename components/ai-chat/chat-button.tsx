'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, X, Maximize2, Sparkles, Send } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ChatMessageList, type ChatMessage } from '@/components/ai-chat/chat-message-list'
import { buildPortfolioSnapshot } from '@/components/ai-chat/financial-snapshot'
import { usePortfolioSafe } from '@/lib/portfolio-context'

// ── Core chat UI — shared by both exports ─────────────────────────────────

function ChatButtonCore({ portfolioCtx }: { portfolioCtx: any }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const portfolioSnapshot =
        portfolioCtx && portfolioCtx.holdings && portfolioCtx.holdings.length > 0
          ? buildPortfolioSnapshot(portfolioCtx)
          : null

      const chatHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          portfolioSnapshot,
          chatHistory,
        }),
      })

      if (response.status === 401) {
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            '**Please log in to use WealthClaude AI.** I need access to your financial data to give personalized advice.\n\n[Sign up free →](/auth)',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
        return
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response ?? 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('[AI Chat] Error:', error)
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again in a moment.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [portfolioCtx, messages])

  const handleSend = () => sendMessage(input)

  if (!isVisible) return null

  const hasMessages = messages.length > 0

  return (
    <>
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent
          side="right"
          className="w-[380px] sm:max-w-[380px] p-0 flex flex-col gap-0 bg-background/95 backdrop-blur-xl"
        >
          <SheetHeader className="p-3 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-600/15 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-semibold">
                    WealthClaude AI
                  </SheetTitle>
                  <SheetDescription className="text-[11px] leading-tight">
                    Your financial assistant
                  </SheetDescription>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsChatOpen(false)
                  router.push('/chat')
                }}
                className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Expand to full page"
                title="Open full chat"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3">
            {!hasMessages && !isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    How can I help?
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[220px]">
                    Ask about your portfolio, goals, debts, or market trends.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ChatMessageList messages={messages} isLoading={isLoading} />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="p-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim() && !isLoading) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="flex-1 h-9 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-muted disabled:text-muted-foreground text-white flex items-center justify-center transition-all duration-200 shrink-0"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        {!isChatOpen && (
          <button
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            aria-label="Dismiss chat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={() => setIsChatOpen(true)}
          className="group relative h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          aria-label="Open AI chat"
        >
          {!isChatOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping [animation-duration:3s]" />
          )}
          <MessageSquare className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
        </button>
      </div>
    </>
  )
}

// ── Dashboard version — reads PortfolioContext ─────────────────────────────

export function AIChatButton() {
  const ctx = usePortfolioSafe()
  return <ChatButtonCore portfolioCtx={ctx} />
}

// ── Public version — no portfolio data ────────────────────────────────────

export function AIChatButtonPublic() {
  return <ChatButtonCore portfolioCtx={null} />
}
