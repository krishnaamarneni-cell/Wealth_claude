'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, X, Maximize2, Sparkles, Send } from 'lucide-react'
import Image from 'next/image'
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

// ── Demo responses for non-logged-in visitors (zero API cost) ─────────────

const DEMO_RESPONSES: Record<string, string> = {
  "Am I properly diversified?": `**Based on a typical portfolio analysis, here's what diversification looks like:**

| Sector | Recommended | Common Mistake |
|--------|------------|----------------|
| Technology | 20-30% | 50%+ (overweight) |
| Healthcare | 10-15% | Often skipped |
| Financial | 10-15% | Underweight |
| Consumer | 10-15% | Ignored |
| Energy | 5-10% | Timing-dependent |

**Key diversification checks:**
- Do you have **5+ sectors** represented?
- Is any single stock more than **15%** of your portfolio?
- Do you have both **growth and value** stocks?

Sign up free to get a **real diversification score** based on your actual holdings.

*Not a licensed financial advisor.*`,

  "What's the best way to pay off debt?": `**Two proven strategies:**

| Strategy | How It Works | Best For |
|----------|-------------|----------|
| **Avalanche** | Pay highest APR first | Saving the most money |
| **Snowball** | Pay smallest balance first | Staying motivated |

**Quick math example:**
- Credit card at **22% APR** → Pay this first (avalanche)
- Student loan at **5% APR** → Pay minimum for now
- Car loan at **7% APR** → Pay after credit card

The avalanche method saves more money. The snowball method feels more rewarding.

Sign up to get a **personalized debt payoff plan** based on your actual debts.

*Not a licensed financial advisor.*`,

  "How is NVDA doing today?": `**NVIDIA (NVDA)** is one of the most watched stocks in 2024-2026.

| Metric | Detail |
|--------|--------|
| Sector | Technology / Semiconductors |
| Why it moves | AI chip demand, data center growth |
| Key risk | Valuation, competition from AMD |

To get **real-time NVDA price and analysis**, sign up and ask me — I'll pull the latest data from the web.

*Not a licensed financial advisor.*`,

  "Show me a sample portfolio analysis": `**Here's what a WealthClaude portfolio analysis looks like:**

| Metric | Sample Portfolio |
|--------|-----------------|
| Total Value | **$52,340** |
| Total Gain | **+$4,120 (+8.5%)** |
| Holdings | **22 stocks** |
| Top Sector | Technology (28%) |
| Diversification Score | **72/100** |

**AI Insights generated:**
- Your portfolio is **overweight in tech** (28% vs recommended 20-25%)
- **AMD** has gained **67%** — consider taking some profits
- You have **no healthcare exposure** — consider adding a position
- Your **Sharpe ratio is 1.2** — good risk-adjusted returns

Sign up free to get this analysis for **your real portfolio**.

*Not a licensed financial advisor.*`,
}

const DEFAULT_DEMO_RESPONSE = `Great question! With WealthClaude AI, I can analyze your portfolio, track your debts, monitor market trends, and give you personalized financial insights.

**Sign up free** to get real answers based on your actual financial data.

*Not a licensed financial advisor.*`

// ── Suggested prompts ─────────────────────────────────────────────────────

const PUBLIC_PROMPTS = [
  { text: "Am I properly diversified?", icon: "🎯" },
  { text: "What's the best way to pay off debt?", icon: "💳" },
  { text: "How is NVDA doing today?", icon: "📈" },
  { text: "Show me a sample portfolio analysis", icon: "📊" },
]

const DASHBOARD_PROMPTS = [
  { text: "How many holdings do I have?", icon: "📋" },
  { text: "Am I properly diversified?", icon: "🎯" },
  { text: "Show my sector allocation", icon: "📊" },
  { text: "How is my portfolio doing vs S&P 500?", icon: "📈" },
  { text: "What's the best strategy for my debt?", icon: "💳" },
  { text: "How is NVDA doing today?", icon: "🔍" },
]

// ── Core chat UI — shared by both exports ─────────────────────────────────

