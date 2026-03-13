import { MacroMapWrapper } from "@/components/MacroMapWrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Macro Map — WealthClaude",
  description: "Interactive world map showing inflation, GDP growth, unemployment, and government debt data for 190+ countries. Powered by World Bank Open Data.",
}

export default function MacroPage() {
  return (
    <main className="pt-16 bg-background min-h-screen">
      <MacroMapWrapper />
    </main>
  )
}
