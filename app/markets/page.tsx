import { Header } from "@/components/header"
import { MarketsWrapper } from "@/components/MarketsWrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Markets Performance — WealthClaude",
  description: "Live global indices, sector performance, and asset class data for 51 countries. 1Y, 3Y, 5Y returns powered by Yahoo Finance.",
}

export default function MarketsPage() {
  return (
    <>
      <Header />
      <main className="pt-16 bg-[#060a10]">
        <MarketsWrapper />
      </main>
    </>
  )
}
