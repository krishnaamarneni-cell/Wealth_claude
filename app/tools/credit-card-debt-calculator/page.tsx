"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// ── Types ──────────────────────────────────────────────────
interface Card {
  id: number
  name: string
  balance: number
  apr: number
  minPayment: number
}

type Strategy = "snowball" | "avalanche" | "custom"

interface PayoffResult {
  strategy: Strategy
  label: string
  extraPayment: number
  months: number
  totalInterest: number
  totalCost: number
  schedule: MonthRow[]
}

interface MonthRow {
  month: number
  balance: number
  payment: number
  interest: number
  principal: number
}

// ── Helpers ────────────────────────────────────────────────
function fmtUSD(n: number): string {
  return "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtK(n: number): string {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M"
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K"
  return fmtUSD(n)
}
function fmtMo(n: number): string {
  const yrs = Math.floor(n / 12)
  const mo = n % 12
  if (yrs === 0) return `${mo}mo`
  if (mo === 0) return `${yrs}yr`
  return `${yrs}yr ${mo}mo`
}

// Simulate payoff for a single merged debt pool (simplified multi-card simulation)
function simulatePayoff(cards: Card[], strategy: Strategy, extra: number): PayoffResult {
  if (cards.length === 0) return { strategy, label: "", extraPayment: extra, months: 0, totalInterest: 0, totalCost: 0, schedule: [] }

  // Clone cards and sort by strategy
  let pool = cards.map(c => ({ ...c }))
  if (strategy === "snowball") pool.sort((a, b) => a.balance - b.balance)
  if (strategy === "avalanche") pool.sort((a, b) => b.apr - a.apr)

  const totalMin = pool.reduce((s, c) => s + c.minPayment, 0)
  let budget = totalMin + extra
  let month = 0
  let totalInterest = 0
  const schedule: MonthRow[] = []
  const MAX_MONTHS = 600

  while (pool.some(c => c.balance > 0.01) && month < MAX_MONTHS) {
    month++
    let remaining = budget
    let monthInterest = 0
    let monthPrincipal = 0
    let monthPayment = 0

    // Accrue interest on all cards first
    for (const c of pool) {
      if (c.balance <= 0) continue
      const interest = (c.apr / 100 / 12) * c.balance
      c.balance += interest
      monthInterest += interest
    }

    // Pay minimums on all cards
    for (const c of pool) {
      if (c.balance <= 0) continue
      const pay = Math.min(c.minPayment, c.balance)
      c.balance -= pay
      remaining -= pay
      monthPayment += pay
    }

    // Dump extra onto focus card (first with balance)
    for (const c of pool) {
      if (c.balance <= 0 || remaining <= 0) continue
      const pay = Math.min(remaining, c.balance)
      c.balance -= pay
      remaining -= pay
      monthPayment += pay
    }

    // Freed min payments from paid cards roll into budget
    const freedMin = pool.filter(c => c.balance <= 0.01).reduce((s, c) => s + c.minPayment, 0)
    budget = totalMin + extra + freedMin > budget ? totalMin + extra : budget

    totalInterest += monthInterest
    monthPrincipal = monthPayment - monthInterest
    const totalBal = pool.reduce((s, c) => s + Math.max(0, c.balance), 0)

    schedule.push({ month, balance: totalBal, payment: monthPayment, interest: monthInterest, principal: monthPrincipal })
  }

  const label = strategy === "snowball" ? "Snowball" : strategy === "avalanche" ? "Avalanche" : "Custom"
  const totalDebt = cards.reduce((s, c) => s + c.balance, 0)

  return { strategy, label, extraPayment: extra, months: month, totalInterest, totalCost: totalDebt + totalInterest, schedule }
}

