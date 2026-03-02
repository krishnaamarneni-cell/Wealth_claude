"use client"

import { useState, useEffect, useRef } from "react"
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
  months: number
  totalInterest: number
  totalCost: number
  schedule: { month: number; balance: number; payment: number; interest: number }[]
}

// ─────────────────────────────────────────────────────────────
// REGEX-BASED STATEMENT PARSER  (no API, no backend)
// Works on raw text extracted from PDF / DOCX / CSV / TXT
// ─────────────────────────────────────────────────────────────
function extractFromText(text: string, fileName: string): Card[] {
  // ── Balance ────────────────────────────────────────────────
  const balancePatterns = [
    /new\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /current\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /statement\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /total\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /ending\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /closing\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
    /amount\s+owed[:\s]+\$?([\d,]+\.?\d*)/i,
    /balance\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /outstanding\s+balance[:\s]+\$?([\d,]+\.?\d*)/i,
  ]

  // ── APR ────────────────────────────────────────────────────
  const aprPatterns = [
    /purchases?\s+([\d.]+)%/i,
    /purchase\s+apr[:\s]+([\d.]+)%/i,
    /purchase\s+rate[:\s]+([\d.]+)%/i,
    /annual\s+percentage\s+rate.*?purchases.*?([\d.]+)%/is,
    /variable\s+apr[:\s]+([\d.]+)%/i,
    /([\d.]+)%\s*\(v\)/i,
    /([\d.]+)%\s*variable/i,
    /interest\s+rate[:\s]+([\d.]+)%/i,
    /periodic\s+rate.*?([\d.]+)%/i,
    /apr[:\s]+([\d.]+)%/i,
  ]

  // ── Minimum payment ────────────────────────────────────────
  const minPatterns = [
    /minimum\s+payment\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /minimum\s+payment[:\s]+\$?([\d,]+\.?\d*)/i,
    /min(?:imum)?\s+payment\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /min(?:imum)?\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /required\s+payment[:\s]+\$?([\d,]+\.?\d*)/i,
    /amount\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
    /payment\s+due[:\s]+\$?([\d,]+\.?\d*)/i,
  ]

  function tryPatterns(patterns: RegExp[], src: string): string | null {
    for (const p of patterns) {
      const m = src.match(p)
      if (m) return m[1].replace(/,/g, "").trim()
    }
    return null
  }

  const balanceStr = tryPatterns(balancePatterns, text)
  const aprStr = tryPatterns(aprPatterns, text)
  const minStr = tryPatterns(minPatterns, text)

  const balance = balanceStr ? parseFloat(balanceStr) : 0
  const apr = aprStr ? parseFloat(aprStr) : 0
  const minPayment = minStr ? parseFloat(minStr) : Math.max(25, balance * 0.02)

  if (balance <= 0) return []

  // ── Card name ──────────────────────────────────────────────
  const cardNamePatterns = [
    /\b(chase\s+freedom\s+unlimited)\b/i,
    /\b(chase\s+freedom\s+flex)\b/i,
    /\b(chase\s+sapphire\s+(?:preferred|reserve))\b/i,
    /\b(chase\s+slate\s*\w*)\b/i,
    /\b(chase\s+\w+(?:\s+\w+)?)\b/i,
    /\b(citi(?:bank)?\s+\w+(?:\s+\w+)?)\b/i,
    /\b(american\s+express\s+\w+(?:\s+\w+)?)\b/i,
    /\b(amex\s+\w+(?:\s+\w+)?)\b/i,
    /\b(capital\s+one\s+\w+(?:\s+\w+)?)\b/i,
    /\b(discover\s+(?:it|chrome|miles|more)?\s*\w*)\b/i,
    /\b(bank\s+of\s+america\s+\w+(?:\s+\w+)?)\b/i,
    /\b(wells\s+fargo\s+\w+(?:\s+\w+)?)\b/i,
    /\b(synchrony\s+\w+(?:\s+\w+)?)\b/i,
    /\b(barclays\s+\w+(?:\s+\w+)?)\b/i,
    /\b(us\s+bank\s+\w+(?:\s+\w+)?)\b/i,
    /\b(td\s+bank\s+\w+(?:\s+\w+)?)\b/i,
    /xxxx\s+xxxx\s+xxxx\s+(\d{4})/i,
    /ending\s+in\s+(\d{4})/i,
    /account\s+number[:\s]+[x\s]+(\d{4})/i,
  ]

  let cardName = tryPatterns(cardNamePatterns, text)

  // If only last-4 digits found, prepend detected issuer
  if (cardName && /^\d{4}$/.test(cardName)) {
    const issuer =
      /chase/i.test(text) ? "Chase" :
        /citi/i.test(text) ? "Citi" :
          /american\s*express|amex/i.test(text) ? "Amex" :
            /discover/i.test(text) ? "Discover" :
              /capital\s*one/i.test(text) ? "Capital One" :
                /bank\s*of\s*america/i.test(text) ? "Bank of America" :
                  /wells\s*fargo/i.test(text) ? "Wells Fargo" :
                    /synchrony/i.test(text) ? "Synchrony" :
                      "Card"
    cardName = `${issuer} ····${cardName}`
  }

  // Fallback: derive from filename
  if (!cardName || cardName.length < 3) {
    const base = fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[-_\d]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    cardName = base.length > 2 ? base : "Imported Card"
  }

  // Title-case
  cardName = cardName
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .slice(0, 40)

  return [{ id: Date.now(), name: cardName, balance, apr, minPayment }]
}

