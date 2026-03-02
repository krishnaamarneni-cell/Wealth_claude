"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface Card {
  id: number
  name: string
  balance: number
  apr: number
  minPayment: number
}

type SpendingType = "impulsive" | "subscription" | "medical" | "lifestyle" | "education" | "home" | "mixed"

const SPENDING_TYPES: Record<SpendingType, { label: string; icon: string; color: string; tip: string; strategy: string }> = {
  impulsive: { label: "Impulsive Shopping", icon: "🛍️", color: "text-pink-400", tip: "Freeze or cut up this card. Delete saved card details from shopping apps. Use cash envelopes for discretionary spending.", strategy: "Pay off this card first — stopping new charges here gives the fastest relief." },
  subscription: { label: "Subscription Overload", icon: "📦", color: "text-purple-400", tip: "Audit all recurring charges this week. Cancel anything unused. One subscription audit typically saves $50-150/month.", strategy: "Roll those cancelled subscription dollars directly into your extra monthly payment." },
  medical: { label: "Medical / Emergency", icon: "🏥", color: "text-blue-400", tip: "Contact the provider about a 0% payment plan — hospitals often offer these. Explore hardship programs or medical credit cards.", strategy: "Avalanche is best here since emergency debt tends to land on the highest APR cards." },
  lifestyle: { label: "Lifestyle Inflation", icon: "✈️", color: "text-amber-400", tip: "Track every purchase for 2 weeks. Identify your top 3 lifestyle categories and set a hard monthly cap for each.", strategy: "Any month you come in under your lifestyle budget, put the surplus directly toward your balance." },
  education: { label: "Education / Career", icon: "🎓", color: "text-cyan-400", tip: "Check if your employer offers tuition reimbursement. Consider income-share alternatives for future education costs.", strategy: "This is 'good debt' with a future ROI — but still prioritize paying it down to free up monthly cash flow." },
  home: { label: "Home & Family", icon: "🏠", color: "text-orange-400", tip: "Separate recurring home costs from one-off emergencies. Build a $1,000 home repair buffer to avoid future card charges.", strategy: "Snowball works well here — clearing smaller home-related balances fast creates breathing room." },
  mixed: { label: "Mixed / Unknown", icon: "📊", color: "text-white/60", tip: "Pull your last 3 statements and categorize each charge. You likely have one dominant category that can be targeted.", strategy: "Avalanche is the safest default when spending patterns are unclear." },
}

function detectSpendingType(cardName: string): SpendingType {
  const n = cardName.toLowerCase()
  if (/amazon|shop|target|walmart|zara|h&m|fashion|retail|ebay|etsy|wish|shein/.test(n)) return "impulsive"
  if (/netflix|spotify|hulu|disney|apple|google|subscription|prime|adobe|gym|fitness/.test(n)) return "subscription"
  if (/medical|health|hospital|doctor|pharmacy|dental|cvs|walgreen|care/.test(n)) return "medical"
  if (/travel|airline|hotel|uber|lyft|doordash|grubhub|dining|restaurant|delta|marriott/.test(n)) return "lifestyle"
  if (/student|education|tuition|course|udemy|coursera|school|college|book/.test(n)) return "education"
  if (/home|depot|lowes|ikea|furniture|family|kids|baby|repair/.test(n)) return "home"
  return "mixed"
}

type Strategy = "snowball" | "avalanche" | "custom"

interface PayoffResult {
  strategy: Strategy
  months: number
  totalInterest: number
  totalCost: number
  schedule: { month: number; balance: number; payment: number; interest: number }[]
}

// ─────────────────────────────────────────────────────────────
// REGEX STATEMENT PARSER  (pdf.js / mammoth / SheetJS text → card)
// ─────────────────────────────────────────────────────────────
function extractFromText(text: string, fileName: string): Card[] {
  const balancePatterns = [
    /new\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /current\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /statement\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /total\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /ending\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /closing\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /balance\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /outstanding\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
  ]
  const aprPatterns = [
    /purchases?\s+([\d.]+)%/i,
    /purchase\s+apr[:\s]+([\d.]+)%/i,
    /purchase\s+rate[:\s]+([\d.]+)%/i,
    /annual\s+percentage\s+rate.*?purchases.*?([\d.]+)%/is,
    /variable\s+apr[:\s]+([\d.]+)%/i,
    /([\d.]+)%\s*\(v\)/i,
    /([\d.]+)%\s*variable/i,
    /interest\s+rate[:\s]+([\d.]+)%/i,
    /apr[:\s]+([\d.]+)%/i,
  ]
  const minPatterns = [
    /minimum\s+payment\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /minimum\s+payment[:\s]+\$?([\d,]+\.?\d*)/i,
    /min(?:imum)?\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /required\s+payment[:\s]+\$?([\d,]+\.?\d*)/i,
    /amount\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /payment\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
  ]
  const cardNamePatterns = [
    /\b(chase\s+freedom\s+unlimited)\b/i,
    /\b(chase\s+freedom\s+flex)\b/i,
    /\b(chase\s+sapphire\s+(?:preferred|reserve))\b/i,
    /\b(chase\s+\w+(?:\s+\w+)?)\b/i,
    /\b(citi(?:bank)?\s+\w+(?:\s+\w+)?)\b/i,
    /\b(american\s+express\s+\w+(?:\s+\w+)?)\b/i,
    /\b(amex\s+\w+(?:\s+\w+)?)\b/i,
    /\b(capital\s+one\s+\w+(?:\s+\w+)?)\b/i,
    /\b(discover\s+(?:it|chrome|miles|more)?\s*\w*)\b/i,
    /\b(bank\s+of\s+america\s+\w+(?:\s+\w+)?)\b/i,
    /\b(wells\s+fargo\s+\w+(?:\s+\w+)?)\b/i,
    /xxxx\s+xxxx\s+xxxx\s+(\d{4})/i,
    /ending\s+in\s+(\d{4})/i,
  ]
  const tryP = (patterns: RegExp[], src: string) => {
    for (const p of patterns) { const m = src.match(p); if (m) return m[1].replace(/,/g, "").trim() }
    return null
  }
  const balance = parseFloat(tryP(balancePatterns, text) || "0")
  const apr = parseFloat(tryP(aprPatterns, text) || "0")
  const minPayment = parseFloat(tryP(minPatterns, text) || "0") || Math.max(25, balance * 0.02)
  if (balance <= 0) return []
  let cardName = tryP(cardNamePatterns, text)
  if (cardName && /^\d{4}$/.test(cardName)) {
    const issuer = /chase/i.test(text) ? "Chase" : /citi/i.test(text) ? "Citi" : /amex|american express/i.test(text) ? "Amex" : /discover/i.test(text) ? "Discover" : /capital one/i.test(text) ? "Capital One" : /bank of america/i.test(text) ? "Bank of America" : "Card"
    cardName = `${issuer} ····${cardName}`
  }
  if (!cardName || cardName.length < 3) {
    const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_\d]/g, " ").replace(/\s+/g, " ").trim()
    cardName = base.length > 2 ? base : "Imported Card"
  }
  cardName = cardName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ").slice(0, 40)
  return [{ id: Date.now(), name: cardName, balance, apr, minPayment }]
}

function parseCSV(text: string): Card[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""))
  const ci = (n: string) => headers.findIndex(h => h.includes(n))
  const nameIdx = ci("name"), balIdx = ci("balance"), aprIdx = ci("apr"), minIdx = ci("min")
  if (balIdx === -1) return []
  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ""))
    const balance = parseFloat(cols[balIdx]) || 0
    return { id: Date.now() + i, name: nameIdx !== -1 ? cols[nameIdx] || `Card ${i + 1}` : `Card ${i + 1}`, balance, apr: aprIdx !== -1 ? parseFloat(cols[aprIdx]) || 0 : 0, minPayment: minIdx !== -1 ? parseFloat(cols[minIdx]) || Math.max(25, balance * 0.02) : Math.max(25, balance * 0.02) }
  }).filter(c => c.balance > 0)
}

