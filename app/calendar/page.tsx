import { Header } from "@/components/header"
import { CalendarWrapper } from "@/components/CalendarWrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Economic Calendar — WealthClaude",
  description: "Live economic events, earnings reports, and IPO calendar. Powered by Finnhub.",
}

export default function CalendarPage() {
  return (
    <>
      <Header />
      <main className="pt-16 bg-background overflow-hidden" style={{ height: "100dvh" }}>
        <CalendarWrapper />
      </main>
    </>
  )
}
