'use client'

import ReactMarkdown from 'react-markdown'
import { Sparkles, User } from 'lucide-react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-green-600/15 flex items-center justify-center shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-green-500" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted/50 border border-border/30 px-3.5 py-2.5">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500/70 animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-500/70 animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-500/70 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-2.5 justify-end">
      <div className="rounded-2xl rounded-tr-sm bg-green-600 text-white px-3.5 py-2 max-w-[85%]">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-green-600/15 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-green-500" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted/50 border border-border/30 px-3.5 py-2.5 max-w-[85%]">
        <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none
          prose-p:my-1.5
          prose-ul:my-1.5 prose-ol:my-1.5
          prose-li:my-0.5
          prose-strong:text-foreground prose-strong:font-semibold
          prose-code:text-green-400 prose-code:bg-green-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
          prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
          prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline
        ">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

interface ChatMessageListProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  if (messages.length === 0 && !isLoading) return null

  return (
    <div className="space-y-4">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserBubble key={msg.id} content={msg.content} />
        ) : (
          <AssistantBubble key={msg.id} content={msg.content} />
        )
      )}
      {isLoading && <TypingIndicator />}
    </div>
  )
}
