'use client'

import { useState, useRef, useEffect } from 'react'
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

export function AIChatButton() {
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

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response — will be replaced in Phase 3 with real Groq call
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          "I'm not connected to an LLM yet — that's coming in **Phase 3**. Once wired up, I'll analyze your portfolio, goals, and more.\n\nFor now, the UI works!",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  if (!isVisible) return null

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Side Panel */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent
          side="right"
          className="w-[380px] sm:max-w-[380px] p-0 flex flex-col gap-0 bg-background/95 backdrop-blur-xl"
        >
          {/* Header */}
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

          {/* Messages Area */}
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

          {/* Input Area */}
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

      {/* Floating Button */}
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