// ── CSV parser ─────────────────────────────────────────────
function parseCSV(text: string): Card[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""))
  const ci = (name: string) => headers.findIndex(h => h.includes(name))
  const nameIdx = ci("name"), balIdx = ci("balance"), aprIdx = ci("apr"), minIdx = ci("min")
  if (balIdx === -1) return []
  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ""))
    const balance = parseFloat(cols[balIdx]) || 0
    return {
      id: Date.now() + i,
      name: nameIdx !== -1 ? (cols[nameIdx] || `Card ${i + 1}`) : `Card ${i + 1}`,
      balance,
      apr: aprIdx !== -1 ? parseFloat(cols[aprIdx]) || 0 : 0,
      minPayment: minIdx !== -1 ? parseFloat(cols[minIdx]) || Math.max(25, balance * 0.02) : Math.max(25, balance * 0.02),
    }
  }).filter(c => c.balance > 0)
}

// ── Payoff simulator ───────────────────────────────────────
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
    let remaining = budget, monthInterest = 0, monthPayment = 0
    for (const c of pool) { if (c.balance <= 0) continue; const int = (c.apr / 100 / 12) * c.balance; c.balance += int; monthInterest += int }
    for (const c of pool) { if (c.balance <= 0) continue; const pay = Math.min(c.minPayment, c.balance); c.balance -= pay; remaining -= pay; monthPayment += pay }
    for (const c of pool) { if (c.balance <= 0 || remaining <= 0) continue; const pay = Math.min(remaining, c.balance); c.balance -= pay; remaining -= pay; monthPayment += pay }
    totalInterest += monthInterest
    schedule.push({ month, balance: pool.reduce((s, c) => s + Math.max(0, c.balance), 0), payment: monthPayment, interest: monthInterest })
  }
  return { strategy, months: month, totalInterest, totalCost: cards.reduce((s, c) => s + c.balance, 0) + totalInterest, schedule }
}

// ── Format helpers ─────────────────────────────────────────
const fmtUSD = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtK = (n: number) => n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(1) + "K" : fmtUSD(n)
const fmtMo = (n: number) => { const y = Math.floor(n / 12), m = n % 12; return y === 0 ? `${m}mo` : m === 0 ? `${y}yr` : `${y}yr ${m}mo` }

