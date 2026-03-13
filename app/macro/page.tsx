import { MacroMapWrapper } from "@/components/MacroMapWrapper"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Macro Map — WealthClaude",
  description: "Interactive world map showing inflation, GDP, unemployment and government debt for 180+ countries. Powered by World Bank Open Data.",
}

export default function MacroPage() {
  return (
    // pt-16 = 64px — pushes content below the fixed header
    <main className="pt-16 bg-background overflow-hidden" style={{ height: "100dvh" }}>
      <MacroMapWrapper />
    </main>
  )
}
