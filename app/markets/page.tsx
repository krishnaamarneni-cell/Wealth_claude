import { MarketsWrapper } from "@/components/MarketsWrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Markets Performance — WealthClaude",
  description: "Live global indices, sector performance, and asset class data. Powered by Yahoo Finance.",
}

export default function MarketsPage() {
  return (
    <main className="pt-16 bg-background overflow-hidden" style={{ height: "100dvh" }}>
      <MarketsWrapper />
    </main>
  )
}