// ── SVG Pie Chart ──────────────────────────────────────────
const PIE_COLORS = ["#4ade80", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#34d399", "#fb923c", "#e879f9", "#38bdf8", "#a3e635"]

interface PieSlice { name: string; value: number; pct: number; color: string; start: number; end: number }

function PieChart({ cards, highlighted, onHighlight }: {
  cards: Card[]
  highlighted: number | null
  onHighlight: (id: number | null) => void
}) {
  const total = cards.reduce((s, c) => s + c.balance, 0)
  if (total === 0 || cards.length === 0) return (
    <div className="w-full h-64 flex items-center justify-center text-muted-foreground text-sm">
      Add cards to see chart
    </div>
  )

  const slices: PieSlice[] = []
  let angle = -Math.PI / 2
  cards.forEach((c, i) => {
    const pct = c.balance / total
    const sweep = pct * 2 * Math.PI
    slices.push({ name: c.name, value: c.balance, pct: pct * 100, color: PIE_COLORS[i % PIE_COLORS.length], start: angle, end: angle + sweep })
    angle += sweep
  })

  const cx = 130, cy = 130, r = 100, ir = 55

  function arc(s: PieSlice, expand = false): string {
    const offset = expand ? 8 : 0
    const midAngle = (s.start + s.end) / 2
    const ox = offset * Math.cos(midAngle)
    const oy = offset * Math.sin(midAngle)
    const x1 = cx + ox + r * Math.cos(s.start)
    const y1 = cy + oy + r * Math.sin(s.start)
    const x2 = cx + ox + r * Math.cos(s.end)
    const y2 = cy + oy + r * Math.sin(s.end)
    const ix1 = cx + ox + ir * Math.cos(s.end)
    const iy1 = cy + oy + ir * Math.sin(s.end)
    const ix2 = cx + ox + ir * Math.cos(s.start)
    const iy2 = cy + oy + ir * Math.sin(s.start)
    const large = s.end - s.start > Math.PI ? 1 : 0
    return `M${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} L${ix1},${iy1} A${ir},${ir},0,${large},0,${ix2},${iy2} Z`
  }

  const hovered = highlighted !== null ? cards.find(c => c.id === highlighted) : null
  const hovSlice = hovered ? slices[cards.indexOf(hovered)] : null

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <svg width="260" height="260" viewBox="0 0 260 260">
          {slices.map((s, i) => {
            const cardId = cards[i].id
            const isHov = highlighted === cardId
            return (
              <path
                key={i}
                d={arc(s, isHov)}
                fill={s.color}
                fillOpacity={highlighted !== null && !isHov ? 0.35 : 1}
                stroke="#0f1117"
                strokeWidth={2}
                style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                onMouseEnter={() => onHighlight(cardId)}
                onMouseLeave={() => onHighlight(null)}
                onClick={() => onHighlight(highlighted === cardId ? null : cardId)}
              />
            )
          })}
          {/* Center text */}
          <text x={cx} y={cy - 10} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="inherit">
            {hovSlice ? hovSlice.name.slice(0, 14) : "Total Debt"}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill={hovSlice ? hovSlice.color : "#4ade80"} fontSize="15" fontWeight="700" fontFamily="inherit">
            {hovSlice ? fmtK(hovSlice.value) : fmtK(total)}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="inherit">
            {hovSlice ? hovSlice.pct.toFixed(1) + "%" : cards.length + " cards"}
          </text>
        </svg>
      </div>
      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {slices.map((s, i) => (
          <div key={i}
            className="flex items-center gap-2 cursor-pointer group"
            onMouseEnter={() => onHighlight(cards[i].id)}
            onMouseLeave={() => onHighlight(null)}
            onClick={() => onHighlight(highlighted === cards[i].id ? null : cards[i].id)}
          >
            <span className="w-3 h-3 rounded-sm shrink-0 transition-transform group-hover:scale-125" style={{ background: s.color }} />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex-1 truncate">{s.name || `Card ${i + 1}`}</span>
            <span className="text-xs font-semibold text-foreground">{s.pct.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground">{fmtK(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CSV Parser ─────────────────────────────────────────────
function parseCSV(text: string): Card[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""))
  const ci = (name: string) => headers.findIndex(h => h.includes(name))
  const nameIdx = ci("name"), balIdx = ci("balance"), aprIdx = ci("apr"), minIdx = ci("min")
  if (balIdx === -1) return []
  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ""))
    return {
      id: Date.now() + i,
      name: nameIdx !== -1 ? cols[nameIdx] || `Card ${i + 1}` : `Card ${i + 1}`,
      balance: parseFloat(cols[balIdx]) || 0,
      apr: aprIdx !== -1 ? parseFloat(cols[aprIdx]) || 0 : 0,
      minPayment: minIdx !== -1 ? parseFloat(cols[minIdx]) || 0 : 0,
    }
  }).filter(c => c.balance > 0)
}