// ─────────────────────────────────────────────────────────────
// PAYOFF SIMULATOR
// ─────────────────────────────────────────────────────────────
function simulatePayoff(cards: Card[], strategy: Strategy, extra: number): PayoffResult {
  if (!cards.length) return { strategy, months: 0, totalInterest: 0, totalCost: 0, schedule: [] }
  let pool = cards.map(c => ({ ...c }))
  if (strategy === "snowball") pool.sort((a, b) => a.balance - b.balance)
  if (strategy === "avalanche") pool.sort((a, b) => b.apr - a.apr)
  const totalMin = pool.reduce((s, c) => s + c.minPayment, 0)
  let budget = totalMin + extra, month = 0, totalInterest = 0
  const schedule: PayoffResult["schedule"] = []
  while (pool.some(c => c.balance > 0.01) && month < 600) {
    month++
    let remaining = budget, mInt = 0, mPay = 0
    for (const c of pool) { if (c.balance <= 0) continue; const int = (c.apr / 100 / 12) * c.balance; c.balance += int; mInt += int }
    for (const c of pool) { if (c.balance <= 0) continue; const pay = Math.min(c.minPayment, c.balance); c.balance -= pay; remaining -= pay; mPay += pay }
    for (const c of pool) { if (c.balance <= 0 || remaining <= 0) continue; const pay = Math.min(remaining, c.balance); c.balance -= pay; remaining -= pay; mPay += pay }
    totalInterest += mInt
    schedule.push({ month, balance: pool.reduce((s, c) => s + Math.max(0, c.balance), 0), payment: mPay, interest: mInt })
  }
  return { strategy, months: month, totalInterest, totalCost: cards.reduce((s, c) => s + c.balance, 0) + totalInterest, schedule }
}

// Binary search: find minimum extra payment to pay off in ≤ targetMonths
function findExtraForGoal(cards: Card[], targetMonths: number): number {
  if (!cards.length) return 0
  let lo = 0, hi = 100000
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const r = simulatePayoff(cards.map(c => ({ ...c })), "avalanche", mid)
    if (r.months <= targetMonths) hi = mid
    else lo = mid
  }
  return Math.ceil(hi)
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtUSD = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = (n: number) => n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(1) + "K" : fmtUSD(n)
const fmtMo = (n: number) => { const y = Math.floor(n / 12), m = n % 12; return y === 0 ? `${m}mo` : m === 0 ? `${y}yr` : `${y}yr ${m}mo` }
const COLORS = ["#4ade80", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#34d399", "#fb923c", "#e879f9", "#38bdf8", "#a3e635"]

// ─────────────────────────────────────────────────────────────
// PIE CHART
// ─────────────────────────────────────────────────────────────
function PieChart({ cards, highlighted, onHighlight }: { cards: Card[]; highlighted: number | null; onHighlight: (id: number | null) => void }) {
  const total = cards.reduce((s, c) => s + c.balance, 0)
  if (!total) return <div className="h-48 flex items-center justify-center text-white/30 text-sm">Add cards to see chart</div>
  let angle = -Math.PI / 2
  const slices = cards.map((c, i) => { const pct = c.balance / total, sweep = pct * 2 * Math.PI; const s = { id: c.id, name: c.name, value: c.balance, pct: pct * 100, color: COLORS[i % COLORS.length], start: angle, end: angle + sweep }; angle += sweep; return s })
  const cx = 130, cy = 130, r = 100, ir = 55
  const arc = (s: typeof slices[0], expand = false) => { const off = expand ? 8 : 0, mid = (s.start + s.end) / 2, ox = off * Math.cos(mid), oy = off * Math.sin(mid); const x1 = cx + ox + r * Math.cos(s.start), y1 = cy + oy + r * Math.sin(s.start), x2 = cx + ox + r * Math.cos(s.end), y2 = cy + oy + r * Math.sin(s.end), ix1 = cx + ox + ir * Math.cos(s.end), iy1 = cy + oy + ir * Math.sin(s.end), ix2 = cx + ox + ir * Math.cos(s.start), iy2 = cy + oy + ir * Math.sin(s.start), lg = s.end - s.start > Math.PI ? 1 : 0; return `M${x1},${y1} A${r},${r},0,${lg},1,${x2},${y2} L${ix1},${iy1} A${ir},${ir},0,${lg},0,${ix2},${iy2} Z` }
  const hov = highlighted !== null ? slices.find(s => s.id === highlighted) : null
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="260" height="260" viewBox="0 0 260 260" className="shrink-0">
        {slices.map(s => (
          <path key={s.id} d={arc(s, highlighted === s.id)} fill={s.color} fillOpacity={highlighted !== null && highlighted !== s.id ? 0.3 : 1} stroke="#0f1117" strokeWidth={2} style={{ cursor: "pointer", transition: "all 0.18s" }} onMouseEnter={() => onHighlight(s.id)} onMouseLeave={() => onHighlight(null)} onClick={() => onHighlight(highlighted === s.id ? null : s.id)} />
        ))}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="inherit">{hov ? hov.name.slice(0, 14) : "Total Debt"}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={hov ? hov.color : "#4ade80"} fontSize="15" fontWeight="700" fontFamily="inherit">{hov ? fmtK(hov.value) : fmtK(total)}</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="inherit">{hov ? hov.pct.toFixed(1) + "%" : `${cards.length} card${cards.length > 1 ? "s" : ""}`}</text>
      </svg>
      <div className="flex flex-col gap-2 min-w-0">
        {slices.map(s => (
          <div key={s.id} className="flex items-center gap-2 cursor-pointer group" onMouseEnter={() => onHighlight(s.id)} onMouseLeave={() => onHighlight(null)} onClick={() => onHighlight(highlighted === s.id ? null : s.id)}>
            <span className="w-3 h-3 rounded-sm shrink-0 group-hover:scale-125 transition-transform" style={{ background: s.color }} />
            <span className="text-xs text-white/50 group-hover:text-white transition-colors truncate max-w-[140px]">{s.name}</span>
            <span className="text-xs font-semibold text-white ml-auto">{s.pct.toFixed(1)}%</span>
            <span className="text-xs text-white/40 w-16 text-right">{fmtK(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FILE HELPERS
// ─────────────────────────────────────────────────────────────
const readAsText = (f: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error("Read failed")); r.readAsText(f) })

async function extractPDFText(file: File): Promise<string> {
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; s.onload = () => res(); s.onerror = () => rej(new Error("pdf.js failed")); document.head.appendChild(s) })
      ; (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
  }
  const lib = (window as any).pdfjsLib, buf = await file.arrayBuffer(), pdf = await lib.getDocument({ data: buf }).promise
  let text = ""
  for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); text += content.items.map((it: any) => it.str).join(" ") + "\n" }
  return text
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth"); const buf = await file.arrayBuffer(); const result = await mammoth.extractRawText({ arrayBuffer: buf }); return result.value
}

async function extractExcelText(file: File): Promise<string> {
  try { const XLSX = (await import("xlsx" as any)) as any; const buf = await file.arrayBuffer(); const wb = XLSX.read(buf, { type: "array" }); return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]) } catch { return readAsText(file) }
}

// ─────────────────────────────────────────────────────────────
// PDF GENERATION  (jsPDF, loaded from CDN)
// ─────────────────────────────────────────────────────────────
async function loadJsPDF() {
  if ((window as any).jspdf?.jsPDF) return (window as any).jspdf.jsPDF
  await new Promise<void>((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = () => res(); s.onerror = () => rej(new Error("jsPDF failed to load")); document.head.appendChild(s) })
  return (window as any).jspdf.jsPDF
}