// ── Colors ─────────────────────────────────────────────────
const COLORS = ["#4ade80", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#34d399", "#fb923c", "#e879f9", "#38bdf8", "#a3e635"]

// ── Pie Chart ──────────────────────────────────────────────
function PieChart({ cards, highlighted, onHighlight }: { cards: Card[]; highlighted: number | null; onHighlight: (id: number | null) => void }) {
  const total = cards.reduce((s, c) => s + c.balance, 0)
  if (!total) return <div className="h-48 flex items-center justify-center text-white/30 text-sm">Add cards to see chart</div>
  let angle = -Math.PI / 2
  const slices = cards.map((c, i) => {
    const pct = c.balance / total, sweep = pct * 2 * Math.PI
    const s = { id: c.id, name: c.name, value: c.balance, pct: pct * 100, color: COLORS[i % COLORS.length], start: angle, end: angle + sweep }
    angle += sweep; return s
  })
  const cx = 130, cy = 130, r = 100, ir = 55
  const arc = (s: typeof slices[0], expand = false) => {
    const off = expand ? 8 : 0, mid = (s.start + s.end) / 2
    const ox = off * Math.cos(mid), oy = off * Math.sin(mid)
    const x1 = cx + ox + r * Math.cos(s.start), y1 = cy + oy + r * Math.sin(s.start)
    const x2 = cx + ox + r * Math.cos(s.end), y2 = cy + oy + r * Math.sin(s.end)
    const ix1 = cx + ox + ir * Math.cos(s.end), iy1 = cy + oy + ir * Math.sin(s.end)
    const ix2 = cx + ox + ir * Math.cos(s.start), iy2 = cy + oy + ir * Math.sin(s.start)
    const lg = s.end - s.start > Math.PI ? 1 : 0
    return `M${x1},${y1} A${r},${r},0,${lg},1,${x2},${y2} L${ix1},${iy1} A${ir},${ir},0,${lg},0,${ix2},${iy2} Z`
  }
  const hov = highlighted !== null ? slices.find(s => s.id === highlighted) : null
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="260" height="260" viewBox="0 0 260 260" className="shrink-0">
        {slices.map(s => (
          <path key={s.id} d={arc(s, highlighted === s.id)} fill={s.color}
            fillOpacity={highlighted !== null && highlighted !== s.id ? 0.3 : 1}
            stroke="#0f1117" strokeWidth={2} style={{ cursor: "pointer", transition: "all 0.18s" }}
            onMouseEnter={() => onHighlight(s.id)} onMouseLeave={() => onHighlight(null)}
            onClick={() => onHighlight(highlighted === s.id ? null : s.id)} />
        ))}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="inherit">{hov ? hov.name.slice(0, 14) : "Total Debt"}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={hov ? hov.color : "#4ade80"} fontSize="15" fontWeight="700" fontFamily="inherit">{hov ? fmtK(hov.value) : fmtK(total)}</text>
        <text x={cx} y={cy + 28} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="inherit">{hov ? hov.pct.toFixed(1) + "%" : `${cards.length} card${cards.length > 1 ? "s" : ""}`}</text>
      </svg>
      <div className="flex flex-col gap-2 min-w-0">
        {slices.map(s => (
          <div key={s.id} className="flex items-center gap-2 cursor-pointer group"
            onMouseEnter={() => onHighlight(s.id)} onMouseLeave={() => onHighlight(null)} onClick={() => onHighlight(highlighted === s.id ? null : s.id)}>
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

// ── File helpers ───────────────────────────────────────────
const readAsText = (file: File): Promise<string> =>
  new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error("Read failed")); r.readAsText(file) })

async function extractPDFText(file: File): Promise<string> {
  // Lazy-load pdf.js from CDN (no npm install needed)
  if (!(window as any).pdfjsLib) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script")
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
      s.onload = () => res(); s.onerror = () => rej(new Error("pdf.js failed to load"))
      document.head.appendChild(s)
    })
      ; (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
  }
  const lib = (window as any).pdfjsLib
  const buf = await file.arrayBuffer()
  const pdf = await lib.getDocument({ data: buf }).promise
  let text = ""
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it: any) => it.str).join(" ") + "\n"
  }
  return text
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const buf = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buf })
  return result.value
}

