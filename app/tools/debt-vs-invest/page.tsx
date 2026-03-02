"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface DebtItem {
  id: number
  name: string
  balance: number
  apr: number
  minPayment: number
}

interface TaxBracket { label: string; rate: number; capitalGains: number }
const TAX_BRACKETS: TaxBracket[] = [
  { label: "10%  —  Under $11,000", rate: 0.10, capitalGains: 0 },
  { label: "12%  —  $11,000–$44,725", rate: 0.12, capitalGains: 0 },
  { label: "22%  —  $44,725–$95,375", rate: 0.22, capitalGains: 0.15 },
  { label: "24%  —  $95,375–$182,050", rate: 0.24, capitalGains: 0.15 },
  { label: "32%  —  $182,050–$231,250", rate: 0.32, capitalGains: 0.15 },
  { label: "35%  —  $231,250–$578,125", rate: 0.35, capitalGains: 0.20 },
  { label: "37%  —  Over $578,125", rate: 0.37, capitalGains: 0.20 },
]

interface MonthSnap { month: number; debtBalance: number; investBalance: number; netWorth: number }
interface SimResult {
  path: "debt-first" | "invest-first" | "balanced"
  label: string
  color: string
  snaps: MonthSnap[]
  finalNetWorth: number
  debtFreeMonth: number
  totalInterestPaid: number
  totalNewInvested: number
}

interface ScoreItem { label: string; score: number; max: number; detail: string }
interface HealthScore { total: number; grade: string; gradeColor: string; items: ScoreItem[] }

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmtUSD = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = (n: number) => { const a = Math.abs(n), p = n < 0 ? "-" : ""; return a >= 1e6 ? `${p}$${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${p}$${(a / 1e3).toFixed(1)}K` : `${p}${fmtUSD(a)}` }
const COLORS = ["#4ade80", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#34d399"]

// ─────────────────────────────────────────────────────────────
// SIMULATION ENGINE  (120 months, month-by-month)
// ─────────────────────────────────────────────────────────────
function simulate(
  debts: DebtItem[],
  monthlyCash: number,
  salary: number,
  matchPct: number,
  matchRate: number,
  expectedReturn: number,
  currentInvest: number,
  path: SimResult["path"]
): SimResult {
  const MONTHS = 120
  const mr = expectedReturn / 100 / 12
  const minContribForMatch = matchPct * (salary / 12)   // min contribution to get full match
  const employerMatchPerMonth = minContribForMatch * matchRate

  let pool = debts.map(d => ({ ...d }))
  let invest = currentInvest
  let totalInterest = 0
  let totalNewInvested = 0
  let debtFreeMonth = MONTHS + 1
  const snaps: MonthSnap[] = []

  for (let m = 1; m <= MONTHS; m++) {
    // Apply monthly interest to all debts
    for (const d of pool) {
      if (d.balance <= 0) continue
      const int = (d.apr / 100 / 12) * d.balance
      d.balance += int
      totalInterest += int
    }

    // Investment grows
    invest *= (1 + mr)

    const hasDebt = pool.some(d => d.balance > 0.01)
    if (!hasDebt && debtFreeMonth > MONTHS) debtFreeMonth = m

    let rem = monthlyCash

    if (path === "debt-first") {
      // Always capture 401k match first (free money, instant return)
      if (salary > 0 && matchPct > 0 && hasDebt) {
        const contrib = Math.min(rem, minContribForMatch)
        invest += contrib + (contrib > 0 ? employerMatchPerMonth : 0)
        totalNewInvested += contrib
        rem -= contrib
      }
      if (!hasDebt) {
        // Debt gone — invest everything
        invest += rem + (salary > 0 ? employerMatchPerMonth : 0)
        totalNewInvested += rem
        rem = 0
      } else {
        // Minimums first
        for (const d of pool) {
          if (d.balance <= 0) continue
          const pay = Math.min(d.minPayment, d.balance)
          d.balance -= pay; rem -= pay
        }
        // Avalanche: extra to highest APR
        const sorted = pool.filter(d => d.balance > 0).sort((a, b) => b.apr - a.apr)
        for (const d of sorted) {
          if (rem <= 0) break
          const orig = pool.find(x => x.id === d.id)!
          const pay = Math.min(rem, orig.balance)
          orig.balance -= pay; rem -= pay
        }
      }
    } else if (path === "invest-first") {
      // Pay minimums, invest everything else + employer match
      for (const d of pool) {
        if (d.balance <= 0) continue
        const pay = Math.min(d.minPayment, d.balance)
        d.balance -= pay; rem -= pay
      }
      if (rem > 0) {
        invest += rem + (salary > 0 ? employerMatchPerMonth : 0)
        totalNewInvested += rem
        rem = 0
      }
    } else {
      // Balanced: capture match, pay minimums, split rest 50/50
      if (salary > 0 && matchPct > 0) {
        const contrib = Math.min(rem, minContribForMatch)
        invest += contrib + (contrib > 0 ? employerMatchPerMonth : 0)
        totalNewInvested += contrib; rem -= contrib
      }
      for (const d of pool) {
        if (d.balance <= 0) continue
        const pay = Math.min(d.minPayment, d.balance)
        d.balance -= pay; rem -= pay
      }
      if (rem > 0) {
        if (!hasDebt) {
          invest += rem; totalNewInvested += rem
        } else {
          const half = rem / 2
          invest += half; totalNewInvested += half
          let extra = half
          const sorted = pool.filter(d => d.balance > 0).sort((a, b) => b.apr - a.apr)
          for (const d of sorted) {
            if (extra <= 0) break
            const orig = pool.find(x => x.id === d.id)!
            const pay = Math.min(extra, orig.balance)
            orig.balance -= pay; extra -= pay
          }
        }
      }
    }

    const totalDebt = pool.reduce((s, d) => s + Math.max(0, d.balance), 0)
    snaps.push({ month: m, debtBalance: totalDebt, investBalance: invest, netWorth: invest - totalDebt })
  }

  const colorMap = { "debt-first": "#4ade80", "invest-first": "#60a5fa", "balanced": "#fbbf24" }
  const labelMap = { "debt-first": "Debt First", "invest-first": "Invest First", "balanced": "Balanced" }

  return {
    path, label: labelMap[path], color: colorMap[path], snaps,
    finalNetWorth: snaps[snaps.length - 1]?.netWorth ?? 0,
    debtFreeMonth,
    totalInterestPaid: totalInterest,
    totalNewInvested,
  }
}

// ─────────────────────────────────────────────────────────────
// FINANCIAL HEALTH SCORE  (0–100, A+ to F)
// ─────────────────────────────────────────────────────────────
function calcHealthScore(
  debts: DebtItem[],
  monthlyCash: number,
  salary: number,
  matchPct: number,
  emergencyMonths: number,
): HealthScore {
  const totalBal = debts.reduce((s, d) => s + d.balance, 0)
  const avgAPR = totalBal > 0 ? debts.reduce((s, d) => s + d.apr * d.balance, 0) / totalBal : 0
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0)
  const debtRatio = monthlyCash > 0 ? totalMin / (monthlyCash + totalMin) : 0

  const aprScore = avgAPR === 0 ? 25 : avgAPR < 5 ? 22 : avgAPR < 10 ? 17 : avgAPR < 15 ? 12 : avgAPR < 20 ? 7 : avgAPR < 25 ? 3 : 0
  const cashScore = debtRatio < 0.1 ? 25 : debtRatio < 0.2 ? 20 : debtRatio < 0.3 ? 14 : debtRatio < 0.4 ? 9 : debtRatio < 0.5 ? 4 : 0
  const matchScore = salary > 0 && matchPct > 0 ? 25 : salary > 0 ? 10 : 15
  const efScore = emergencyMonths >= 6 ? 25 : emergencyMonths >= 3 ? 18 : emergencyMonths >= 1 ? 8 : 0

  const items: ScoreItem[] = [
    { label: "Interest Rate Burden", score: aprScore, max: 25, detail: avgAPR === 0 ? "No debt — perfect" : `Avg APR ${avgAPR.toFixed(1)}% — ${avgAPR > 20 ? "very high, prioritize payoff" : avgAPR > 10 ? "moderate, keep reducing" : "manageable"}` },
    { label: "Cash Flow Health", score: cashScore, max: 25, detail: `${(debtRatio * 100).toFixed(0)}% of income goes to minimum payments — ${debtRatio > 0.4 ? "dangerously tight" : debtRatio > 0.25 ? "tight, reduce debt" : "healthy"}` },
    { label: "Retirement Savings", score: matchScore, max: 25, detail: salary > 0 && matchPct > 0 ? `Capturing employer match — excellent free money` : "Not capturing 401k match — you may be leaving free money on the table" },
    { label: "Emergency Fund", score: efScore, max: 25, detail: `${emergencyMonths} month${emergencyMonths !== 1 ? "s" : ""} covered — ${emergencyMonths >= 6 ? "ideal" : emergencyMonths >= 3 ? "good, aim for 6" : "build this before investing aggressively"}` },
  ]

  const total = aprScore + cashScore + matchScore + efScore
  const grade = total >= 90 ? "A+" : total >= 80 ? "A" : total >= 70 ? "B+" : total >= 60 ? "B" : total >= 50 ? "C+" : total >= 40 ? "C" : total >= 30 ? "D" : "F"
  const gradeColor = total >= 70 ? "#4ade80" : total >= 50 ? "#fbbf24" : "#f87171"

  return { total, grade, gradeColor, items }
}

