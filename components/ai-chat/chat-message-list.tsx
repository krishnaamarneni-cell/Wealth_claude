'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles, User } from 'lucide-react'
import type { Components } from 'react-markdown'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ── Custom Markdown Components for proper table rendering ────────────────

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border/50">
      <table className="w-full text-xs border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-green-600/10 border-b border-border/50">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border/30">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-green-400 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">
      {children}
    </td>
  ),
  h1: ({ children }) => (
    <h3 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="text-sm font-bold text-foreground mt-3 mb-1.5">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="text-xs font-semibold text-foreground mt-2.5 mb-1">{children}</h4>
  ),
  ul: ({ children }) => (
    <ul className="my-1.5 ml-4 space-y-0.5 list-disc marker:text-green-500/70">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1.5 ml-4 space-y-0.5 list-decimal marker:text-green-500/70">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-muted-foreground italic">{children}</em>
  ),
  code: ({ children }) => (
    <code className="text-green-400 bg-green-500/10 px-1 py-0.5 rounded text-xs">
      {children}
    </code>
  ),
  p: ({ children }) => (
    <p className="my-1.5 leading-relaxed">{children}</p>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-green-400 hover:underline">
      {children}
    </a>
  ),
  hr: () => (
    <hr className="my-2 border-border/30" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-green-500/50 pl-3 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
}

// ── Components ───────────────────────────────────────────────────────────

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
        <div className="text-sm leading-relaxed max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
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