async function extractExcelText(file: File): Promise<string> {
  try {
    const XLSX = (await import("xlsx" as any)) as any
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: "array" })
    return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
  } catch {
    return await readAsText(file)
  }
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
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { try { const s = localStorage.getItem("wc_cc2"); if (s) setCards(JSON.parse(s)) } catch { } }, [])
  useEffect(() => { try { localStorage.setItem("wc_cc2", JSON.stringify(cards)) } catch { } }, [cards])
  useEffect(() => {
    if (!cards.length) { setPayoffs([]); return }
    setPayoffs(["snowball", "avalanche", "custom"].map(s => simulatePayoff(cards, s as Strategy, extra)))
  }, [cards, extra])

  const totalDebt = cards.reduce((s, c) => s + c.balance, 0)
  const totalMin = cards.reduce((s, c) => s + c.minPayment, 0)
  const monthlyInt = cards.reduce((s, c) => s + (c.apr / 100 / 12) * c.balance, 0)
  const avgAPR = totalDebt > 0 ? cards.reduce((s, c) => s + c.apr * c.balance, 0) / totalDebt : 0

  const addCard = () => {
    if (!newCard.balance) return
    setCards(p => [...p, { ...newCard, id: nextId, name: newCard.name || `Card ${nextId}` }])
    setNextId(n => n + 1)
    setNewCard({ name: "", balance: 0, apr: 0, minPayment: 0 })
  }
  const removeCard = (id: number) => setCards(p => p.filter(c => c.id !== id))
  const updateCard = (id: number, field: keyof Omit<Card, "id">, val: string | number) =>
    setCards(p => p.map(c => c.id === id ? { ...c, [field]: val } : c))

  // ── Process uploaded files ─────────────────────────────────
  async function processFiles(files: FileList | File[]) {
    const arr = Array.from(files)
    if (!arr.length) return
    setParseStatus("loading")
    setParseMsg(`Reading ${arr.length} file${arr.length > 1 ? "s" : ""}…`)
    setPreview([]); setFileResults([])

    const results: FileResult[] = []

    for (const file of arr) {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      let extracted: Card[] = []
      let msg = ""

      try {
        if (ext === "csv" || ext === "tsv") {
          const text = await readAsText(file)
          const csvResult = parseCSV(text)
          extracted = csvResult.length > 0 ? csvResult : extractFromText(text, file.name)
          if (!extracted.length) msg = "No recognizable columns. Expected: card_name, balance, apr, min_payment"

        } else if (ext === "pdf") {
          const text = await extractPDFText(file)
          extracted = extractFromText(text, file.name)
          if (!extracted.length) msg = "No balance/APR found. Scanned/image PDFs are not supported — try CSV export."

        } else if (ext === "docx") {
          const text = await extractDocxText(file)
          const csvTry = parseCSV(text)
          extracted = csvTry.length > 0 ? csvTry : extractFromText(text, file.name)
          if (!extracted.length) msg = "No card data found. Try copy-pasting into CSV format."

        } else if (ext === "doc") {
          const text = await readAsText(file)
          extracted = extractFromText(text, file.name)
          if (!extracted.length) msg = "Old .doc has limited support. Save as .docx or PDF first."

        } else if (ext === "txt") {
          const text = await readAsText(file)
          const csvTry = parseCSV(text)
          extracted = csvTry.length > 0 ? csvTry : extractFromText(text, file.name)
          if (!extracted.length) msg = "No card data found in this text file."

        } else if (["xls", "xlsx"].includes(ext)) {
          const text = await extractExcelText(file)
          const csvTry = parseCSV(text)
          extracted = csvTry.length > 0 ? csvTry : extractFromText(text, file.name)
          if (!extracted.length) msg = "No data found. Use columns: card_name, balance, apr, min_payment"

        } else {
          // Try plain text as last resort
          try {
            const text = await readAsText(file)
            extracted = extractFromText(text, file.name)
          } catch { }
          if (!extracted.length) msg = `Unsupported format .${ext}. Use PDF, CSV, DOCX, or XLSX.`
        }

        const hasPartial = extracted.some(c => c.apr === 0 || c.minPayment === 0)
        results.push({
          name: file.name,
          status: extracted.length === 0 ? "error" : hasPartial ? "partial" : "ok",
          cards: extracted,
          msg: hasPartial && extracted.length > 0
            ? "Balance found — APR not detected. Please check and fill in the APR field."
            : msg || undefined,
        })
      } catch (err: any) {
        results.push({ name: file.name, status: "error", cards: [], msg: err?.message || "Failed to read file." })
      }
    }

    setFileResults(results)
    const allCards = results.flatMap(r => r.cards)

    if (allCards.length > 0) {
      setPreview(allCards.map((c, i) => ({ ...c, id: Date.now() + i })))
      setParseStatus(results.every(r => r.status === "ok") ? "success" : "partial")
      setParseMsg(`Found ${allCards.length} card${allCards.length > 1 ? "s" : ""} in ${results.filter(r => r.cards.length > 0).length} file${arr.length > 1 ? "s" : ""}`)
    } else {
      setParseStatus("error")
      setParseMsg("No credit card data found. Check that your files contain balance, APR, and payment info.")
    }
  }

  const applyPreview = () => {
    setCards(preview.map((c, i) => ({ ...c, id: Date.now() + i })))
    setPreview([]); setParseStatus("idle"); setParseMsg(""); setFileResults([])
    setTab("manual")
  }

  const inputCls = "bg-[#0f1117] border border-white/10 rounded-xl py-2.5 text-sm text-white outline-none focus:border-primary/60 transition-colors px-3 w-full placeholder-white/25"
  const selected = payoffs.find(p => p.strategy === strategy)
  const snowball = payoffs.find(p => p.strategy === "snowball")
  const avalanche = payoffs.find(p => p.strategy === "avalanche")
  const savings = snowball && avalanche ? snowball.totalInterest - avalanche.totalInterest : 0

  const statusStyle = {
    ok: "border-primary/30 bg-primary/5 text-primary",
    partial: "border-amber-400/30 bg-amber-400/5 text-amber-400",
    error: "border-red-400/30 bg-red-400/5 text-red-400",
  }
  const statusIcon = { ok: "✓", partial: "⚠", error: "✕" }

  const FAQS = [
    { q: "What file formats can I upload?", a: "PDF bank statements (text-based), CSV exports from your bank or Excel, Word documents (.docx), and Excel spreadsheets (.xlsx). The parser uses pdf.js for PDFs, mammoth.js for Word files, and SheetJS for Excel — all running 100% in your browser." },
    { q: "Why doesn't my scanned PDF work?", a: "This tool extracts text from digital PDFs only. Scanned/image PDFs are just pictures of text — no text layer exists to extract from. Solution: log into your bank's online portal and download the digital PDF statement (not a scan)." },
    { q: "Can I upload multiple statements at once?", a: "Yes! Hold Ctrl or Cmd when selecting files, or drag multiple files into the drop zone. Each file is parsed separately. All detected cards are shown in a combined preview table before you apply them." },
    { q: "Is my financial data secure?", a: "Everything runs entirely in your browser. Your files are never uploaded to any server. pdf.js, mammoth.js and SheetJS all execute locally. Only the extracted card name, balance, APR, and minimum payment are saved to your browser's localStorage." },
    { q: "What's the fastest way to pay off credit card debt?", a: "Avalanche (highest APR first) minimizes total interest and is mathematically fastest. Snowball (smallest balance first) provides quicker psychological wins. Any extra payment above minimums dramatically accelerates your payoff timeline." },
    { q: "How is monthly interest calculated?", a: "Monthly interest = (APR ÷ 12) × Current Balance. On a $3,000 balance at 22.99% APR, you pay $57.48/month just in interest. That's why minimum-only payments barely reduce the principal — most of the payment just covers interest." },
  ]

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col text-white">
      <Header />
      <main className="pt-16 flex-1">

        {/* ── Hero ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-8 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
            Free Tool — Runs 100% In Your Browser
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Credit Card Debt<br /><span className="text-primary">Calculator</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
            Upload any bank statement — PDF, CSV, Word, or Excel. Smart regex extraction reads any bank format instantly. No API key. No server. No data leaves your device.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {[
              { ext: "PDF", icon: "📄", note: "pdf.js extraction" },
              { ext: "CSV", icon: "📊", note: "flexible columns" },
              { ext: "DOCX", icon: "📝", note: "mammoth.js" },
              { ext: "XLSX", icon: "📈", note: "SheetJS" },
              { ext: "Multi", icon: "📁", note: "upload all at once" },
            ].map(f => (
              <div key={f.ext} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
                <span>{f.icon}</span>
                <span className="font-bold text-white">{f.ext}</span>
                <span className="text-white/35">{f.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-5">

          {/* ── Tabs ── */}
          <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
            <div className="flex border-b border-white/8">
              {(["manual", "upload"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${tab === t ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/40 hover:text-white/70"}`}>
                  {t === "manual" ? "✏️  Manual Entry" : "📤  Upload Statement"}
                </button>
              ))}
            </div>

            {/* ── Manual ── */}
            {tab === "manual" && (
              <div className="p-5 space-y-5">
                <div className="rounded-xl border border-white/8 bg-[#0f1117] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">Add a Card</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Card Name", field: "name", type: "text", placeholder: "Chase Freedom", prefix: "" },
                      { label: "Balance ($)", field: "balance", type: "number", placeholder: "2500", prefix: "$" },
                      { label: "APR (%)", field: "apr", type: "number", placeholder: "19.99", prefix: "" },
                      { label: "Min Payment ($)", field: "minPayment", type: "number", placeholder: "75", prefix: "$" },
                    ].map(f => (
                      <div key={f.field} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{f.label}</label>
                        <div className="relative">
                          {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{f.prefix}</span>}
                          <input type={f.type} placeholder={f.placeholder}
                            value={f.field === "name" ? newCard.name : (newCard as any)[f.field] || ""}
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
                      <thead className="bg-white/3">
                        <tr>{["Card", "Balance", "APR", "Min Payment", "Interest/Mo", ""].map(h =>
                          <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                        )}</tr>
                      </thead>
                      <tbody>
                        {cards.map((c, i) => (
                          <tr key={c.id} className={`border-t border-white/5 cursor-pointer transition-colors ${highlighted === c.id ? "bg-primary/8" : "hover:bg-white/3"}`}
                            onMouseEnter={() => setHighlighted(c.id)} onMouseLeave={() => setHighlighted(null)}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                <input type="text" value={c.name} onChange={e => updateCard(c.id, "name", e.target.value)}
                                  className="bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-primary/40 w-36" />
                              </div>
                            </td>
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

            {/* ── Upload ── */}
            {tab === "upload" && (
              <div className="p-5 space-y-4">

                {/* How it works cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: "📄", title: "PDF", tech: "pdf.js (Mozilla)", body: "Extracts text from any digital bank PDF. Chase, Citi, Amex, BoA, Discover, Capital One…" },
                    { icon: "📊", title: "CSV", tech: "native parser", body: "Auto-detects columns. Works with any bank export or standard card_name, balance, apr, min_payment format." },
                    { icon: "📝", title: "DOCX", tech: "mammoth.js", body: "Extracts raw text from Word documents, then smart regex finds your balance, APR, and payment." },
                    { icon: "📈", title: "XLSX", tech: "SheetJS", body: "Reads Excel spreadsheets and converts to CSV for parsing. Standard export or custom columns." },
                  ].map(f => (
                    <div key={f.title} className="rounded-xl border border-white/8 bg-[#0f1117] px-4 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{f.icon}</span>
                        <span className="text-xs font-bold text-white">{f.title}</span>
                        <span className="text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5 ml-auto">{f.tech}</span>
                      </div>
                      <div className="text-xs text-white/40 leading-relaxed">{f.body}</div>
                    </div>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl py-14 text-center cursor-pointer transition-all ${dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/12 hover:border-primary/40 hover:bg-white/2"}`}>
                  <div className="text-4xl mb-3">{parseStatus === "loading" ? "⏳" : "📤"}</div>
                  <div className="text-sm font-semibold text-white/70">
                    {parseStatus === "loading" ? "Parsing files — this may take a moment for PDFs…" : "Drop files here or click to browse"}
                  </div>
                  <div className="text-xs text-white/30 mt-1.5">PDF · CSV · DOCX · XLSX · TXT · Multiple files OK</div>
                  <input ref={fileRef} type="file" accept=".csv,.pdf,.doc,.docx,.txt,.xls,.xlsx" multiple className="hidden"
                    onChange={e => { if (e.target.files?.length) processFiles(e.target.files) }} />
                </div>

                {/* Per-file results */}
                {fileResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">File Results</div>
                    {fileResults.map((f, i) => (
                      <div key={i} className={`rounded-xl border px-4 py-3 ${statusStyle[f.status]}`}>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="text-base">{statusIcon[f.status]}</span>
                          <span className="flex-1 font-mono truncate">{f.name}</span>
                          {f.cards.length > 0 && <span className="shrink-0 bg-white/10 rounded px-2 py-0.5">{f.cards.length} card{f.cards.length > 1 ? "s" : ""} found</span>}
                        </div>
                        {f.msg && <div className="text-xs mt-1.5 opacity-75 leading-relaxed">{f.msg}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Global error */}
                {parseStatus === "error" && fileResults.length === 0 && (
                  <div className="rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm text-red-400">✕ {parseMsg}</div>
                )}

                {/* Preview & edit */}
                {preview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-bold ${parseStatus === "partial" ? "text-amber-400" : "text-primary"}`}>
                        {parseStatus === "partial" ? "⚠ " : "✓ "}{parseMsg}
                      </div>
                      <div className="text-xs text-white/30">Edit any field before applying</div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-white/8">
                      <table className="w-full text-xs">
                        <thead className="bg-white/3">
                          <tr>{["Card Name", "Balance", "APR", "Min Payment"].map(h =>
                            <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                          )}</tr>
                        </thead>
                        <tbody>
                          {preview.map((c, i) => (
                            <tr key={i} className="border-t border-white/5 hover:bg-white/2 transition-colors">
                              <td className="px-4 py-3"><input type="text" value={c.name} onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-transparent text-white font-medium outline-none border-b border-transparent focus:border-primary/40 w-44" /></td>
                              <td className="px-4 py-3"><div className="flex items-center"><span className="text-white/40 mr-1">$</span><input type="number" value={c.balance} onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, balance: +e.target.value || 0 } : x))} className="bg-transparent text-red-400 font-semibold outline-none border-b border-transparent w-20 tabular-nums" /></div></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <input type="number" value={c.apr} step="0.01" onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, apr: +e.target.value || 0 } : x))} className={`bg-transparent font-semibold outline-none border-b transition-colors w-14 tabular-nums ${c.apr === 0 ? "border-amber-400 text-amber-400" : "border-transparent text-amber-400 focus:border-amber-400/40"}`} />
                                  <span className="text-white/40">%</span>
                                  {c.apr === 0 && <span className="text-[9px] text-amber-400 font-bold uppercase bg-amber-400/10 rounded px-1">Enter APR</span>}
                                </div>
                              </td>
                              <td className="px-4 py-3"><div className="flex items-center"><span className="text-white/40 mr-1">$</span><input type="number" value={c.minPayment} onChange={e => setPreview(p => p.map((x, j) => j === i ? { ...x, minPayment: +e.target.value || 0 } : x))} className="bg-transparent text-white outline-none border-b border-transparent focus:border-primary/40 w-16 tabular-nums" /></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button onClick={applyPreview} className="w-full rounded-xl bg-primary text-black font-bold py-3 text-sm hover:opacity-90 active:scale-[0.99] transition-all">
                      ✓ Apply to Calculator
                    </button>
                  </div>
                )}

                {/* CSV format reference */}
                <div className="rounded-xl border border-white/6 bg-[#0f1117] px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5">CSV Format Reference</div>
                  <code className="text-xs text-white/40 font-mono block leading-relaxed">
                    card_name,balance,apr,min_payment<br />
                    Chase Freedom Unlimited,101.75,27.49,40.00<br />
                    Visa Platinum,3200,22.99,96.00
                  </code>
                </div>
              </div>
            )}
          </div>

          {/* ── Results ── */}
          {cards.length > 0 && (<>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Debt", value: fmtK(totalDebt), sub: `${cards.length} card${cards.length > 1 ? "s" : ""}`, color: "text-red-400" },
                { label: "Avg APR", value: avgAPR.toFixed(2) + "%", sub: "weighted average", color: "text-amber-400" },
                { label: "Monthly Interest", value: fmtK(monthlyInt), sub: "interest per month", color: "text-red-400" },
                { label: "Yearly Interest", value: fmtK(monthlyInt * 12), sub: "annual interest cost", color: "text-red-400" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/8 bg-[#111318] px-5 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">{s.label}</div>
                  <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-white/25 mt-1">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pie */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Balance Distribution</div>
              <PieChart cards={cards} highlighted={highlighted} onHighlight={setHighlighted} />
            </div>

            {/* Strategy */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">Payoff Strategy</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { key: "snowball", icon: "❄️", label: "Snowball", desc: "Smallest balance first. Quick psychological wins." },
                    { key: "avalanche", icon: "🏔️", label: "Avalanche", desc: "Highest APR first. Saves the most interest." },
                    { key: "custom", icon: "⚙️", label: "Custom", desc: "Set your own extra monthly payment." },
                  ] as const).map(s => (
                    <button key={s.key} onClick={() => setStrategy(s.key)}
                      className={`text-left rounded-xl border p-4 transition-all ${strategy === s.key ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/20 bg-white/2"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{s.icon}</span>
                        <span className={`text-sm font-bold ${strategy === s.key ? "text-primary" : "text-white"}`}>{s.label}</span>
                        {strategy === s.key && <span className="ml-auto text-primary text-xs font-bold">✓ Selected</span>}
                      </div>
                      <div className="text-xs text-white/40">{s.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-xs font-semibold text-white/50 whitespace-nowrap">Extra/mo:</label>
                  <input type="range" min={0} max={2000} step={25} value={extra} onChange={e => setExtra(+e.target.value)} className="flex-1 accent-primary" />
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                    <input type="number" value={extra} min={0} onChange={e => setExtra(+e.target.value || 0)}
                      className="bg-[#0f1117] border border-white/10 rounded-lg py-2 pl-6 pr-3 text-sm text-primary font-bold outline-none focus:border-primary/50 w-full" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-white/2">
                    <tr>{["Strategy", "Extra/mo", "Payoff Time", "Total Interest", "Total Cost", "vs Snowball"].map(h =>
                      <th key={h} className="text-left px-4 py-3 text-white/40 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    )}</tr>
                  </thead>
                  <tbody>
                    {payoffs.map(p => {
                      const saved = snowball ? snowball.totalInterest - p.totalInterest : 0
                      const sel = p.strategy === strategy
                      return (
                        <tr key={p.strategy} onClick={() => setStrategy(p.strategy)}
                          className={`border-t border-white/5 cursor-pointer transition-colors ${sel ? "bg-primary/8" : "hover:bg-white/2"}`}>
                          <td className="px-4 py-3 font-bold">
                            <span className={sel ? "text-primary" : "text-white"}>{p.strategy === "snowball" ? "❄️ Snowball" : p.strategy === "avalanche" ? "🏔️ Avalanche" : "⚙️ Custom"}</span>
                          </td>
                          <td className="px-4 py-3 text-white/50">{fmtUSD(extra)}</td>
                          <td className={`px-4 py-3 font-semibold ${sel ? "text-primary" : "text-white"}`}>{fmtMo(p.months)}</td>
                          <td className="px-4 py-3 text-red-400 tabular-nums">{fmtUSD(p.totalInterest)}</td>
                          <td className="px-4 py-3 text-white tabular-nums">{fmtUSD(p.totalCost)}</td>
                          <td className={`px-4 py-3 font-semibold tabular-nums ${saved > 0 ? "text-primary" : saved < 0 ? "text-red-400" : "text-white/30"}`}>
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
                <div className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-5">
                  Pay <span className="text-primary">{fmtUSD(extra)}</span> extra/month using <span className="text-primary capitalize">{selected.strategy}</span> →{" "}
                  <span className="text-primary">debt free in {fmtMo(selected.months)}</span>
                  {savings > 0 && selected.strategy === "avalanche" && <>, saving <span className="text-primary">{fmtUSD(savings)}</span> vs snowball</>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: "Payoff Date", value: (() => { const d = new Date(); d.setMonth(d.getMonth() + selected.months); return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }) })(), color: "text-primary" },
                    { label: "Total Interest", value: fmtUSD(selected.totalInterest), color: "text-red-400" },
                    { label: "Total Cost", value: fmtUSD(selected.totalCost), color: "text-white" },
                    { label: "Monthly Budget", value: fmtUSD(totalMin + extra), color: "text-primary" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{s.label}</div>
                      <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                    </div>
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
                  <div className="flex justify-between text-[10px] text-white/25 mt-1">
                    <span>Today — {fmtK(totalDebt)}</span><span>Debt Free 🎉</span>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ */}
            <div className="rounded-2xl border border-white/8 bg-[#111318] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8 text-sm font-bold text-white">Frequently Asked Questions</div>
              <div className="p-4 space-y-2">
                {FAQS.map((f, i) => (
                  <div key={i} className="rounded-xl border border-white/8 overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white hover:text-primary transition-colors">
                      {f.q}
                      <span className={`text-white/40 text-lg shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45 text-primary" : ""}`}>+</span>
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
            <Link href="/careers" className="text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2">
              Join the WealthClaude team → Careers
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