// ── Main Page ──────────────────────────────────────────────
export default function CreditCardDebtCalculatorPage() {
  const [tab, setTab] = useState<"manual" | "csv">("manual")
  const [cards, setCards] = useState<Card[]>([
    { id: 1, name: "Visa Platinum", balance: 3200, apr: 22.99, minPayment: 96 },
    { id: 2, name: "Mastercard", balance: 1850, apr: 19.99, minPayment: 55 },
    { id: 3, name: "Discover", balance: 4600, apr: 17.49, minPayment: 138 },
  ])
  const [newCard, setNewCard] = useState<Omit<Card, "id">>({ name: "", balance: 0, apr: 0, minPayment: 0 })
  const [strategy, setStrategy] = useState<Strategy>("avalanche")
  const [extra, setExtra] = useState(200)
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [payoffs, setPayoffs] = useState<PayoffResult[]>([])
  const [nextId, setNextId] = useState(4)
  const [dragging, setDragging] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvPreview, setCsvPreview] = useState<Card[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Persist to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wealthclaude_cc_cards")
      if (saved) setCards(JSON.parse(saved))
    } catch { }
  }, [])
  useEffect(() => {
    try { localStorage.setItem("wealthclaude_cc_cards", JSON.stringify(cards)) } catch { }
  }, [cards])

  // Compute payoffs whenever cards/extra change
  useEffect(() => {
    if (cards.length === 0) { setPayoffs([]); return }
    const results: PayoffResult[] = [
      simulatePayoff(cards, "snowball", extra),
      simulatePayoff(cards, "avalanche", extra),
      simulatePayoff(cards, "custom", extra),
    ]
    setPayoffs(results)
  }, [cards, extra])

  // Derived stats
  const totalDebt = cards.reduce((s, c) => s + c.balance, 0)
  const totalMin = cards.reduce((s, c) => s + c.minPayment, 0)
  const monthlyInt = cards.reduce((s, c) => s + (c.apr / 100 / 12) * c.balance, 0)
  const avgAPR = cards.length > 0
    ? cards.reduce((s, c) => s + c.apr * c.balance, 0) / (totalDebt || 1)
    : 0

  // Add card
  function addCard() {
    if (newCard.balance <= 0) return
    setCards(prev => [...prev, { ...newCard, id: nextId, name: newCard.name || `Card ${nextId}` }])
    setNextId(n => n + 1)
    setNewCard({ name: "", balance: 0, apr: 0, minPayment: 0 })
  }

  function removeCard(id: number) {
    setCards(prev => prev.filter(c => c.id !== id))
  }

  function updateCard(id: number, field: keyof Omit<Card, "id">, value: string | number) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  // CSV handling
  function handleCSVFile(file: File) {
    setCsvError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) { setCsvError("No valid data found. Check format: card_name, balance, apr, min_payment"); return }
      setCsvPreview(parsed)
    }
    reader.readAsText(file)
  }

  function applyCSV() {
    if (csvPreview.length === 0) return
    setCards(csvPreview.map((c, i) => ({ ...c, id: Date.now() + i })))
    setTab("manual")
    setCsvPreview([])
  }

  const inputCls = "bg-[#0f1117] border border-white/10 rounded-xl py-2.5 text-sm text-white outline-none focus:border-primary/60 transition-colors px-3 w-full placeholder-white/25"

  const selected = payoffs.find(p => p.strategy === strategy)
  const avalanche = payoffs.find(p => p.strategy === "avalanche")
  const snowball = payoffs.find(p => p.strategy === "snowball")
  const savings = snowball && avalanche ? snowball.totalInterest - avalanche.totalInterest : 0

  const FAQS = [
    { q: "What's the fastest way to pay off credit card debt?", a: "The Avalanche method (paying highest APR first) minimizes total interest and is mathematically fastest. The Snowball method (smallest balance first) provides psychological wins and better adherence for some people. Adding any extra payment above minimums dramatically accelerates payoff." },
    { q: "How is monthly interest calculated?", a: "Monthly interest = (APR ÷ 12) × Current Balance. For a $3,000 balance at 22.99% APR: (0.2299 ÷ 12) × 3000 = $57.48/month. Most of your minimum payment goes to interest, not principal — which is why minimum-only payments take so long." },
    { q: "Should I pay off debt or invest?", a: "If your credit card APR (typically 17–25%) exceeds your expected investment return (historically ~10% for stocks), paying off debt first gives a guaranteed 'return' equal to the interest rate saved. Most financial advisors recommend clearing high-interest debt before investing in taxable accounts." },
    { q: "What is the debt avalanche method?", a: "List all debts by APR (highest first). Pay minimums on everything, then throw all extra money at the highest-rate card. Once paid off, roll that payment into the next highest. This minimizes total interest paid — saving hundreds or thousands versus minimum payments." },
    { q: "What is the debt snowball method?", a: "List debts by balance (smallest first). Pay minimums on everything, then attack the smallest balance. Each paid-off card provides motivation and frees up cash flow. Studies show people who use snowball are more likely to stay on track, even if they pay slightly more interest." },
  ]

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col text-white">
      <Header />

      <main className="pt-16 flex-1">

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-8 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
            Free Tool — No Account Required
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Credit Card Debt<br />
            <span className="text-primary">Calculator</span>
          </h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed">
            Upload your statements or enter manually. Get your full debt breakdown,
            true interest costs, and the fastest payoff strategies — free.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-5">

          {/* ── Input Tabs ── */}
          <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-white/8">
              {(["manual", "csv"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/40 hover:text-white/70"}`}>
                  {t === "manual" ? "✏️  Manual Entry" : "📄  CSV Upload"}
                </button>
              ))}
            </div>

            {tab === "manual" && (
              <div className="p-5 space-y-5">
                {/* Add card form */}
                <div className="rounded-xl border border-white/8 bg-[#0f1117] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Add a Card</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Card Name</label>
                      <input type="text" placeholder="e.g. Chase Sapphire" value={newCard.name}
                        onChange={e => setNewCard(p => ({ ...p, name: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Balance ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                        <input type="number" placeholder="2500" value={newCard.balance || ""}
                          onChange={e => setNewCard(p => ({ ...p, balance: +e.target.value || 0 }))}
                          className={inputCls + " pl-6"} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">APR (%)</label>
                      <div className="relative">
                        <input type="number" placeholder="19.99" value={newCard.apr || ""}
                          onChange={e => setNewCard(p => ({ ...p, apr: +e.target.value || 0 }))}
                          className={inputCls + " pr-8"} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">%</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Min Payment ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                        <input type="number" placeholder="75" value={newCard.minPayment || ""}
                          onChange={e => setNewCard(p => ({ ...p, minPayment: +e.target.value || 0 }))}
                          className={inputCls + " pl-6"} />
                      </div>
                    </div>
                  </div>
                  <button onClick={addCard}
                    className="mt-3 w-full rounded-xl bg-primary text-black font-bold py-2.5 text-sm hover:opacity-90 active:scale-[0.99] transition-all">
                    + Add Card
                  </button>
                </div>

                {/* Cards table */}
                {cards.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-white/8">
                    <table className="w-full text-xs">
                      <thead className="bg-white/3">
                        <tr>
                          {["Card", "Balance", "APR", "Min Payment", "Interest/Mo", ""].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cards.map((c, i) => (
                          <tr key={c.id}
                            className={`border-t border-white/5 transition-colors cursor-pointer ${highlighted === c.id ? "bg-primary/8" : "hover:bg-white/3"}`}
                            onMouseEnter={() => setHighlighted(c.id)}
                            onMouseLeave={() => setHighlighted(null)}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <input type="text" value={c.name}
                                  onChange={e => updateCard(c.id, "name", e.target.value)}
                                  className="bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-primary/40 transition-colors w-32" />
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="relative inline-flex items-center">
                                <span className="text-white/40 mr-1 text-xs">$</span>
                                <input type="number" value={c.balance}
                                  onChange={e => updateCard(c.id, "balance", +e.target.value || 0)}
                                  className="bg-transparent text-red-400 font-semibold outline-none border-b border-transparent focus:border-red-400/40 transition-colors w-20 tabular-nums" />
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="relative inline-flex items-center">
                                <input type="number" value={c.apr} step={0.01}
                                  onChange={e => updateCard(c.id, "apr", +e.target.value || 0)}
                                  className="bg-transparent text-amber-400 font-semibold outline-none border-b border-transparent focus:border-amber-400/40 transition-colors w-14 tabular-nums" />
                                <span className="text-white/40 ml-0.5 text-xs">%</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="relative inline-flex items-center">
                                <span className="text-white/40 mr-1 text-xs">$</span>
                                <input type="number" value={c.minPayment}
                                  onChange={e => updateCard(c.id, "minPayment", +e.target.value || 0)}
                                  className="bg-transparent text-white outline-none border-b border-transparent focus:border-primary/40 transition-colors w-16 tabular-nums" />
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-red-400 tabular-nums font-medium">
                              {fmtUSD((c.apr / 100 / 12) * c.balance)}
                            </td>
                            <td className="px-4 py-2.5">
                              <button onClick={() => removeCard(c.id)}
                                className="text-white/20 hover:text-red-400 transition-colors text-base leading-none">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === "csv" && (
              <div className="p-5 space-y-4">
                {/* Format hint */}
                <div className="rounded-xl border border-white/8 bg-[#0f1117] px-4 py-3 text-xs text-white/50 font-mono">
                  <div className="text-white/30 mb-1 text-[10px] uppercase tracking-widest">Expected CSV Format</div>
                  card_name,balance,apr,min_payment<br />
                  Visa Platinum,3200,22.99,96<br />
                  Mastercard,1850,19.99,55
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleCSVFile(f) }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl py-12 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5" : "border-white/15 hover:border-primary/40 hover:bg-white/2"}`}>
                  <div className="text-3xl mb-3">📄</div>
                  <div className="text-sm font-semibold text-white/70">Drop CSV here or click to upload</div>
                  <div className="text-xs text-white/30 mt-1">Supports .csv files</div>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVFile(f) }} />
                </div>

                {csvError && (
                  <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">⚠ {csvError}</div>
                )}

                {csvPreview.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs text-white/40 font-semibold uppercase tracking-widest">Preview — {csvPreview.length} cards found</div>
                    <div className="overflow-x-auto rounded-xl border border-white/8">
                      <table className="w-full text-xs">
                        <thead className="bg-white/3">
                          <tr>
                            {["Card", "Balance", "APR", "Min Payment"].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((c, i) => (
                            <tr key={i} className="border-t border-white/5">
                              <td className="px-4 py-2.5 text-white font-medium">{c.name}</td>
                              <td className="px-4 py-2.5 text-red-400 tabular-nums">{fmtUSD(c.balance)}</td>
                              <td className="px-4 py-2.5 text-amber-400">{c.apr}%</td>
                              <td className="px-4 py-2.5 text-white/70">{fmtUSD(c.minPayment)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={applyCSV}
                      className="w-full rounded-xl bg-primary text-black font-bold py-3 text-sm hover:opacity-90 transition-all">
                      ✓ Use These Cards
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Results (only show if cards exist) ── */}
          {cards.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Debt", value: fmtK(totalDebt), sub: `${cards.length} card${cards.length > 1 ? "s" : ""}`, accent: "text-red-400" },
                  { label: "Avg APR", value: avgAPR.toFixed(2) + "%", sub: "weighted average", accent: "text-amber-400" },
                  { label: "Monthly Interest", value: fmtK(monthlyInt), sub: "you pay in interest", accent: "text-red-400" },
                  { label: "Yearly Interest", value: fmtK(monthlyInt * 12), sub: "annual interest cost", accent: "text-red-400" },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-white/8 bg-[#111318] px-5 py-4">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">{s.label}</div>
                    <div className={`text-xl font-extrabold tracking-tight ${s.accent}`}>{s.value}</div>
                    <div className="text-[10px] text-white/30 mt-1">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Pie Chart */}
              <div className="rounded-2xl border border-white/8 bg-[#111318] p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Balance Distribution</div>
                <PieChart cards={cards} highlighted={highlighted} onHighlight={setHighlighted} />
              </div>

              {/* Payoff Strategies */}
              <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8">
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Payoff Strategy</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { key: "snowball", icon: "❄️", label: "Snowball", desc: "Smallest balance first. Psychological wins." },
                      { key: "avalanche", icon: "🏔️", label: "Avalanche", desc: "Highest APR first. Saves most interest." },
                      { key: "custom", icon: "⚙️", label: "Custom", desc: "Set your own extra payment amount." },
                    ] as const).map(s => (
                      <button key={s.key} onClick={() => setStrategy(s.key)}
                        className={`text-left rounded-xl border p-4 transition-all ${strategy === s.key ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/20 bg-white/2"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span>{s.icon}</span>
                          <span className={`text-sm font-bold ${strategy === s.key ? "text-primary" : "text-white"}`}>{s.label}</span>
                          {strategy === s.key && <span className="ml-auto text-primary text-xs">✓ Selected</span>}
                        </div>
                        <div className="text-xs text-white/40">{s.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Extra payment slider */}
                  <div className="mt-4 flex items-center gap-4">
                    <label className="text-xs font-semibold text-white/50 whitespace-nowrap">Extra Payment / mo:</label>
                    <input type="range" min={0} max={2000} step={25} value={extra}
                      onChange={e => setExtra(+e.target.value)}
                      className="flex-1 accent-primary h-2 rounded-full" />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                      <input type="number" value={extra} min={0}
                        onChange={e => setExtra(+e.target.value || 0)}
                        className="bg-[#0f1117] border border-white/10 rounded-lg py-2 pl-6 pr-3 text-sm text-primary font-bold outline-none focus:border-primary/50 w-full" />
                    </div>
                  </div>
                </div>

                {/* Strategies comparison table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/2">
                      <tr>
                        {["Strategy", "Extra/mo", "Payoff Time", "Total Interest", "Total Cost", "Savings vs Snowball"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payoffs.map(p => {
                        const isSel = p.strategy === strategy
                        const saved = snowball ? snowball.totalInterest - p.totalInterest : 0
                        return (
                          <tr key={p.strategy}
                            onClick={() => setStrategy(p.strategy)}
                            className={`border-t border-white/5 cursor-pointer transition-colors ${isSel ? "bg-primary/8" : "hover:bg-white/2"}`}>
                            <td className="px-4 py-3">
                              <span className={`font-bold ${isSel ? "text-primary" : "text-white"}`}>
                                {p.strategy === "snowball" ? "❄️ Snowball" : p.strategy === "avalanche" ? "🏔️ Avalanche" : "⚙️ Custom"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white/60">{fmtUSD(p.extraPayment)}</td>
                            <td className={`px-4 py-3 font-semibold ${isSel ? "text-primary" : "text-white"}`}>{fmtMo(p.months)}</td>
                            <td className="px-4 py-3 text-red-400 tabular-nums">{fmtUSD(p.totalInterest)}</td>
                            <td className="px-4 py-3 text-white tabular-nums">{fmtUSD(p.totalCost)}</td>
                            <td className={`px-4 py-3 font-semibold tabular-nums ${saved > 0 ? "text-primary" : saved < 0 ? "text-red-400" : "text-white/40"}`}>
                              {saved === 0 ? "—" : (saved > 0 ? "save " : "cost ") + fmtUSD(Math.abs(saved))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Plan */}
              {selected && (
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                    Your Action Plan
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-4">
                    Pay{" "}
                    <span className="text-primary">{fmtUSD(extra)}</span>
                    {" "}extra/month using the{" "}
                    <span className="text-primary capitalize">{selected.label}</span>
                    {" "}strategy →{" "}
                    <span className="text-primary">debt free in {fmtMo(selected.months)}</span>
                    {savings > 0 && selected.strategy === "avalanche" && (
                      <>, saving{" "}<span className="text-primary">{fmtUSD(savings)}</span>{" "}vs snowball</>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Payoff Date", value: (() => { const d = new Date(); d.setMonth(d.getMonth() + selected.months); return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) })(), accent: "text-primary" },
                      { label: "Total Interest", value: fmtUSD(selected.totalInterest), accent: "text-red-400" },
                      { label: "Total Cost", value: fmtUSD(selected.totalCost), accent: "text-white" },
                      { label: "Monthly Payment", value: fmtUSD(totalMin + extra), accent: "text-primary" },
                    ].map((s, i) => (
                      <div key={i}>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{s.label}</div>
                        <div className={`text-lg font-bold ${s.accent}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Month-by-month progress bar visualization */}
                  <div className="mt-5">
                    <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2">Payoff Progress — Balance Over Time</div>
                    <div className="flex items-end gap-0.5 h-12">
                      {selected.schedule.filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 40)) === 0 || i === arr.length - 1).map((row, i, arr) => {
                        const pct = totalDebt > 0 ? (row.balance / totalDebt) : 0
                        return (
                          <div key={i} className="flex-1 rounded-t transition-all"
                            style={{ height: `${Math.max(2, pct * 100)}%`, background: `hsl(${142 - pct * 142}, 70%, 55%)` }} />
                        )
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-white/30 mt-1">
                      <span>Today</span>
                      <span>Debt Free 🎉</span>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ */}
              <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8">
                  <div className="text-sm font-bold text-white">Frequently Asked Questions</div>
                </div>
                <div className="p-4 space-y-2">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="rounded-xl border border-white/8 overflow-hidden">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white hover:text-primary transition-colors">
                        {faq.q}
                        <span className={`text-white/40 text-lg shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45 text-primary" : ""}`}>+</span>
                      </button>
                      {openFaq === i && (
                        <div className="px-5 pb-4 text-sm text-white/50 leading-relaxed">{faq.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-white/30">
              <div className="text-4xl mb-3">💳</div>
              <div className="text-sm font-semibold">Add your first card above to see your debt breakdown</div>
            </div>
          )}

          {/* Careers link */}
          <div className="text-center pt-4">
            <Link href="/careers" className="text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-2">
              Join the WealthClaude team → Careers
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