async function generatePDF(cards: Card[], payoffs: PayoffResult[], extra: number, goalInsights: GoalInsight[], totalDebt: number, monthlyInt: number, avgAPR: number) {
  const JsPDF = await loadJsPDF()
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = 210, M = 16, now = new Date()
  const contentW = W - M * 2

  // ── Color palette ────────────────────────────────────────────
  const C = {
    navy: [15, 40, 70] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],
    greenL: [220, 252, 231] as [number, number, number],
    red: [185, 28, 28] as [number, number, number],
    redL: [254, 226, 226] as [number, number, number],
    amber: [146, 100, 0] as [number, number, number],
    amberL: [254, 243, 199] as [number, number, number],
    gray1: [248, 249, 250] as [number, number, number],
    gray2: [241, 243, 245] as [number, number, number],
    gray3: [206, 212, 218] as [number, number, number],
    gray5: [108, 117, 125] as [number, number, number],
    gray7: [52, 58, 64] as [number, number, number],
    black: [17, 17, 17] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    border: [220, 225, 230] as [number, number, number],
  }

  // ── Helpers ──────────────────────────────────────────────────
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2])
  const setTxt = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])
  const setDraw = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2])
  const bold = (size: number) => { doc.setFont("helvetica", "bold"); doc.setFontSize(size) }
  const normal = (size: number) => { doc.setFont("helvetica", "normal"); doc.setFontSize(size) }
  const italic = (size: number) => { doc.setFont("helvetica", "italic"); doc.setFontSize(size) }

  // Horizontal rule
  const hr = (y: number, color = C.border) => { setDraw(color); doc.setLineWidth(0.25); doc.line(M, y, W - M, y) }

  // Section heading with green left bar
  const sectionHead = (text: string, y: number): number => {
    setFill(C.green); doc.rect(M, y, 3, 6, "F")
    bold(11); setTxt(C.navy)
    doc.text(text, M + 6, y + 5)
    return y + 10
  }

  // Table header row
  const tableHead = (cols: { label: string; x: number; align?: "left" | "right" | "center" }[], y: number, rowH = 7): number => {
    setFill(C.navy); doc.rect(M, y, contentW, rowH, "F")
    bold(7.5); setTxt(C.white)
    cols.forEach(c => doc.text(c.label, c.x, y + rowH * 0.68, { align: c.align || "left" }))
    return y + rowH
  }

  // Table data row
  const tableRow = (cols: { text: string; x: number; color?: [number, number, number]; bold?: boolean; align?: "left" | "right" | "center" }[], y: number, rowH = 7, shade = false): number => {
    if (shade) { setFill(C.gray1); doc.rect(M, y, contentW, rowH, "F") }
    setDraw(C.border); doc.setLineWidth(0.1); doc.line(M, y + rowH, W - M, y + rowH)
    cols.forEach(c => {
      if (c.bold) bold(8.5); else normal(8.5)
      setTxt(c.color || C.gray7)
      doc.text(c.text, c.x, y + rowH * 0.68, { align: c.align || "left" })
    })
    return y + rowH
  }

  // Page check — add new page if needed
  const checkPage = (y: number, need = 30): number => {
    if (y + need > 272) { doc.addPage(); addPageBg(); return 24 }
    return y
  }

  // White background on each page
  const addPageBg = () => { setFill(C.white); doc.rect(0, 0, W, 297, "F") }
  addPageBg()

  // ════════════════════════════════════════════════════════════
  // PAGE 1 — HEADER
  // ════════════════════════════════════════════════════════════

  // Top navy bar
  setFill(C.navy); doc.rect(0, 0, W, 38, "F")
  // Green accent strip
  setFill(C.green); doc.rect(0, 0, 5, 38, "F")

  // Company name
  bold(20); setTxt(C.white)
  doc.text("WealthClaude", M + 4, 16)
  normal(9); setTxt(C.greenL)
  doc.text("Credit Card Debt Payoff Plan", M + 4, 24)

  // Right side meta
  normal(8); setTxt([160, 185, 210] as [number, number, number])
  doc.text(`Generated: ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, W - M, 13, { align: "right" })
  doc.text("wealthclaude.com", W - M, 21, { align: "right" })
  doc.text("Confidential — For Personal Use Only", W - M, 29, { align: "right" })

  let y = 46

  // ── Summary stat boxes ───────────────────────────────────────
  const stats = [
    { label: "Total Debt", value: fmtK(totalDebt), valueColor: C.red },
    { label: "Weighted Avg APR", value: avgAPR.toFixed(2) + "%", valueColor: C.amber },
    { label: "Monthly Interest", value: fmtUSD(monthlyInt), valueColor: C.red },
    { label: "Annual Interest", value: fmtK(monthlyInt * 12), valueColor: C.red },
  ]
  const bw = (contentW - 9) / 4
  stats.forEach((s, i) => {
    const x = M + i * (bw + 3)
    setFill(C.gray1); doc.rect(x, y, bw, 18, "F")
    setDraw(C.border); doc.setLineWidth(0.3); doc.rect(x, y, bw, 18, "S")
    // colored top accent
    setFill(i === 1 ? C.amber : C.red); doc.rect(x, y, bw, 1.2, "F")
    normal(7); setTxt(C.gray5)
    doc.text(s.label.toUpperCase(), x + bw / 2, y + 6.5, { align: "center" })
    bold(11); setTxt(s.valueColor)
    doc.text(s.value, x + bw / 2, y + 14, { align: "center" })
  })
  y += 24

  // ════════════════════════════════════════════════════════════
  // SECTION 1 — YOUR CREDIT CARDS
  // ════════════════════════════════════════════════════════════
  y = sectionHead("Your Credit Cards", y)

  const cc = [M + 2, M + 66, M + 102, M + 132, M + 158]
  y = tableHead([
    { label: "CARD NAME", x: cc[0] },
    { label: "BALANCE", x: cc[1] },
    { label: "APR", x: cc[2] },
    { label: "MIN PAYMENT", x: cc[3] },
    { label: "INTEREST / MO", x: cc[4] },
  ], y)

  cards.forEach((c, i) => {
    y = tableRow([
      { text: c.name.slice(0, 30), x: cc[0], color: C.black, bold: true },
      { text: fmtUSD(c.balance), x: cc[1], color: C.red },
      { text: c.apr.toFixed(2) + "%", x: cc[2], color: C.amber },
      { text: fmtUSD(c.minPayment), x: cc[3], color: C.gray7 },
      { text: fmtUSD((c.apr / 100 / 12) * c.balance), x: cc[4], color: C.red },
    ], y, 8, i % 2 === 1)
  })
  y += 10

  // ════════════════════════════════════════════════════════════
  // SECTION 2 — PAYOFF STRATEGY COMPARISON
  // ════════════════════════════════════════════════════════════
  y = checkPage(y, 50)
  y = sectionHead("Payoff Strategy Comparison", y)

  normal(8.5); setTxt(C.gray5)
  doc.text(`Monthly extra payment applied: ${fmtUSD(extra)}`, M, y); y += 7

  const sc = [M + 2, M + 58, M + 96, M + 130, M + 163]
  y = tableHead([
    { label: "STRATEGY", x: sc[0] },
    { label: "PAYOFF TIME", x: sc[1] },
    { label: "TOTAL INTEREST", x: sc[2] },
    { label: "TOTAL COST", x: sc[3] },
    { label: "MONTHLY PAYMENT", x: sc[4] },
  ], y)

  const totalMin = cards.reduce((s, c) => s + c.minPayment, 0)
  payoffs.forEach((p, i) => {
    const label = p.strategy === "snowball" ? "Snowball  (smallest balance first)" : p.strategy === "avalanche" ? "Avalanche  (highest APR first)" : "Custom"
    y = tableRow([
      { text: label, x: sc[0], color: C.navy, bold: true },
      { text: fmtMo(p.months), x: sc[1], color: C.green, bold: true },
      { text: fmtUSD(p.totalInterest), x: sc[2], color: C.red },
      { text: fmtUSD(p.totalCost), x: sc[3], color: C.gray7 },
      { text: fmtUSD(totalMin + extra), x: sc[4], color: C.gray7 },
    ], y, 8.5, i % 2 === 1)
  })

  // Tip box
  y += 5
  setFill(C.greenL); doc.rect(M, y, contentW, 12, "F")
  setDraw(C.green); doc.setLineWidth(0.4); doc.rect(M, y, contentW, 12, "S")
  setFill(C.green); doc.rect(M, y, 3, 12, "F")
  bold(8.5); setTxt(C.green); doc.text("Recommendation:", M + 7, y + 5)
  normal(8.5); setTxt(C.gray7)
  const av = payoffs.find(p => p.strategy === "avalanche"), sb = payoffs.find(p => p.strategy === "snowball")
  const savingsTip = av && sb ? `Avalanche saves you ${fmtUSD(sb.totalInterest - av.totalInterest)} in interest vs Snowball and pays off ${sb.months - av.months} month(s) faster.` : "Use Avalanche strategy to minimize total interest paid."
  doc.text(savingsTip, M + 43, y + 5)
  normal(8); setTxt(C.gray5)
  doc.text("Paying even a small amount extra each month dramatically reduces your payoff timeline.", M + 7, y + 9.5)
  y += 18

  // ════════════════════════════════════════════════════════════
  // SECTION 3 — DEBT-FREE GOAL SCENARIOS
  // ════════════════════════════════════════════════════════════
  if (goalInsights.length) {
    y = checkPage(y, 60)
    y = sectionHead("Debt-Free Goal Scenarios", y)
    normal(8.5); setTxt(C.gray5)
    doc.text("The table below shows exactly how much you need to pay each month to become debt-free by each target date (Avalanche strategy).", M, y, { maxWidth: contentW })
    y += 10

    const gc = [M + 2, M + 30, M + 68, M + 106, M + 140, M + 172]
    y = tableHead([
      { label: "TARGET", x: gc[0] },
      { label: "EXTRA / MO", x: gc[1] },
      { label: "TOTAL MONTHLY", x: gc[2] },
      { label: "PAYOFF TIME", x: gc[3] },
      { label: "TOTAL INTEREST", x: gc[4] },
      { label: "INTEREST SAVED", x: gc[5] },
    ], y)

    goalInsights.forEach((g, i) => {
      y = tableRow([
        { text: g.label, x: gc[0], color: C.navy, bold: true },
        { text: "+" + fmtUSD(g.extra), x: gc[1], color: C.green, bold: true },
        { text: fmtUSD(g.totalMonthly), x: gc[2], color: C.gray7 },
        { text: fmtMo(g.actualMonths), x: gc[3], color: C.green },
        { text: fmtUSD(g.totalInterest), x: gc[4], color: C.red },
        { text: "Save " + fmtUSD(g.interestSaved), x: gc[5], color: C.green },
      ], y, 8.5, i % 2 === 1)
    })
    y += 10
  }

  // ════════════════════════════════════════════════════════════
  // SECTION 4 — BALANCE OVER TIME CHART
  // ════════════════════════════════════════════════════════════
  const avalanche = payoffs.find(p => p.strategy === "avalanche")
  if (avalanche && avalanche.schedule.length > 0) {
    y = checkPage(y, 55)
    y = sectionHead("Balance Over Time  (Avalanche Strategy)", y)

    const chartH = 38, chartW = contentW
    const cx = M, cy = y

    // Chart background
    setFill(C.gray1); doc.rect(cx, cy, chartW, chartH, "F")
    setDraw(C.border); doc.setLineWidth(0.2); doc.rect(cx, cy, chartW, chartH, "S")

    // Y-axis grid lines (4 levels)
    normal(6.5); setTxt(C.gray5)
    for (let lvl = 0; lvl <= 4; lvl++) {
      const gy = cy + chartH - (lvl / 4) * chartH
      setDraw(C.border); doc.setLineWidth(0.15); doc.line(cx, gy, cx + chartW, gy)
      doc.text(fmtK(totalDebt * (lvl / 4)), cx - 1, gy + 1.5, { align: "right" })
    }

    // Area fill (light green gradient approximation using thin rects)
    const sched = avalanche.schedule
    const step = Math.max(1, Math.floor(sched.length / 100))
    const pts = sched.filter((_, i) => i % step === 0 || i === sched.length - 1)
    pts.forEach((pt, i) => {
      if (i === pts.length - 1) return
      const x1 = cx + (i / (pts.length - 1)) * chartW
      const x2 = cx + ((i + 1) / (pts.length - 1)) * chartW
      const pct1 = Math.max(0, pt.balance / totalDebt)
      const pct2 = Math.max(0, pts[i + 1].balance / totalDebt)
      const y1 = cy + chartH - pct1 * chartH
      const y2 = cy + chartH - pct2 * chartH
      // Filled area under line
      setFill([220, 242, 230] as [number, number, number])
      doc.triangle(x1, y1, x2, y2, x2, cy + chartH, "F")
      doc.triangle(x1, y1, x1, cy + chartH, x2, cy + chartH, "F")
      // Line
      const r = Math.round(200 - pct1 * 160), g = Math.round(140 + pct1 * 50)
      setDraw([r, g, 60] as [number, number, number]); doc.setLineWidth(0.7)
      doc.line(x1, y1, x2, y2)
    })

    // X-axis labels
    normal(6.5); setTxt(C.gray5)
    doc.text("Today  " + fmtK(totalDebt), cx + 1, cy + chartH + 4)
    doc.text("Debt Free!", cx + chartW, cy + chartH + 4, { align: "right" })
    const midPt = pts[Math.floor(pts.length / 2)]
    if (midPt) doc.text(fmtK(midPt.balance), cx + chartW / 2, cy + chartH + 4, { align: "center" })

    y = cy + chartH + 10
  }

  // ════════════════════════════════════════════════════════════
  // SECTION 5 — RECOMMENDED ACTION PLAN
  // ════════════════════════════════════════════════════════════
  y = checkPage(y, 50)
  y = sectionHead("Recommended Action Plan", y)

  const av2 = payoffs.find(p => p.strategy === "avalanche")
  if (av2) {
    const payDate = new Date(); payDate.setMonth(payDate.getMonth() + av2.months)
    const plan = [
      { step: "1", action: "List all cards by APR — highest to lowest", detail: "Focus every extra dollar on the highest-rate card first while paying minimums on the rest." },
      { step: "2", action: `Pay ${fmtUSD(totalMin + extra)}/month total  (${fmtUSD(extra)} extra)`, detail: `At this rate you will be debt-free in ${fmtMo(av2.months)} by ${payDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}.` },
      { step: "3", action: "Roll over payments as each card is paid off", detail: "When a card reaches $0, add its minimum payment to the next card on your list." },
      { step: "4", action: "Avoid new charges on high-APR cards", detail: "New purchases at 25-30% APR immediately offset your progress. Use a debit card or low-APR card instead." },
      { step: "5", action: "Set up autopay for at least the minimum", detail: "Late payments trigger penalty APRs up to 29.99% and damage your credit score." },
    ]
    plan.forEach((p, i) => {
      y = checkPage(y, 16)
      setFill(i % 2 === 0 ? C.gray1 : C.white); doc.rect(M, y, contentW, 14, "F")
      setDraw(C.border); doc.setLineWidth(0.15); doc.line(M, y + 14, W - M, y + 14)
      // Step circle
      setFill(C.navy); doc.circle(M + 5, y + 7, 4, "F")
      bold(8); setTxt(C.white); doc.text(p.step, M + 5, y + 9.5, { align: "center" })
      bold(8.5); setTxt(C.navy); doc.text(p.action, M + 12, y + 5.5)
      normal(8); setTxt(C.gray5); doc.text(p.detail, M + 12, y + 11, { maxWidth: contentW - 14 })
      y += 14
    })
  }
  y += 8

  // ════════════════════════════════════════════════════════════
  // DISCLAIMER BOX
  // ════════════════════════════════════════════════════════════
  y = checkPage(y, 22)
  setFill([255, 250, 235] as [number, number, number]); doc.rect(M, y, contentW, 16, "F")
  setDraw([203, 145, 0] as [number, number, number]); doc.setLineWidth(0.4); doc.rect(M, y, contentW, 16, "S")
  setFill([203, 145, 0] as [number, number, number]); doc.rect(M, y, 3, 16, "F")
  bold(8.5); setTxt([146, 100, 0] as [number, number, number])
  doc.text("Disclaimer", M + 7, y + 5.5)
  normal(7.5); setTxt(C.gray7)
  doc.text("This report is generated by WealthClaude and is for informational purposes only. It does not constitute financial, legal, or credit advice.", M + 7, y + 10, { maxWidth: contentW - 10 })
  doc.text("Calculations are estimates based on fixed APR assumptions. Actual results may vary. Please consult a certified financial advisor for personalized guidance.", M + 7, y + 14.5, { maxWidth: contentW - 10 })
  y += 22

  // ════════════════════════════════════════════════════════════
  // FOOTER on every page
  // ════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    // Footer bar
    setFill(C.navy); doc.rect(0, 283, W, 14, "F")
    setFill(C.green); doc.rect(0, 283, W, 1.5, "F")
    bold(8); setTxt(C.white); doc.text("WealthClaude", M, 291)
    normal(7.5); setTxt([140, 165, 190] as [number, number, number])
    doc.text("Credit Card Debt Payoff Plan  |  wealthclaude.com", W / 2, 291, { align: "center" })
    doc.text(`Page ${p} of ${totalPages}`, W - M, 291, { align: "right" })
  }

  doc.save(`WealthClaude-DebtPlan-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.pdf`)
}

// ─────────────────────────────────────────────────────────────
// GOAL INSIGHT TYPE
// ─────────────────────────────────────────────────────────────
interface GoalInsight {
  years: number
  label: string
  extra: number
  totalMonthly: number
  actualMonths: number
  totalInterest: number
  interestSaved: number
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
type FileResult = { name: string; status: "ok" | "partial" | "error"; cards: Card[]; msg?: string }

export default function CreditCardDebtCalculatorPage() {
  const [tab, setTab] = useState<"manual" | "upload">("manual")
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
  const [parseStatus, setParseStatus] = useState<"idle" | "loading" | "success" | "partial" | "error">("idle")
  const [parseMsg, setParseMsg] = useState("")
  const [preview, setPreview] = useState<Card[]>([])
  const [fileResults, setFileResults] = useState<FileResult[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [goalYears, setGoalYears] = useState<number | null>(null)
  const [customGoal, setCustomGoal] = useState(36) // months
  const [goalInsights, setGoalInsights] = useState<GoalInsight[]>([])
  const [pdfLoading, setPdfLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { try { const s = localStorage.getItem("wc_cc3"); if (s) setCards(JSON.parse(s)) } catch { } }, [])
  useEffect(() => { try { localStorage.setItem("wc_cc3", JSON.stringify(cards)) } catch { } }, [cards])
  useEffect(() => {
    if (!cards.length) { setPayoffs([]); return }
    setPayoffs(["snowball", "avalanche", "custom"].map(s => simulatePayoff(cards, s as Strategy, extra)))
  }, [cards, extra])

  // Recompute goal insights whenever cards change
  useEffect(() => {
    if (!cards.length) { setGoalInsights([]); return }
    const base = simulatePayoff(cards.map(c => ({ ...c })), "avalanche", 0)
    const presets = [1, 2, 3, 5, 7, 10]
    const results: GoalInsight[] = presets.map(years => {
      const targetMonths = years * 12
      const extra = findExtraForGoal(cards.map(c => ({ ...c })), targetMonths)
      const totalMin = cards.reduce((s, c) => s + c.minPayment, 0)
      const r = simulatePayoff(cards.map(c => ({ ...c })), "avalanche", extra)
      return { years, label: `${years} year${years > 1 ? "s" : ""}`, extra, totalMonthly: totalMin + extra, actualMonths: r.months, totalInterest: r.totalInterest, interestSaved: base.totalInterest - r.totalInterest }
    }).filter(g => g.extra >= 0 && g.actualMonths <= g.years * 12 + 1)
    setGoalInsights(results)
  }, [cards])

  const totalDebt = cards.reduce((s, c) => s + c.balance, 0)
  const totalMin = cards.reduce((s, c) => s + c.minPayment, 0)
  const monthlyInt = cards.reduce((s, c) => s + (c.apr / 100 / 12) * c.balance, 0)
  const avgAPR = totalDebt > 0 ? cards.reduce((s, c) => s + c.apr * c.balance, 0) / totalDebt : 0

  const addCard = () => { if (!newCard.balance) return; setCards(p => [...p, { ...newCard, id: nextId, name: newCard.name || `Card ${nextId}` }]); setNextId(n => n + 1); setNewCard({ name: "", balance: 0, apr: 0, minPayment: 0 }) }
  const removeCard = (id: number) => setCards(p => p.filter(c => c.id !== id))
  const updateCard = (id: number, field: keyof Omit<Card, "id">, val: string | number) => setCards(p => p.map(c => c.id === id ? { ...c, [field]: val } : c))

  // ── Custom goal insight ──────────────────────────────────────
  const customExtra = cards.length ? findExtraForGoal(cards.map(c => ({ ...c })), customGoal) : 0
  const customResult = cards.length ? simulatePayoff(cards.map(c => ({ ...c })), "avalanche", customExtra) : null
  const baseResult = cards.length ? simulatePayoff(cards.map(c => ({ ...c })), "avalanche", 0) : null

  // ── File processing ─────────────────────────────────────────
  async function processFiles(files: FileList | File[]) {
    const arr = Array.from(files); if (!arr.length) return
    setParseStatus("loading"); setParseMsg(`Reading ${arr.length} file${arr.length > 1 ? "s" : ""}…`); setPreview([]); setFileResults([])
    const results: FileResult[] = []
    for (const file of arr) {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      let extracted: Card[] = [], msg = ""
      try {
        if (ext === "csv" || ext === "tsv") { const t = await readAsText(file); const cr = parseCSV(t); extracted = cr.length > 0 ? cr : extractFromText(t, file.name); if (!extracted.length) msg = "No recognizable columns. Expected: card_name, balance, apr, min_payment" }
        else if (ext === "pdf") { const t = await extractPDFText(file); extracted = extractFromText(t, file.name); if (!extracted.length) msg = "No balance/APR found. Scanned PDFs are not supported." }
        else if (ext === "docx") { const t = await extractDocxText(file); const cr = parseCSV(t); extracted = cr.length > 0 ? cr : extractFromText(t, file.name); if (!extracted.length) msg = "No card data found." }
        else if (ext === "doc") { const t = await readAsText(file); extracted = extractFromText(t, file.name); if (!extracted.length) msg = "Old .doc has limited support. Save as .docx first." }
        else if (ext === "txt") { const t = await readAsText(file); const cr = parseCSV(t); extracted = cr.length > 0 ? cr : extractFromText(t, file.name); if (!extracted.length) msg = "No card data found." }
        else if (["xls", "xlsx"].includes(ext)) { const t = await extractExcelText(file); const cr = parseCSV(t); extracted = cr.length > 0 ? cr : extractFromText(t, file.name); if (!extracted.length) msg = "No data found." }
        else { try { const t = await readAsText(file); extracted = extractFromText(t, file.name) } catch { }; if (!extracted.length) msg = `Unsupported format .${ext}` }
        const partial = extracted.some(c => c.apr === 0)
        results.push({ name: file.name, status: extracted.length === 0 ? "error" : partial ? "partial" : "ok", cards: extracted, msg: partial && extracted.length > 0 ? "Balance found — APR not detected. Please fill in the APR field." : msg || undefined })
      } catch (err: any) { results.push({ name: file.name, status: "error", cards: [], msg: err?.message || "Failed to read file." }) }
    }
    setFileResults(results)
    const allCards = results.flatMap(r => r.cards)
    if (allCards.length > 0) { setPreview(allCards.map((c, i) => ({ ...c, id: Date.now() + i }))); setParseStatus(results.every(r => r.status === "ok") ? "success" : "partial"); setParseMsg(`Found ${allCards.length} card${allCards.length > 1 ? "s" : ""}`) }
    else { setParseStatus("error"); setParseMsg("No credit card data found.") }
  }

  const applyPreview = () => { setCards(preview.map((c, i) => ({ ...c, id: Date.now() + i }))); setPreview([]); setParseStatus("idle"); setParseMsg(""); setFileResults([]); setTab("manual") }

  const inputCls = "bg-[#0f1117] border border-white/10 rounded-xl py-2.5 text-sm text-white outline-none focus:border-primary/60 transition-colors px-3 w-full placeholder-white/25"
  const selected = payoffs.find(p => p.strategy === strategy)
  const snowball = payoffs.find(p => p.strategy === "snowball")
  const avalanche = payoffs.find(p => p.strategy === "avalanche")
  const savings = snowball && avalanche ? snowball.totalInterest - avalanche.totalInterest : 0

  const PRESET_YEARS = [1, 2, 3, 5, 7, 10]

  const FAQS = [
    { q: "What file formats can I upload?", a: "PDF bank statements (digital/text-based), CSV exports, Word (.docx), and Excel (.xlsx). All processing happens 100% in your browser — no files are ever sent to a server." },
    { q: "Why doesn't my scanned PDF work?", a: "Scanned PDFs are images with no text layer. Log into your bank's online portal and download the digital PDF statement instead." },
    { q: "How is the 'debt-free goal' calculated?", a: "We use a binary search algorithm to find the exact extra monthly payment needed to pay off all your cards using the Avalanche strategy within your chosen timeframe. It runs thousands of simulations in milliseconds." },
    { q: "What's the difference between Avalanche and Snowball?", a: "Avalanche pays highest APR first — mathematically optimal, saves the most interest. Snowball pays smallest balance first — psychologically motivating, faster early wins. Avalanche is almost always cheaper." },
    { q: "Is my data secure?", a: "Everything runs locally in your browser. Your card data is never sent to any server. Only the extracted fields (name, balance, APR, min payment) are saved in your browser's localStorage." },
    { q: "What does the PDF plan include?", a: "The downloaded PDF includes your company-branded header (WealthClaude), a card summary table, all three payoff strategy comparisons, your debt-free goal scenarios, and a balance-over-time chart." },
  ]

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col text-white">
      <Header />
      <main className="pt-16 flex-1">

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-8 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            Free Tool — Runs 100% In Your Browser
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Credit Card Debt<br /><span className="text-primary">Calculator</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
            Upload any bank statement (PDF, CSV, Word, Excel) or enter manually. Get a personalized payoff plan, set a debt-free goal, and download your branded PDF report.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {[{ ext: "PDF", icon: "📄", note: "pdf.js" }, { ext: "CSV", icon: "📊", note: "auto-detect" }, { ext: "DOCX", icon: "📝", note: "mammoth.js" }, { ext: "XLSX", icon: "📈", note: "SheetJS" }, { ext: "Goal Planner", icon: "🎯", note: "debt-free date" }, { ext: "PDF Export", icon: "📥", note: "WealthClaude branded" }].map(f => (
              <div key={f.ext} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
                <span>{f.icon}</span><span className="font-bold text-white">{f.ext}</span><span className="text-white/35">{f.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-5">

          {/* ── Tabs ── */}
          <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
            <div className="flex border-b border-white/8">
              {(["manual", "upload"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/40 hover:text-white/70"}`}>
                  {t === "manual" ? "✏️  Manual Entry" : "📤  Upload Statement"}
                </button>
              ))}
            </div>

            {/* MANUAL TAB */}
            {tab === "manual" && (
              <div className="p-5 space-y-5">
                <div className="rounded-xl border border-white/8 bg-[#0f1117] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Add a Card</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{ label: "Card Name", field: "name", type: "text", placeholder: "Chase Freedom", prefix: "" }, { label: "Balance ($)", field: "balance", type: "number", placeholder: "2500", prefix: "$" }, { label: "APR (%)", field: "apr", type: "number", placeholder: "19.99", prefix: "" }, { label: "Min Payment ($)", field: "minPayment", type: "number", placeholder: "75", prefix: "$" }].map(f => (
                      <div key={f.field} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{f.label}</label>
                        <div className="relative">
                          {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{f.prefix}</span>}
                          <input type={f.type} placeholder={f.placeholder} value={f.field === "name" ? newCard.name : (newCard as any)[f.field] || ""}
                            onChange={e => setNewCard(p => ({ ...p, [f.field]: f.type === "text" ? e.target.value : +e.target.value || 0 }))}
                            onKeyDown={e => e.key === "Enter" && addCard()}
                            className={inputCls + (f.prefix ? " pl-6" : "")} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={addCard} className="mt-3 w-full rounded-xl bg-primary text-black font-bold py-2.5 text-sm hover:opacity-90 transition-all">+ Add Card</button>
                </div>
                {cards.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-white/8">
                    <table className="w-full text-xs">
                      <thead className="bg-white/3"><tr>{["Card", "Balance", "APR", "Min Payment", "Interest/Mo", ""].map(h => <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>)}</tr></thead>
                      <tbody>
                        {cards.map((c, i) => (
                          <tr key={c.id} className={`border-t border-white/5 cursor-pointer transition-colors ${highlighted === c.id ? "bg-primary/8" : "hover:bg-white/3"}`} onMouseEnter={() => setHighlighted(c.id)} onMouseLeave={() => setHighlighted(null)}>
                            <td className="px-4 py-2.5"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} /><input type="text" value={c.name} onChange={e => updateCard(c.id, "name", e.target.value)} className="bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-primary/40 w-36" /></div></td>
                            <td className="px-4 py-2.5"><div className="flex items-center"><span className="text-white/40 mr-1">$</span><input type="number" value={c.balance} onChange={e => updateCard(c.id, "balance", +e.target.value || 0)} className="bg-transparent text-red-400 font-semibold outline-none border-b border-transparent focus:border-red-400/40 w-20 tabular-nums" /></div></td>
                            <td className="px-4 py-2.5"><div className="flex items-center"><input type="number" value={c.apr} step="0.01" onChange={e => updateCard(c.id, "apr", +e.target.value || 0)} className="bg-transparent text-amber-400 font-semibold outline-none border-b border-transparent focus:border-amber-400/40 w-14 tabular-nums" /><span className="text-white/40 ml-0.5">%</span></div></td>
                            <td className="px-4 py-2.5"><div className="flex items-center"><span className="text-white/40 mr-1">$</span><input type="number" value={c.minPayment} onChange={e => updateCard(c.id, "minPayment", +e.target.value || 0)} className="bg-transparent text-white outline-none border-b border-transparent focus:border-primary/40 w-16 tabular-nums" /></div></td>
                            <td className="px-4 py-2.5 text-red-400 tabular-nums">{fmtUSD((c.apr / 100 / 12) * c.balance)}</td>
                            <td className="px-4 py-2.5"><button onClick={() => removeCard(c.id)} className="text-white/20 hover:text-red-400 transition-colors text-lg leading-none">×</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* UPLOAD TAB */}
            {tab === "upload" && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[{ icon: "📄", title: "PDF", tech: "pdf.js", body: "Any digital bank PDF — Chase, Citi, Amex, BoA, Discover…" }, { icon: "📊", title: "CSV", tech: "native", body: "Auto-detects columns. Any bank export format." }, { icon: "📝", title: "DOCX", tech: "mammoth.js", body: "Extracts text from Word docs, finds card fields." }, { icon: "📈", title: "XLSX", tech: "SheetJS", body: "Excel spreadsheets converted and parsed." }].map(f => (
                    <div key={f.title} className="rounded-xl border border-white/8 bg-[#0f1117] px-4 py-3">
                      <div className="flex items-center gap-2 mb-1.5"><span className="text-lg">{f.icon}</span><span className="text-xs font-bold text-white">{f.title}</span><span className="text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5 ml-auto">{f.tech}</span></div>
                      <div className="text-xs text-white/40 leading-relaxed">{f.body}</div>
                    </div>
                  ))}
                </div>
                <div onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }} onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl py-14 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/12 hover:border-primary/40 hover:bg-white/2"}`}>
                  <div className="text-4xl mb-3">{parseStatus === "loading" ? "⏳" : "📤"}</div>
                  <div className="text-sm font-semibold text-white/70">{parseStatus === "loading" ? "Parsing files…" : "Drop files here or click to browse"}</div>
                  <div className="text-xs text-white/30 mt-1.5">PDF · CSV · DOCX · XLSX · TXT · Multiple files OK</div>
                  <input ref={fileRef} type="file" accept=".csv,.pdf,.doc,.docx,.txt,.xls,.xlsx" multiple className="hidden" onChange={e => { if (e.target.files?.length) processFiles(e.target.files) }} />
                </div>
                {fileResults.length > 0 && (
                  <div className="space-y-2">
                    {fileResults.map((f, i) => (
                      <div key={i} className={`rounded-xl border px-4 py-3 ${f.status === "ok" ? "border-primary/30 bg-primary/5 text-primary" : f.status === "partial" ? "border-amber-400/30 bg-amber-400/5 text-amber-400" : "border-red-400/30 bg-red-400/5 text-red-400"}`}>
                        <div className="flex items-center gap-2 text-xs font-semibold"><span>{f.status === "ok" ? "✓" : f.status === "partial" ? "⚠" : "✕"}</span><span className="flex-1 font-mono truncate">{f.name}</span>{f.cards.length > 0 && <span className="shrink-0 bg-white/10 rounded px-2 py-0.5">{f.cards.length} card{f.cards.length > 1 ? "s" : ""} found</span>}</div>
                        {f.msg && <div className="text-xs mt-1.5 opacity-75">{f.msg}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {preview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-bold ${parseStatus === "partial" ? "text-amber-400" : "text-primary"}`}>{parseStatus === "partial" ? "⚠ " : "✓ "}{parseMsg}</div>
                      <div className="text-xs text-white/30">Edit any field before applying</div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-white/8">
                      <table className="w-full text-xs">
                        <thead className="bg-white/3"><tr>{["Card Name", "Balance", "APR", "Min Payment"].map(h => <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>)}</tr></thead>
                        <tbody>
                          {preview.map((c, i) => (
                            <tr key={i} className="border-t border-white/5">
                              <td className="px-4 py-3"><input type="text" value={c.name} onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-primary/40 w-44" /></td>
                              <td className="px-4 py-3"><div className="flex items-center"><span className="text-white/40 mr-1">$</span><input type="number" value={c.balance} onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, balance: +e.target.value || 0 } : x))} className="bg-transparent text-red-400 font-semibold outline-none border-b border-transparent w-20 tabular-nums" /></div></td>
                              <td className="px-4 py-3"><div className="flex items-center gap-1"><input type="number" value={c.apr} step="0.01" onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, apr: +e.target.value || 0 } : x))} className={`bg-transparent font-semibold outline-none border-b w-14 tabular-nums ${c.apr === 0 ? "border-amber-400 text-amber-400" : "border-transparent text-amber-400"}`} /><span className="text-white/40">%</span>{c.apr === 0 && <span className="text-[9px] text-amber-400 font-bold uppercase bg-amber-400/10 rounded px-1">Enter APR</span>}</div></td>
                              <td className="px-4 py-3"><div className="flex items-center"><span className="text-white/40 mr-1">$</span><input type="number" value={c.minPayment} onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, minPayment: +e.target.value || 0 } : x))} className="bg-transparent text-white outline-none border-b border-transparent focus:border-primary/40 w-16 tabular-nums" /></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={applyPreview} className="w-full rounded-xl bg-primary text-black font-bold py-3 text-sm hover:opacity-90 transition-all">✓ Apply to Calculator</button>
                  </div>
                )}
                <div className="rounded-xl border border-white/6 bg-[#0f1117] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">CSV Format Reference</div>
                  <code className="text-xs text-white/40 font-mono block leading-relaxed">card_name,balance,apr,min_payment<br />Chase Freedom Unlimited,101.75,27.49,40.00</code>
                </div>
              </div>
            )}
          </div>

          {cards.length > 0 && (<>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{ label: "Total Debt", value: fmtK(totalDebt), sub: totalDebt > 10000 ? `At this pace you'll pay ${fmtK(monthlyInt * 12)} in interest this year` : totalDebt > 3000 ? `You're ${fmtK(totalDebt)} away from financial freedom` : `Total outstanding across ${cards.length} card${cards.length > 1 ? "s" : ""}`, color: "text-red-400" }, { label: "Avg APR", value: avgAPR.toFixed(2) + "%", sub: "weighted average", color: "text-amber-400" }, { label: "Monthly Interest", value: fmtK(monthlyInt), sub: "per month", color: "text-red-400" }, { label: "Yearly Interest", value: fmtK(monthlyInt * 12), sub: "annual cost", color: "text-red-400" }].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/8 bg-[#111318] px-5 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">{s.label}</div>
                  <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-white/25 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pie chart + Spending Nature */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Pie chart */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Balance Distribution</div>
                  <PieChart cards={cards} highlighted={highlighted} onHighlight={setHighlighted} />
                </div>
                {/* Right: Spending Nature */}
                <div className="lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-white/8 pt-5 lg:pt-0 lg:pl-6">
                  <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Spending Nature</div>
                  <div className="space-y-2">
                    {cards.map((c, i) => {
                      const type = detectSpendingType(c.name)
                      const info = SPENDING_TYPES[type]
                      return (
                        <div key={c.id} className="rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-white/60 truncate flex-1">{c.name}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${info.color}`}>
                            <span>{info.icon}</span>
                            <span>{info.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Dominant type insight */}
                  {(() => {
                    const dominant = cards.length > 0 ? detectSpendingType(cards.reduce((a, b) => a.balance > b.balance ? a : b).name) : "mixed"
                    const info = SPENDING_TYPES[dominant]
                    return (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/2 p-3 space-y-2">
                        <div className={`text-xs font-bold ${info.color} flex items-center gap-1.5`}>
                          <span>{info.icon}</span> Primary Pattern
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed">{info.tip}</p>
                        <div className="border-t border-white/8 pt-2">
                          <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Strategy Tip</div>
                          <p className="text-[11px] text-white/50 leading-relaxed">{info.strategy}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────
                DEBT-FREE GOAL PLANNER
            ───────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-primary/30 bg-[#111318] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="text-sm font-extrabold text-white">When do you want to be debt free?</div>
                    <div className="text-xs text-white/40">We'll calculate exactly how much extra to pay each month</div>
                  </div>
                </div>
              </div>

              {/* Preset year buttons */}
              <div className="px-6 pt-5 pb-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Quick Select</div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {PRESET_YEARS.map(y => {
                    const insight = goalInsights.find(g => g.years === y)
                    const active = goalYears === y
                    return (
                      <button key={y} onClick={() => setGoalYears(active ? null : y)}
                        className={`rounded-xl px-4 py-3 text-center transition-all border min-w-[80px] ${active ? "border-primary bg-primary/15" : "border-white/10 bg-white/3 hover:border-primary/40 hover:bg-primary/5"}`}>
                        <div className={`text-sm font-extrabold ${active ? "text-primary" : "text-white"}`}>{y} yr{y > 1 ? "s" : ""}</div>
                        {insight ? (
                          <div className="text-[10px] text-white/50 mt-0.5">+{fmtUSD(insight.extra)}/mo</div>
                        ) : (
                          <div className="text-[10px] text-red-400/70 mt-0.5">needs more</div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Custom slider */}
                <div className="rounded-xl border border-white/8 bg-[#0f1117] p-4 mb-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Custom Target</div>
                  <div className="flex items-center gap-4 mb-3">
                    <input type="range" min={6} max={120} step={1} value={customGoal} onChange={e => setCustomGoal(+e.target.value)} className="flex-1 accent-primary" />
                    <div className="text-primary font-extrabold text-sm whitespace-nowrap w-20 text-right">{fmtMo(customGoal)}</div>
                  </div>
                  {customResult && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {[
                        { label: "Pay extra/mo", value: fmtUSD(customExtra), color: "text-primary" },
                        { label: "Total monthly", value: fmtUSD(totalMin + customExtra), color: "text-primary" },
                        { label: "Total interest", value: fmtUSD(customResult.totalInterest), color: "text-red-400" },
                        { label: "Interest saved", value: fmtUSD(Math.max(0, (baseResult?.totalInterest || 0) - customResult.totalInterest)), color: "text-primary" },
                      ].map((s, i) => (
                        <div key={i} className="rounded-lg bg-white/3 border border-white/6 px-3 py-2.5 text-center">
                          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{s.label}</div>
                          <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scenario cards */}
                {goalInsights.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">All Scenarios</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-5">
                      {goalInsights.map(g => {
                        const active = goalYears === g.years
                        return (
                          <div key={g.years} onClick={() => setGoalYears(active ? null : g.years)}
                            className={`rounded-xl border p-4 cursor-pointer transition-all ${active ? "border-primary bg-primary/10" : "border-white/8 bg-white/2 hover:border-primary/30 hover:bg-primary/5"}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className={`text-lg font-extrabold ${active ? "text-primary" : "text-white"}`}>{g.label}</div>
                              <div className="text-xs text-white/40 bg-white/5 rounded-full px-2 py-0.5">{fmtMo(g.actualMonths)} actual</div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/50">Extra/month</span>
                                <span className="text-sm font-bold text-primary">+{fmtUSD(g.extra)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/50">Total monthly</span>
                                <span className="text-sm font-semibold text-white">{fmtUSD(g.totalMonthly)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/50">Total interest</span>
                                <span className="text-sm text-red-400">{fmtUSD(g.totalInterest)}</span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-white/6">
                                <span className="text-xs text-white/50">Interest saved</span>
                                <span className="text-sm font-bold text-primary">↓ {fmtUSD(g.interestSaved)}</span>
                              </div>
                            </div>
                            {active && (
                              <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary font-semibold text-center">
                                ✓ Set extra payment to {fmtUSD(g.extra)}/mo in the strategy section below
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Strategy */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">Payoff Strategy</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([{ key: "snowball", icon: "❄️", label: "Snowball", desc: "Smallest balance first. Quick psychological wins." }, { key: "avalanche", icon: "🏔️", label: "Avalanche", desc: "Highest APR first. Saves the most interest." }, { key: "custom", icon: "⚙️", label: "Custom", desc: "Set your own extra monthly payment." }] as const).map(s => (
                    <button key={s.key} onClick={() => setStrategy(s.key)} className={`text-left rounded-xl border p-4 transition-all ${strategy === s.key ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/20 bg-white/2"}`}>
                      <div className="flex items-center gap-2 mb-1"><span>{s.icon}</span><span className={`text-sm font-bold ${strategy === s.key ? "text-primary" : "text-white"}`}>{s.label}</span>{strategy === s.key && <span className="ml-auto text-primary text-xs font-bold">✓</span>}</div>
                      <div className="text-xs text-white/40">{s.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-white/50 whitespace-nowrap">Extra/mo:</label>
                  <input type="range" min={0} max={2000} step={25} value={extra} onChange={e => setExtra(+e.target.value)} className="flex-1 accent-primary" />
                  <div className="relative w-28"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span><input type="number" value={extra} min={0} onChange={e => setExtra(+e.target.value || 0)} className="bg-[#0f1117] border border-white/10 rounded-lg py-2 pl-6 pr-3 text-sm text-primary font-bold outline-none focus:border-primary/50 w-full" /></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-white/2"><tr>{["Strategy", "Extra/mo", "Payoff Time", "Total Interest", "Total Cost", "vs Snowball"].map(h => <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>)}</tr></thead>
                  <tbody>
                    {payoffs.map(p => {
                      const saved = snowball ? snowball.totalInterest - p.totalInterest : 0; const sel = p.strategy === strategy
                      return (
                        <tr key={p.strategy} onClick={() => setStrategy(p.strategy)} className={`border-t border-white/5 cursor-pointer transition-colors ${sel ? "bg-primary/8" : "hover:bg-white/2"}`}>
                          <td className="px-4 py-3 font-bold"><span className={sel ? "text-primary" : "text-white"}>{p.strategy === "snowball" ? "❄️ Snowball" : p.strategy === "avalanche" ? "🏔️ Avalanche" : "⚙️ Custom"}</span></td>
                          <td className="px-4 py-3 text-white/50">{fmtUSD(extra)}</td>
                          <td className={`px-4 py-3 font-semibold ${sel ? "text-primary" : "text-white"}`}>{fmtMo(p.months)}</td>
                          <td className="px-4 py-3 text-red-400 tabular-nums">{fmtUSD(p.totalInterest)}</td>
                          <td className="px-4 py-3 text-white tabular-nums">{fmtUSD(p.totalCost)}</td>
                          <td className={`px-4 py-3 font-semibold tabular-nums ${saved > 0 ? "text-primary" : saved < 0 ? "text-red-400" : "text-white/30"}`}>{saved === 0 ? "—" : (saved > 0 ? "save " : "cost ") + fmtUSD(Math.abs(saved))}</td>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />Your Action Plan
                </div>
                {(() => {
                  const dominant = cards.length > 0 ? detectSpendingType(cards.reduce((a, b) => a.balance > b.balance ? a : b).name) : "mixed"
                  const info = SPENDING_TYPES[dominant]
                  return (
                    <div className="mb-5 space-y-2">
                      <div className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                        Pay <span className="text-primary">{fmtUSD(extra)}</span> extra/month using <span className="text-primary capitalize">{selected.strategy}</span> → <span className="text-primary">debt free in {fmtMo(selected.months)}</span>
                        {savings > 0 && selected.strategy === "avalanche" && <>, saving <span className="text-primary">{fmtUSD(savings)}</span> vs snowball</>}
                      </div>
                      <div className={`inline-flex items-center gap-2 text-xs font-semibold ${info.color} bg-white/5 border border-white/10 rounded-full px-3 py-1`}>
                        <span>{info.icon}</span>
                        <span>{info.label} pattern detected —</span>
                        <span className="text-white/50 font-normal">{info.strategy}</span>
                      </div>
                    </div>
                  )
                })()}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: "Payoff Date", value: (() => { const d = new Date(); d.setMonth(d.getMonth() + selected.months); return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) })(), color: "text-primary" },
                    { label: "Total Interest", value: fmtUSD(selected.totalInterest), color: "text-red-400" },
                    { label: "Total Cost", value: fmtUSD(selected.totalCost), color: "text-white" },
                    { label: "Monthly Budget", value: fmtUSD(totalMin + extra), color: "text-primary" },
                  ].map((s, i) => (
                    <div key={i}><div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{s.label}</div><div className={`text-lg font-bold ${s.color}`}>{s.value}</div></div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Balance Over Time</div>
                  <div className="flex items-end gap-px h-10 rounded-lg overflow-hidden">
                    {selected.schedule.filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 60)) === 0 || i === a.length - 1).map((row, i) => {
                      const pct = totalDebt > 0 ? row.balance / totalDebt : 0
                      return <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(3, pct * 100)}%`, background: `hsl(${142 - pct * 142},70%,55%)` }} />
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-white/25 mt-1"><span>Today — {fmtK(totalDebt)}</span><span>Debt Free 🎉</span></div>
                </div>

                {/* Download PDF button */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <button
                    onClick={async () => { setPdfLoading(true); try { await generatePDF(cards, payoffs, extra, goalInsights, totalDebt, monthlyInt, avgAPR) } catch (e) { alert("PDF generation failed. Please try again.") } setPdfLoading(false) }}
                    disabled={pdfLoading}
                    className="w-full rounded-xl bg-white/8 border border-white/15 hover:bg-white/12 hover:border-primary/40 text-white font-bold py-3.5 text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group">
                    {pdfLoading ? (
                      <><span className="animate-spin text-lg">⏳</span> Generating PDF…</>
                    ) : (
                      <>
                        <span className="text-lg group-hover:scale-110 transition-transform">📥</span>
                        <span>Download Payoff Plan PDF</span>
                        <span className="text-white/30 text-xs font-normal ml-1">— WealthClaude branded</span>
                      </>
                    )}
                  </button>
                  <div className="text-center text-[10px] text-white/25 mt-2">Includes card summary · strategy comparison · goal scenarios · balance chart</div>
                </div>
              </div>
            )}

            {/* FAQ */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 text-sm font-bold text-white">Frequently Asked Questions</div>
              <div className="p-4 space-y-2">
                {FAQS.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/8 overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white hover:text-primary transition-colors">
                      {f.q}<span className={`text-white/40 text-lg shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45 text-primary" : ""}`}>+</span>
                    </button>
                    {openFaq === i && <div className="px-5 pb-4 text-sm text-white/50 leading-relaxed">{f.a}</div>}
                  </div>
                ))}
              </div>
            </div>

          </>)}

          {cards.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-white/25">
              <div className="text-4xl mb-3">💳</div>
              <div className="text-sm font-semibold">Add your first card above to see your debt breakdown</div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link href="/careers" className="text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2">Join the WealthClaude team → Careers</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