function ChatButtonCore({
  portfolioCtx,
  autoOpen = false,
}: {
  portfolioCtx: any
  autoOpen?: boolean
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewDismissed, setPreviewDismissed] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Show HubSpot-style preview bubble after 4 seconds (landing page only)
  useEffect(() => {
    if (autoOpen && !isChatOpen && !previewDismissed) {
      const timer = setTimeout(() => {
        setShowPreview(true)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [autoOpen, isChatOpen, previewDismissed])

  // Hide preview when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setShowPreview(false)
    }
  }, [isChatOpen])

  // Demo response handler (no API call)
  const handleDemoPrompt = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `demo-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    const responseText = DEMO_RESPONSES[text] || DEFAULT_DEMO_RESPONSE

    const assistantMsg: ChatMessage = {
      id: `demo-assistant-${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
  }, [])

  // Real message sender (calls API)
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

  const handleSend = () => {
    if (!portfolioCtx) {
      handleDemoPrompt(input)
      setInput('')
    } else {
      sendMessage(input)
    }
  }

  if (!isVisible) return null

  const hasMessages = messages.length > 0
  const isPublic = !portfolioCtx
  const prompts = isPublic ? PUBLIC_PROMPTS : DASHBOARD_PROMPTS

  return (
    <>
      {/* ── Chat Sheet Panel ──────────────────────────────────────────── */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent
          side="right"
          className="w-[380px] sm:max-w-[380px] p-0 flex flex-col gap-0 bg-background/95 backdrop-blur-xl"
        >
          <SheetHeader className="p-3 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg overflow-hidden">
                  <Image
                    src="/icon.png"
                    alt="WealthClaude"
                    width={28}
                    height={28}
                    className="h-full w-full object-cover"
                  />
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
              <div className="flex items-center gap-1">
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
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close chat"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3">
            {!hasMessages && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 px-1">
                <div className="h-12 w-12 rounded-xl overflow-hidden">
                  <Image
                    src="/icon.png"
                    alt="WealthClaude"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {isPublic ? "Hi! I'm WealthClaude AI" : "How can I help?"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic
                      ? "Your personal financial assistant. Try asking me:"
                      : "Ask about your portfolio, goals, or market trends"}
                  </p>
                </div>
                <div className="w-full space-y-2">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt.text}
                      onClick={() =>
                        isPublic
                          ? handleDemoPrompt(prompt.text)
                          : sendMessage(prompt.text)
                      }
                      className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-green-500/30 transition-all group"
                    >
                      <span className="text-base">{prompt.icon}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {prompt.text}
                      </span>
                    </button>
                  ))}
                </div>
                {isPublic && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    Sign up free to get personalized insights from your real portfolio
                  </p>
                )}
              </div>
            ) : (
              <>
                <ChatMessageList messages={messages} isLoading={isLoading} />

                {isPublic && messages.length > 1 && (
                  <div className="my-3 p-3 rounded-xl bg-green-600/10 border border-green-500/20 text-center space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      Want personalized insights from <strong>your real portfolio</strong>?
                    </p>
                    <a
                      href="/auth"
                      className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg px-4 py-2 transition-colors"
                    >
                      Sign Up Free — No Card Needed
                    </a>
                  </div>
                )}

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
                placeholder={isPublic ? "Try asking a question..." : "Ask anything..."}
                disabled={isLoading}
                className="flex-1 h-9 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-muted disabled:text-muted-foreground text-white flex items-center justify-center transition-all duration-200 shrink-0"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Floating chat button + HubSpot-style preview bubble ───────── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

        {/* Preview bubble — appears above the icon like HubSpot */}
        {showPreview && !isChatOpen && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 max-w-[300px]">
            <div className="relative bg-background border border-border/60 rounded-2xl shadow-2xl shadow-black/20 p-4">
              {/* Close X */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPreview(false)
                  setPreviewDismissed(true)
                }}
                className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Icon + message */}
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowPreview(false)
                  setIsChatOpen(true)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-green-500/20">
                    <Image
                      src="/icon.png"
                      alt="WealthClaude"
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      👋 Want to know if your stocks are properly diversified?
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      I can analyze your portfolio, track debt payoff, and answer market questions — try me!
                    </p>
                  </div>
                </div>

                {/* Quick action pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[
                    { label: "Am I diversified?", prompt: "Am I properly diversified?" },
                    { label: "Debt strategy", prompt: "What's the best way to pay off debt?" },
                    { label: "NVDA today", prompt: "How is NVDA doing today?" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowPreview(false)
                        setIsChatOpen(true)
                        setTimeout(() => {
                          handleDemoPrompt(item.prompt)
                        }, 300)
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-green-600/10 text-green-500 hover:bg-green-600/20 border border-green-500/20 transition-colors font-medium"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Triangle pointer towards the chat icon */}
              <div className="absolute -bottom-2 right-7 w-4 h-4 bg-background border-r border-b border-border/60 transform rotate-45" />
            </div>
          </div>
        )}

        {/* Chat icon button — LARGER with custom icon */}
        <div className="flex items-center gap-2">
          {!isChatOpen && !showPreview && (
            <button
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              aria-label="Dismiss chat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              setShowPreview(false)
              setIsChatOpen(true)
            }}
            className="group relative h-14 w-14 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center"
            aria-label="Open AI chat"
          >
            {!isChatOpen && !showPreview && (
              <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping [animation-duration:3s]" />
            )}
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <Image
                src="/icon.png"
                alt="WealthClaude"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
          </button>
        </div>
      </div>
    </>
  )
}

// ── Dashboard version — reads PortfolioContext ─────────────────────────────

export function AIChatButton({ autoOpen = false }: { autoOpen?: boolean }) {
  const ctx = usePortfolioSafe()
  return <ChatButtonCore portfolioCtx={ctx} autoOpen={autoOpen} />
}

// ── Public version — no portfolio data ────────────────────────────────────

export function AIChatButtonPublic({ autoOpen = false }: { autoOpen?: boolean }) {
  return <ChatButtonCore portfolioCtx={null} autoOpen={autoOpen} />
}
