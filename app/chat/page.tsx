"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Sparkles,
  Send,
  MessageSquare,
  PiggyBank,
  Target,
  CreditCard,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const SUGGESTED_PROMPTS = [
  {
    icon: PiggyBank,
    label: "Am I diversified?",
    description: "Check portfolio concentration",
  },
  {
    icon: Target,
    label: "How are my goals?",
    description: "Review financial goal progress",
  },
  {
    icon: CreditCard,
    label: "Which debt first?",
    description: "Snowball vs avalanche strategy",
  },
  {
    icon: TrendingUp,
    label: "Portfolio vs market",
    description: "Compare your returns to S&P 500",
  },
]

export default function ChatPage() {
  const router = useRouter()
  const [input, setInput] = useState("")

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">WealthClaude AI</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Your financial assistant
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            // Will clear messages when wired in Step 4
          }}
        >
          New chat
        </Button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-full">
          {/* Welcome State */}
          <div className="text-center space-y-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                How can I help you today?
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Ask me about your portfolio, financial goals, debts, or
                what&apos;s happening in the market.
              </p>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => setInput(prompt.label)}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-emerald-600/10 flex items-center justify-center shrink-0 transition-colors">
                  <prompt.icon className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium">{prompt.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {prompt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) {
                    // Will send message when wired in Step 5
                    e.preventDefault()
                  }
                }}
                placeholder="Ask anything about your finances..."
                className="w-full h-10 rounded-xl border border-border/50 bg-muted/30 px-4 pr-10 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
            <button
              disabled={!input.trim()}
              className="h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-muted disabled:text-muted-foreground text-white flex items-center justify-center transition-all duration-200 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            WealthClaude AI is not a licensed financial advisor. Always consult a
            professional for major financial decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