// ─────────────────────────────────────────────────────────────
// LINE CHART  (SVG, 10-year net worth for 3 paths)
// ─────────────────────────────────────────────────────────────
function LineChart({ results }: { results: SimResult[] }) {
  if (!results.length) return null
  const W = 560, H = 200, PL = 62, PR = 16, PT = 24, PB = 32
  const cW = W - PL - PR, cH = H - PT - PB

  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const yearlyData = results.map(r => ({
    ...r,
    pts: [
      { y: 0, v: -r.snaps[0].debtBalance },
      ...years.slice(1).map((yr, i) => ({ y: yr, v: r.snaps[yr * 12 - 1]?.netWorth ?? 0 }))
    ]
  }))

  const allV = yearlyData.flatMap(r => r.pts.map(p => p.v))
  const minV = Math.min(...allV, 0), maxV = Math.max(...allV, 1)
  const range = maxV - minV || 1

  const tx = (yr: number) => PL + (yr / 10) * cW
  const ty = (v: number) => PT + cH - ((v - minV) / range) * cH

  // Grid ticks
  const tickStep = Math.pow(10, Math.floor(Math.log10(range / 4))) * (range / 4 > 5e5 ? 100 : range / 4 > 5e4 ? 10 : range / 4 > 5e3 ? 5 : 1)
  const ticks: number[] = []
  for (let v = Math.ceil(minV / tickStep) * tickStep; v <= maxV + tickStep * 0.1; v += tickStep) ticks.push(v)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
      {/* Grid */}
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={PL} y1={ty(v)} x2={W - PR} y2={ty(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          <text x={PL - 5} y={ty(v) + 3.5} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.25)">{fmtK(v)}</text>
        </g>
      ))}
      {/* Zero line */}
      {minV < 0 && <line x1={PL} y1={ty(0)} x2={W - PR} y2={ty(0)} stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="4,3" />}
      {/* X labels */}
      {years.map(yr => (
        <text key={yr} x={tx(yr)} y={H - 6} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.25)">
          {yr === 0 ? "Now" : `Yr ${yr}`}
        </text>
      ))}
      {/* Path lines */}
      {yearlyData.map(r => (
        <g key={r.label}>
          <polyline
            points={r.pts.map(p => `${tx(p.y)},${ty(p.v)}`).join(" ")}
            fill="none" stroke={r.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          />
          {r.pts.map((p, i) => <circle key={i} cx={tx(p.y)} cy={ty(p.v)} r={3} fill={r.color} />)}
        </g>
      ))}
      {/* Legend */}
      {results.map((r, i) => (
        <g key={r.label} transform={`translate(${PL + i * 118}, ${PT - 12})`}>
          <line x1={0} y1={5} x2={14} y2={5} stroke={r.color} strokeWidth={2.5} />
          <circle cx={7} cy={5} r={2.5} fill={r.color} />
          <text x={18} y={9} fontSize={8.5} fill="rgba(255,255,255,0.55)">{r.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// PDF GENERATION
// ─────────────────────────────────────────────────────────────
async function loadJsPDF() {
  if ((window as any).jspdf?.jsPDF) return (window as any).jspdf.jsPDF
  await new Promise<void>((res, rej) => {
    const s = document.createElement("script")
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    s.onload = () => res(); s.onerror = () => rej(new Error("jsPDF load failed"))
    document.head.appendChild(s)
  })
  return (window as any).jspdf.jsPDF
}

async function generatePDF(
  debts: DebtItem[], results: SimResult[], score: HealthScore,
  monthlyCash: number, salary: number, matchPct: number, matchRate: number,
  expectedReturn: number, taxBracket: TaxBracket, emergencyMonths: number
) {
  const JsPDF = await loadJsPDF()
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = 210, M = 16, now = new Date()
  const cW = W - M * 2

  const C = {
    navy: [15, 40, 70] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],
    greenL: [220, 252, 231] as [number, number, number],
    red: [185, 28, 28] as [number, number, number],
    amber: [146, 100, 0] as [number, number, number],
    gray1: [248, 249, 250] as [number, number, number],
    gray5: [108, 117, 125] as [number, number, number],
    gray7: [52, 58, 64] as [number, number, number],
    black: [17, 17, 17] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    border: [220, 225, 230] as [number, number, number],
  }
  const sf = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2])
  const st = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])
  const sd = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2])
  const b = (sz: number) => { doc.setFont("helvetica", "bold"); doc.setFontSize(sz) }
  const n = (sz: number) => { doc.setFont("helvetica", "normal"); doc.setFontSize(sz) }

  const addBg = () => { sf(C.white); doc.rect(0, 0, W, 297, "F") }
  addBg()

  const check = (y: number, need = 30): number => {
    if (y + need > 272) { doc.addPage(); addBg(); return 22 }
    return y
  }
  const secHead = (text: string, y: number): number => {
    sf(C.green); doc.rect(M, y, 3, 6, "F")
    b(11); st(C.navy); doc.text(text, M + 6, y + 5)
    return y + 10
  }
  const tHead = (cols: { label: string; x: number }[], y: number, rH = 7): number => {
    sf(C.navy); doc.rect(M, y, cW, rH, "F")
    b(7.5); st(C.white)
    cols.forEach(c => doc.text(c.label, c.x, y + rH * 0.68))
    return y + rH
  }
  const tRow = (cols: { text: string; x: number; color?: [number, number, number]; bold?: boolean }[], y: number, rH = 7.5, shade = false): number => {
    if (shade) { sf(C.gray1); doc.rect(M, y, cW, rH, "F") }
    sd(C.border); doc.setLineWidth(0.1); doc.line(M, y + rH, W - M, y + rH)
    cols.forEach(c => {
      c.bold ? b(8.5) : n(8.5); st(c.color || C.gray7)
      doc.text(c.text, c.x, y + rH * 0.68)
    })
    return y + rH
  }

  // ── HEADER ──
  sf(C.navy); doc.rect(0, 0, W, 38, "F")
  sf(C.green); doc.rect(0, 0, 5, 38, "F")
  b(20); st(C.white); doc.text("WealthClaude", M + 4, 16)
  n(9); st(C.greenL); doc.text("Should I Pay Off Debt or Invest? — Financial Analysis", M + 4, 24)
  n(8); st([160, 185, 210] as [number, number, number])
  doc.text(`Generated: ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, W - M, 13, { align: "right" })
  doc.text("wealthclaude.com", W - M, 21, { align: "right" })
  doc.text("Confidential — For Personal Use Only", W - M, 29, { align: "right" })

  let y = 46

  // ── HEALTH SCORE ──
  const gradeColors: Record<string, [number, number, number]> = { "A+": C.green, "A": C.green, "B+": [34, 197, 94], "B": [34, 197, 94], "C+": C.amber, "C": C.amber, "D": C.red, "F": C.red }
  const gc = gradeColors[score.grade] || C.amber
  sf(gc); doc.rect(M, y, 38, 28, "F")
  b(26); st(C.white); doc.text(score.grade, M + 19, y + 19, { align: "center" })
  n(7); st(C.white); doc.text("SCORE", M + 19, y + 25, { align: "center" })

  const bx = M + 41, bw2 = cW - 43
  n(8); st(C.gray5); doc.text(`Financial Health Score: ${score.total} / 100`, bx, y + 6)
  score.items.forEach((item, i) => {
    const by = y + 12 + i * 4.5
    const pct = item.score / item.max
    sf(C.border); doc.rect(bx, by, bw2 * 0.38, 2.5, "F")
    sf(pct >= 0.7 ? C.green : pct >= 0.4 ? C.amber : C.red); doc.rect(bx, by, bw2 * 0.38 * pct, 2.5, "F")
    n(7); st(C.gray7); doc.text(`${item.label}  ${item.score}/${item.max}`, bx + bw2 * 0.40, by + 2)
  })
  y += 34

  // ── SNAPSHOT ──
  y = secHead("Your Financial Snapshot", y)
  const snaps = [
    { l: "Monthly Cash", v: fmtUSD(monthlyCash) },
    { l: "Annual Salary", v: salary > 0 ? fmtK(salary) : "N/A" },
    { l: "401k Match", v: matchPct > 0 ? `${(matchPct * 100).toFixed(0)}% @ ${(matchRate * 100).toFixed(0)}%` : "None" },
    { l: "Expected Return", v: `${expectedReturn}% / yr` },
    { l: "Tax Bracket", v: taxBracket.label.split("—")[0].trim() },
    { l: "Emergency Fund", v: `${emergencyMonths} months` },
  ]
  const sw = (cW - 4) / 3
  snaps.forEach((s, i) => {
    const cx2 = M + (i % 3) * (sw + 2), sy = y + Math.floor(i / 3) * 13
    sf(C.gray1); doc.rect(cx2, sy, sw, 11, "F")
    sd(C.border); doc.setLineWidth(0.2); doc.rect(cx2, sy, sw, 11, "S")
    n(7); st(C.gray5); doc.text(s.l.toUpperCase(), cx2 + sw / 2, sy + 4.5, { align: "center" })
    b(9); st(C.navy); doc.text(s.v, cx2 + sw / 2, sy + 9, { align: "center" })
  })
  y += 30

  // ── DEBTS ──
  if (debts.length) {
    y = check(y, 40)
    y = secHead("Your Debts", y)
    y = tHead([{ label: "DEBT NAME", x: M + 2 }, { label: "BALANCE", x: M + 58 }, { label: "APR", x: M + 94 }, { label: "MIN PAYMENT", x: M + 120 }, { label: "INTEREST/MO", x: M + 152 }], y)
    debts.forEach((d, i) => {
      y = tRow([
        { text: d.name.slice(0, 26), x: M + 2, color: C.black, bold: true },
        { text: fmtUSD(d.balance), x: M + 58, color: C.red },
        { text: d.apr.toFixed(2) + "%", x: M + 94, color: C.amber },
        { text: fmtUSD(d.minPayment), x: M + 120, color: C.gray7 },
        { text: fmtUSD((d.apr / 100 / 12) * d.balance), x: M + 152, color: C.red },
      ], y, 7.5, i % 2 === 1)
    })
    y += 8
  }

  // ── 10-YEAR TABLE ──
  y = check(y, 65)
  y = secHead("10-Year Net Worth Projection", y)
  n(8); st(C.gray5)
  doc.text("Net worth = investment balance minus remaining debt. Assumes constant monthly allocation and fixed return.", M, y, { maxWidth: cW })
  y += 9

  const pc = [M + 2, M + 26, M + 68, M + 108, M + 148]
  y = tHead([{ label: "YEAR", x: pc[0] }, { label: "DEBT FIRST", x: pc[1] }, { label: "INVEST FIRST", x: pc[2] }, { label: "BALANCED", x: pc[3] }, { label: "BEST PATH", x: pc[4] }], y, 7)
  for (let yr = 1; yr <= 10; yr++) {
    const idx = yr * 12 - 1
    const vals = results.map(r => r.snaps[idx]?.netWorth ?? 0)
    const bi = vals.indexOf(Math.max(...vals))
    const lbls = ["Debt First", "Invest First", "Balanced"]
    y = tRow([
      { text: `Year ${yr}`, x: pc[0], color: C.navy, bold: true },
      { text: fmtK(vals[0]), x: pc[1], color: vals[0] >= 0 ? C.green : C.red },
      { text: fmtK(vals[1]), x: pc[2], color: vals[1] >= 0 ? C.green : C.red },
      { text: fmtK(vals[2]), x: pc[3], color: vals[2] >= 0 ? C.green : C.red },
      { text: lbls[bi], x: pc[4], color: C.green, bold: true },
    ], y, 7, yr % 2 === 0)
  }
  y += 8

  // ── SCORE BREAKDOWN ──
  y = check(y, 40)
  y = secHead("Financial Health Score Breakdown", y)
  score.items.forEach((item, i) => {
    y = check(y, 12)
    sf(i % 2 === 0 ? C.gray1 : C.white); doc.rect(M, y, cW, 10, "F")
    sd(C.border); doc.setLineWidth(0.1); doc.line(M, y + 10, W - M, y + 10)
    const pct = item.score / item.max
    const ic = pct >= 0.7 ? C.green : pct >= 0.4 ? C.amber : C.red
    sf(ic); doc.rect(M, y, 3, 10, "F")
    b(8.5); st(C.navy); doc.text(item.label, M + 6, y + 4.2)
    n(7.5); st(C.gray5); doc.text(item.detail, M + 6, y + 8)
    b(9); st(ic); doc.text(`${item.score}/${item.max}`, W - M - 2, y + 5.5, { align: "right" })
    y += 10
  })
  y += 8

  // ── RECOMMENDATION ──
  y = check(y, 50)
  y = secHead("Personalized Recommendation", y)
  const best = results.reduce((a, b2) => a.finalNetWorth > b2.finalNetWorth ? a : b2)
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const avgAPR2 = totalDebt > 0 ? debts.reduce((s, d) => s + d.apr * d.balance, 0) / totalDebt : 0
  const recs = [
    `Best 10-year path: ${best.label} — projected net worth ${fmtK(best.finalNetWorth)} vs starting point.`,
    matchPct > 0 && salary > 0 ? `Capture your full 401k match: contribute ${fmtUSD(matchPct * salary / 12)}/mo to receive ${fmtUSD(matchPct * matchRate * salary / 12)}/mo free from your employer.` : "Consider enrolling in employer 401k if available. Matching contributions are the highest guaranteed return available.",
    avgAPR2 > 7 ? `Average APR of ${avgAPR2.toFixed(1)}% likely exceeds market returns. Pay high-APR debt first while investing just enough for the 401k match.` : `Average APR of ${avgAPR2.toFixed(1)}% is below typical market returns of ${expectedReturn}%. Investing while paying minimums may be mathematically optimal.`,
    emergencyMonths < 3 ? "Build a 3-month emergency fund before accelerating investments. Without it, unexpected expenses force you back into high-APR debt." : "Emergency fund looks solid. Allocate extra cash toward your chosen strategy consistently.",
  ]
  recs.forEach((rec, i) => {
    y = check(y, 14)
    sf(i % 2 === 0 ? C.gray1 : C.white); doc.rect(M, y, cW, 12, "F")
    sd(C.border); doc.setLineWidth(0.1); doc.line(M, y + 12, W - M, y + 12)
    sf(C.green); doc.circle(M + 5, y + 6, 3.5, "F")
    b(8); st(C.white); doc.text(`${i + 1}`, M + 5, y + 8, { align: "center" })
    n(8); st(C.gray7); doc.text(rec, M + 12, y + 7.5, { maxWidth: cW - 14 })
    y += 12
  })
  y += 8

  // ── DISCLAIMER ──
  y = check(y, 18)
  sf([255, 250, 235] as [number, number, number]); doc.rect(M, y, cW, 14, "F")
  sd([203, 145, 0] as [number, number, number]); doc.setLineWidth(0.3); doc.rect(M, y, cW, 14, "S")
  sf([203, 145, 0] as [number, number, number]); doc.rect(M, y, 3, 14, "F")
  b(8); st([146, 100, 0] as [number, number, number]); doc.text("Disclaimer", M + 7, y + 5)
  n(7); st(C.gray7)
  doc.text("This analysis is for informational purposes only. Projections assume constant returns and may not reflect actual market conditions.", M + 7, y + 9.5, { maxWidth: cW - 10 })
  doc.text("Please consult a certified financial advisor before making investment or debt decisions.", M + 7, y + 13, { maxWidth: cW - 10 })

  // ── FOOTER ──
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    sf(C.navy); doc.rect(0, 283, W, 14, "F")
    sf(C.green); doc.rect(0, 283, W, 1.5, "F")
    b(8); st(C.white); doc.text("WealthClaude", M, 291)
    n(7.5); st([140, 165, 190] as [number, number, number])
    doc.text("Debt vs. Invest Analysis  |  wealthclaude.com", W / 2, 291, { align: "center" })
    doc.text(`Page ${p} of ${pages}`, W - M, 291, { align: "right" })
  }

  doc.save(`WealthClaude-DebtVsInvest-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.pdf`)
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function DebtVsInvestPage() {
  const [debts, setDebts] = useState<DebtItem[]>([
    { id: 1, name: "Credit Card", balance: 8500, apr: 22.99, minPayment: 255 },
    { id: 2, name: "Car Loan", balance: 12000, apr: 6.5, minPayment: 320 },
  ])
  const [newDebt, setNewDebt] = useState<Omit<DebtItem, "id">>({ name: "", balance: 0, apr: 0, minPayment: 0 })
  const [nextId, setNextId] = useState(3)
  const [monthlyCash, setMonthlyCash] = useState(1200)
  const [salary, setSalary] = useState(75000)
  const [matchPct, setMatchPct] = useState(0.05)
  const [matchRate, setMatchRate] = useState(0.5)
  const [expectedReturn, setReturn] = useState(7)
  const [currentInvest, setInvest] = useState(5000)
  const [taxBracketIdx, setTaxIdx] = useState(2)
  const [emergencyMonths, setEmergency] = useState(2)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const taxBracket = TAX_BRACKETS[taxBracketIdx]
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0)
  const avgAPR = totalDebt > 0 ? debts.reduce((s, d) => s + d.apr * d.balance, 0) / totalDebt : 0

  const results = useMemo(() =>
    (["debt-first", "invest-first", "balanced"] as const).map(path =>
      simulate(debts, monthlyCash, salary, matchPct, matchRate, expectedReturn, currentInvest, path)
    ), [debts, monthlyCash, salary, matchPct, matchRate, expectedReturn, currentInvest])

  const score = useMemo(() =>
    calcHealthScore(debts, monthlyCash, salary, matchPct, emergencyMonths),
    [debts, monthlyCash, salary, matchPct, emergencyMonths])

  const bestResult = results.reduce((a, b) => a.finalNetWorth > b.finalNetWorth ? a : b)

  const addDebt = () => {
    if (!newDebt.balance) return
    setDebts(p => [...p, { ...newDebt, id: nextId, name: newDebt.name || `Debt ${nextId}` }])
    setNextId(n => n + 1)
    setNewDebt({ name: "", balance: 0, apr: 0, minPayment: 0 })
  }

  const inputCls = "bg-[#0f1117] border border-white/10 rounded-xl py-2.5 text-sm text-white outline-none focus:border-primary/60 transition-colors px-3 w-full placeholder-white/25"

  const gradeTextColor = score.total >= 70 ? "text-primary" : score.total >= 50 ? "text-amber-400" : "text-red-400"
  const gradeBorderColor = score.total >= 70 ? "border-primary/30" : score.total >= 50 ? "border-amber-400/30" : "border-red-400/30"
  const gradeBgColor = score.total >= 70 ? "bg-primary/5" : score.total >= 50 ? "bg-amber-400/5" : "bg-red-400/5"

  const FAQS = [
    { q: "Should I always pay debt before investing?", a: "Not always. Compare your debt APR to your expected investment return. A 22% credit card APR means paying it off is a guaranteed 22% return — better than almost any investment. But a 4% car loan might be worth carrying while your portfolio compounds at 7-10%." },
    { q: "Why does 401k match always come first?", a: "If your employer matches 50 cents per dollar up to 5% of salary, that's an instant 50% guaranteed return on those dollars — nothing in the market beats it. Always capture the full match before paying extra on debt or investing elsewhere." },
    { q: "How is the 10-year projection calculated?", a: "We simulate month-by-month for 120 months. Each path allocates your monthly cash differently. Debt First: capture 401k match, then aggressively pay debt, then invest everything once debt-free. Invest First: pay minimums and invest everything else. Balanced: match + split remaining 50/50. Net worth = investments minus remaining debt at each point." },
    { q: "What is the Financial Health Score?", a: "A 0–100 score across 4 factors: interest rate burden (are APRs high?), cash flow health (what % of income is minimum payments?), retirement participation (capturing 401k match?), and emergency fund coverage. Grade A+ to F." },
    { q: "What expected return should I use?", a: "The S&P 500 has returned roughly 10% historically before inflation, ~7% after. For a diversified portfolio, 6–8% is a reasonable assumption. Conservative investors use 5–6%, aggressive use 8–10%. The default is 7%." },
    { q: "Is my data private?", a: "Yes — everything runs 100% in your browser. No data is sent to any server. Nothing is stored except temporarily in your browser session." },
  ]

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col text-white">
      <Header />
      <main className="pt-16 flex-1">

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-8 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            Free Tool — 100% Private, Runs In Your Browser
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Should I Pay Off Debt<br /><span className="text-primary">or Invest?</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
            Enter your debts, income, and investments. Get a personalized financial health score, a side-by-side 10-year net worth projection, and a clear recommendation — free, no signup.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {[{ icon: "🧮", t: "10-Year Projection" }, { icon: "🏆", t: "Health Score A–F" }, { icon: "💡", t: "Smart Recommendation" }, { icon: "📥", t: "PDF Export" }, { icon: "🔒", t: "100% Private" }].map(f => (
              <div key={f.t} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
                <span>{f.icon}</span><span className="text-white/60">{f.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-5">

          {/* ── INPUT GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* LEFT: Debts */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">Your Debts</div>
              </div>
              <div className="p-5 space-y-4">
                {/* Add form */}
                <div className="rounded-xl border border-white/8 bg-[#0f1117] p-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Add a Debt</div>
                  <input type="text" placeholder="Name (e.g. Chase Visa, Car Loan)" value={newDebt.name}
                    onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addDebt()} className={inputCls} />
                  <div className="grid grid-cols-3 gap-2">
                    {[{ l: "Balance ($)", f: "balance", ph: "5000" }, { l: "APR (%)", f: "apr", ph: "19.99" }, { l: "Min Pay ($)", f: "minPayment", ph: "150" }].map(f => (
                      <div key={f.f}>
                        <label className="text-[10px] text-white/30 block mb-1">{f.l}</label>
                        <input type="number" placeholder={f.ph} value={(newDebt as any)[f.f] || ""}
                          onChange={e => setNewDebt(p => ({ ...p, [f.f]: +e.target.value || 0 }))}
                          onKeyDown={e => e.key === "Enter" && addDebt()} className={inputCls} />
                      </div>
                    ))}
                  </div>
                  <button onClick={addDebt} className="w-full rounded-xl bg-primary text-black font-bold py-2.5 text-sm hover:opacity-90 transition-all">+ Add Debt</button>
                </div>

                {/* Debt cards */}
                {debts.map((d, i) => (
                  <div key={d.id} className="rounded-xl border border-white/8 bg-white/2 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <input type="text" value={d.name} onChange={e => setDebts(p => p.map(x => x.id === d.id ? { ...x, name: e.target.value } : x))} className="bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent focus:border-primary/40 w-36" />
                      </div>
                      <button onClick={() => setDebts(p => p.filter(x => x.id !== d.id))} className="text-white/20 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-white/30 mb-0.5">Balance</div>
                        <div className="flex items-center"><span className="text-white/30 mr-1 text-xs">$</span><input type="number" value={d.balance} onChange={e => setDebts(p => p.map(x => x.id === d.id ? { ...x, balance: +e.target.value || 0 } : x))} className="bg-transparent text-red-400 font-semibold outline-none w-20 tabular-nums border-b border-transparent focus:border-red-400/40" /></div>
                      </div>
                      <div>
                        <div className="text-white/30 mb-0.5">APR</div>
                        <div className="flex items-center"><input type="number" value={d.apr} step="0.01" onChange={e => setDebts(p => p.map(x => x.id === d.id ? { ...x, apr: +e.target.value || 0 } : x))} className="bg-transparent text-amber-400 font-semibold outline-none w-14 tabular-nums border-b border-transparent focus:border-amber-400/40" /><span className="text-white/30 ml-0.5">%</span></div>
                      </div>
                      <div>
                        <div className="text-white/30 mb-0.5">Min Pay</div>
                        <div className="flex items-center"><span className="text-white/30 mr-1 text-xs">$</span><input type="number" value={d.minPayment} onChange={e => setDebts(p => p.map(x => x.id === d.id ? { ...x, minPayment: +e.target.value || 0 } : x))} className="bg-transparent text-white outline-none w-16 tabular-nums border-b border-transparent focus:border-primary/40" /></div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/6 flex justify-between text-[10px]">
                      <span className="text-white/30">Monthly interest</span>
                      <span className="text-red-400 font-semibold">{fmtUSD((d.apr / 100 / 12) * d.balance)}</span>
                    </div>
                  </div>
                ))}

                {debts.length === 0 && <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-white/25 text-sm">No debts — you're ahead of the game!</div>}

                {debts.length > 0 && (
                  <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div><div className="text-white/40 mb-0.5">Total Debt</div><div className="font-bold text-red-400">{fmtK(totalDebt)}</div></div>
                    <div><div className="text-white/40 mb-0.5">Avg APR</div><div className="font-bold text-amber-400">{avgAPR.toFixed(1)}%</div></div>
                    <div><div className="text-white/40 mb-0.5">Min/mo</div><div className="font-bold text-white">{fmtUSD(totalMin)}</div></div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Financial details */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">Your Financial Details</div>
              </div>
              <div className="p-5 space-y-5">

                {/* Monthly cash */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Monthly Cash to Allocate (after fixed expenses)</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={100} max={10000} step={50} value={monthlyCash} onChange={e => setMonthlyCash(+e.target.value)} className="flex-1 accent-primary" />
                    <div className="relative w-28"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span><input type="number" value={monthlyCash} onChange={e => setMonthlyCash(+e.target.value || 0)} className="bg-[#0f1117] border border-white/10 rounded-lg py-2 pl-6 pr-3 text-sm text-primary font-bold outline-none w-full" /></div>
                  </div>
                  {monthlyCash < totalMin && <div className="mt-1.5 text-[10px] text-red-400">Warning: minimum payments ({fmtUSD(totalMin)}) exceed your monthly cash — increase cash available or reduce minimums.</div>}
                </div>

                {/* 401k */}
                <div className="rounded-xl border border-white/8 bg-[#0f1117] p-4 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Income & 401k Match</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "Annual Salary", v: salary, set: setSalary, prefix: "$", suffix: "" },
                      { l: "Current Invest Balance", v: currentInvest, set: setInvest, prefix: "$", suffix: "" },
                      { l: "You Contribute (%)", v: matchPct * 100, set: (v: number) => setMatchPct(v / 100), prefix: "", suffix: "%", step: "0.5" },
                      { l: "Employer Match Rate (%)", v: matchRate * 100, set: (v: number) => setMatchRate(v / 100), prefix: "", suffix: "%", step: "5" },
                    ].map(f => (
                      <div key={f.l}>
                        <label className="text-[10px] text-white/30 block mb-1">{f.l}</label>
                        <div className="relative">
                          {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{f.prefix}</span>}
                          <input type="number" value={f.v} step={(f as any).step || "1"} onChange={e => f.set(+e.target.value || 0)} className={inputCls + (f.prefix ? " pl-6" : "") + (f.suffix ? " pr-6" : "")} />
                          {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{f.suffix}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {salary > 0 && matchPct > 0 && (
                    <div className="rounded-lg bg-primary/8 border border-primary/20 px-3 py-2 text-xs text-primary">
                      Employer adds <strong>{fmtUSD(matchPct * matchRate * salary / 12)}/mo</strong> free when you contribute {fmtUSD(matchPct * salary / 12)}/mo — always do this first.
                    </div>
                  )}
                </div>

                {/* Return + emergency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Expected Annual Return</label>
                    <div className="flex items-center gap-2 mb-1">
                      <input type="range" min={1} max={15} step={0.5} value={expectedReturn} onChange={e => setReturn(+e.target.value)} className="flex-1 accent-primary" />
                      <span className="text-primary font-bold text-sm w-10 text-right">{expectedReturn}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-white/20"><span>4% safe</span><span>12% aggressive</span></div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Emergency Fund</label>
                    <div className="flex items-center gap-2 mb-1">
                      <input type="range" min={0} max={12} step={0.5} value={emergencyMonths} onChange={e => setEmergency(+e.target.value)} className="flex-1 accent-primary" />
                      <span className={`font-bold text-sm w-10 text-right ${emergencyMonths >= 6 ? "text-primary" : emergencyMonths >= 3 ? "text-amber-400" : "text-red-400"}`}>{emergencyMonths}mo</span>
                    </div>
                    <div className="text-[10px] text-white/20">Months of expenses covered</div>
                  </div>
                </div>

                {/* Tax bracket */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Federal Tax Bracket</label>
                  <select value={taxBracketIdx} onChange={e => setTaxIdx(+e.target.value)} className={inputCls}>
                    {TAX_BRACKETS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── FINANCIAL HEALTH SCORE ── */}
          <div className={`rounded-2xl border ${gradeBorderColor} ${gradeBgColor} p-6`}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-5">Financial Health Score</div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {/* Grade */}
              <div className="shrink-0 text-center min-w-[100px]">
                <div className={`text-8xl font-extrabold leading-none tabular-nums ${gradeTextColor}`} style={{ textShadow: `0 0 40px currentColor` }}>{score.grade}</div>
                <div className={`text-2xl font-bold ${gradeTextColor} mt-2 tabular-nums`}>{score.total}<span className="text-sm text-white/30 font-normal">/100</span></div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Overall Score</div>
              </div>
              {/* Bars */}
              <div className="flex-1 space-y-4 min-w-0 w-full">
                {score.items.map((item, i) => {
                  const pct = item.score / item.max
                  const c = pct >= 0.7 ? "bg-primary text-primary" : pct >= 0.4 ? "bg-amber-400 text-amber-400" : "bg-red-400 text-red-400"
                  const tc = pct >= 0.7 ? "text-primary" : pct >= 0.4 ? "text-amber-400" : "text-red-400"
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-white/70">{item.label}</span>
                        <span className={`text-xs font-bold tabular-nums ${tc}`}>{item.score}/{item.max}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-1">
                        <div className={`h-full rounded-full transition-all duration-700 ${c.split(" ")[0]}`} style={{ width: `${pct * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-white/30 leading-relaxed">{item.detail}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── 10-YEAR PROJECTION ── */}
          <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8">
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-0.5">10-Year Net Worth Projection</div>
              <div className="text-[11px] text-white/25">Net worth = investment balance minus remaining debt · assumes consistent monthly allocation</div>
            </div>

            {/* Chart */}
            <div className="px-5 pt-5 pb-2">
              <LineChart results={results} />
            </div>

            {/* Summary cards */}
            <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {results.map(r => {
                const isBest = r.label === bestResult.label
                return (
                  <div key={r.label} className={`rounded-xl border p-4 transition-all ${isBest ? "border-primary/30 bg-primary/5" : "border-white/8 bg-white/2"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-4 h-1.5 rounded-full shrink-0" style={{ background: r.color }} />
                      <span className={`text-sm font-bold ${isBest ? "text-primary" : "text-white"}`}>{r.label}</span>
                      {isBest && <span className="ml-auto text-[10px] font-bold text-primary bg-primary/15 rounded-full px-2 py-0.5">Best</span>}
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-white/40">10yr Net Worth</span><span className={`font-bold tabular-nums ${r.finalNetWorth >= 0 ? "text-primary" : "text-red-400"}`}>{fmtK(r.finalNetWorth)}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Debt-Free</span><span className="text-white">{r.debtFreeMonth > 120 ? "Not in 10yr" : r.debtFreeMonth <= 0 ? "Already debt-free" : `Month ${r.debtFreeMonth}`}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">Interest Paid</span><span className="text-red-400 tabular-nums">{fmtK(r.totalInterestPaid)}</span></div>
                      <div className="flex justify-between"><span className="text-white/40">New Invested</span><span className="text-primary tabular-nums">{fmtK(r.totalNewInvested)}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Year-by-year table */}
            <div className="px-6 pb-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Year-by-Year Breakdown</div>
              <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full text-xs">
                  <thead className="bg-white/3">
                    <tr>
                      <th className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">Year</th>
                      {results.map(r => <th key={r.label} style={{ color: r.color }} className="text-left px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">{r.label}</th>)}
                      <th className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((yr, i) => {
                      const idx = yr * 12 - 1
                      const vals = results.map(r => r.snaps[idx]?.netWorth ?? 0)
                      const bi = vals.indexOf(Math.max(...vals))
                      return (
                        <tr key={yr} className={`border-t border-white/5 ${i % 2 === 1 ? "bg-white/2" : ""}`}>
                          <td className="px-4 py-2.5 font-semibold text-white">Year {yr}</td>
                          {vals.map((v, j) => (
                            <td key={j} className={`px-4 py-2.5 tabular-nums font-semibold ${j === bi ? "" : "opacity-60"} ${v >= 0 ? "text-primary" : "text-red-400"}`}>{fmtK(v)}</td>
                          ))}
                          <td className="px-4 py-2.5 text-primary font-bold text-xs">{results[bi].label}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── RECOMMENDATION + PDF ── */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
              Your Personalized Recommendation
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-6">
              <span className="text-primary">{bestResult.label}</span> gives the best 10-year outcome — projected net worth of <span className="text-primary">{fmtK(bestResult.finalNetWorth)}</span>
            </div>
            <div className="space-y-3 mb-6">
              {[
                salary > 0 && matchPct > 0
                  ? { n: "1", text: `Capture your full 401k match. Contribute ${fmtUSD(matchPct * salary / 12)}/mo to receive ${fmtUSD(matchPct * matchRate * salary / 12)}/mo free from your employer — an instant ${(matchRate * 100).toFixed(0)}% return.`, hi: true }
                  : { n: "1", text: "Consider enrolling in your employer 401k. Matching contributions are the highest guaranteed return available anywhere.", hi: false },
                avgAPR > 7
                  ? { n: "2", text: `Your average APR of ${avgAPR.toFixed(1)}% likely exceeds market returns. Use the Avalanche method — pay highest-APR debt first while keeping minimums on the rest.`, hi: false }
                  : { n: "2", text: `Your average APR of ${avgAPR.toFixed(1)}% is below the expected market return of ${expectedReturn}%. Mathematically, investing may beat aggressive debt payoff here.`, hi: false },
                emergencyMonths < 3
                  ? { n: "3", text: "Build a 3-month emergency fund before accelerating investments or extra debt payments. Without it, unexpected expenses go right back onto your credit card.", hi: false }
                  : { n: "3", text: "Your emergency fund is solid. You can allocate confidently without worrying about one unexpected expense derailing your plan.", hi: false },
                { n: "4", text: `After the above: put ${fmtUSD(monthlyCash)}/month into the ${bestResult.label} strategy. In 10 years, your projected net worth is ${fmtK(bestResult.finalNetWorth)}.`, hi: true },
              ].map((step, i) => (
                <div key={i} className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 ${step.hi ? "border-primary/20 bg-primary/5" : "border-white/8 bg-white/2"}`}>
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.hi ? "bg-primary text-black" : "bg-white/10 text-white/50"}`}>{step.n}</span>
                  <span className="text-sm text-white/70 leading-relaxed">{step.text}</span>
                </div>
              ))}
            </div>

            {/* PDF */}
            <div className="pt-5 border-t border-white/10">
              <button
                onClick={async () => {
                  setPdfLoading(true)
                  try { await generatePDF(debts, results, score, monthlyCash, salary, matchPct, matchRate, expectedReturn, taxBracket, emergencyMonths) }
                  catch (e) { alert("PDF generation failed. Please try again.") }
                  setPdfLoading(false)
                }}
                disabled={pdfLoading}
                className="w-full rounded-xl bg-white/8 border border-white/15 hover:bg-white/12 hover:border-primary/40 text-white font-bold py-3.5 text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50 group">
                {pdfLoading
                  ? <><span className="animate-spin">⏳</span> Generating PDF…</>
                  : <><span className="group-hover:scale-110 transition-transform">📥</span> Download Financial Analysis PDF <span className="text-white/30 text-xs font-normal">— WealthClaude branded</span></>}
              </button>
              <div className="text-center text-[10px] text-white/25 mt-2">Includes health score · debt summary · 10-year projection · recommendations</div>
            </div>
          </div>

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

          <div className="text-center pt-2 space-x-4">
            <Link href="/tools/credit-card-debt-calculator" className="text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2">Credit Card Debt Calculator →</Link>
            <Link href="/careers" className="text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2">Join WealthClaude →</Link>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
