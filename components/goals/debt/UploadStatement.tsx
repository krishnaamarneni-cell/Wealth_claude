"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, CheckCircle2, AlertCircle, X, FileText } from "lucide-react"
import type { ParsedCard, ParsedFile, Debt } from "@/components/goals/types"

interface UploadStatementProps {
  onApplyCards: (debts: Debt[]) => void
}

// ==================== FILE TYPE CONFIG ====================

const FILE_TYPES = [
  {
    format: "PDF",
    badge: "pdf.js",
    description: "Any digital bank PDF — Chase, Citi, Amex, BoA, Discover...",
    icon: "📄",
    badgeColor: "text-red-400",
  },
  {
    format: "CSV",
    badge: "native",
    description: "Auto-detects columns. Any bank export format.",
    icon: "📊",
    badgeColor: "text-green-400",
  },
  {
    format: "DOCX",
    badge: "mammoth.js",
    description: "Extracts text from Word docs, finds card fields.",
    icon: "📝",
    badgeColor: "text-blue-400",
  },
  {
    format: "XLSX",
    badge: "SheetJS",
    description: "Excel spreadsheets converted and parsed.",
    icon: "📈",
    badgeColor: "text-green-400",
  },
]

// ==================== PARSING LOGIC ====================

function extractFinancialData(text: string): ParsedCard | null {
  // ====== CARD NAME EXTRACTION ======
  // Priority 1: Known card product names (most reliable)
  const knownCardPatterns = [
    // Chase
    /CHASE\s+(FREEDOM\s+UNLIMITED|FREEDOM\s+FLEX|SAPPHIRE\s+PREFERRED|SAPPHIRE\s+RESERVE|SLATE|AMAZON|AEROPLAN|INK\s+\w+)/i,
    // American Express
    /(HILTON\s+HONORS\s+CARD|BLUE\s+CASH\s+\w+|GOLD\s+CARD|PLATINUM\s+CARD|GREEN\s+CARD|DELTA\s+SKY\s*MILES\s+\w+|MARRIOTT\s+BONVOY\s+\w+|EVERYDAY\s+\w*)/i,
    // Capital One
    /(?:CAPITAL\s*ONE\s+)?(VENTURE\s*X?|QUICKSILVER\s*ONE?|SAVOR\s*ONE?|PLATINUM\s+CARD)\s*(?:\|[^|]+ending\s+in\s+\d+)?/i,
    // Bank of America
    /(VISA\s+SIGNATURE|CUSTOMIZED\s+CASH\s+REWARDS|TRAVEL\s+REWARDS|UNLIMITED\s+CASH\s+REWARDS|PREMIUM\s+REWARDS)\s*®?/i,
    // Citi
    /CITI\s+(DOUBLE\s+CASH|CUSTOM\s+CASH|PREMIER|DIAMOND\s+PREFERRED|SIMPLICITY|REWARDS\+?|COSTCO)/i,
    // Discover
    /DISCOVER\s+(IT|MORE|CHROME)\s*®?\s*(CASH\s+BACK|MILES|STUDENT|SECURED)?/i,
    // Wells Fargo
    /WELLS\s+FARGO\s+(ACTIVE\s+CASH|AUTOGRAPH|REFLECT|PLATINUM)/i,
    // US Bank
    /U\.?S\.?\s+BANK\s+(VISA\s+PLATINUM|ALTITUDE\s+\w+|CASH\+?|SHOPPER\s+CASH)/i,
  ]

  let cardName = ""
  for (const pattern of knownCardPatterns) {
    const match = text.match(pattern)
    if (match) {
      cardName = match[0].trim().substring(0, 50)
      break
    }
  }

  // Priority 2: Generic card/account line (but NOT the person's name)
  if (!cardName) {
    // Look for "Card" or "Account" followed by product-like text, excluding common name patterns
    const genericCardMatch = text.match(
      /(?:^|\n)\s*((?:[\w]+\s+){0,3}(?:Card|Visa|Mastercard|World\s+Mastercard))\s*(?:\||®|\s+ending)/im
    )
    if (genericCardMatch) {
      cardName = genericCardMatch[1].trim().substring(0, 50)
    }
  }

  // Priority 3: Issuer name from statement
  if (!cardName) {
    const issuerMatch = text.match(
      /(?:AMERICAN\s+EXPRESS|CHASE|CAPITAL\s*ONE|BANK\s+OF\s+AMERICA|CITIBANK|CITI|DISCOVER|WELLS\s+FARGO|U\.?S\.?\s+BANK|BARCLAYS|SYNCHRONY)/i
    )
    if (issuerMatch) {
      cardName = issuerMatch[0].trim() + " Card"
    }
  }

  if (!cardName) cardName = "Imported Card"

  // ====== BALANCE EXTRACTION ======
  // Try specific "New Balance" patterns first (most common across all banks)
  let balance = 0
  const balancePatterns = [
    // "New Balance $333.89" or "New Balance Total $40.30" (BoA)
    /New\s+Balance(?:\s+Total)?\s*(?:=\s*)?\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Statement Balance $XXX.XX"
    /Statement\s+Balance\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Current Balance $XXX.XX"
    /Current\s+Balance\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Amount Due $XXX.XX"
    /(?:Total\s+)?Amount\s+Due\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Balance Due $XXX.XX"
    /Balance\s+Due\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // Fallback: any "balance" followed by dollar amount
    /(?:balance|outstanding)[:\s]*\$?\s*([0-9,]+\.[0-9]{2})/i,
  ]

  for (const pattern of balancePatterns) {
    const match = text.match(pattern)
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ""))
      if (val > 0 && val < 1000000) {
        balance = val
        break
      }
    }
  }

  // ====== APR EXTRACTION ======
  // APR appears in Interest Charge Calculation section with various formats
  let apr = 0
  const aprPatterns = [
    // "Purchases 28.24% (v)" or "Purchases 27.49%(v)(d)" — Interest Charge table format
    /Purchases\s+(\d{1,2}\.\d{1,2})%\s*(?:\(v\)|\(V\)|V|P|\(v\)\(d\)|\(d\))?/i,
    // "Annual Percentage Rate (APR)" section: "28.99% P" or "26.49%V"
    /(?:Annual\s+Percentage\s+Rate|APR)\s*(?:\(APR\))?\s*[\s:]*(\d{1,2}\.\d{1,2})%?\s*(?:\(v\)|V|P|\(v\)\(d\)|\(d\))?/i,
    // "Purchase APR: 19.99%"
    /Purchase\s+APR\s*:?\s*(\d{1,2}\.\d{1,2})\s*%/i,
    // "Standard APR: XX.XX%"  
    /Standard\s+APR\s*:?\s*(\d{1,2}\.\d{1,2})\s*%/i,
    // "Variable APR: XX.XX%"
    /Variable\s+APR\s*:?\s*(\d{1,2}\.\d{1,2})\s*%/i,
    // "Interest Rate: XX.XX%"
    /Interest\s+Rate\s*:?\s*(\d{1,2}\.\d{1,2})\s*%/i,
    // "Penalty APR of 29.99%" — extract as fallback if no other APR found
    /Penalty\s+APR\s+(?:of\s+)?(\d{1,2}\.\d{1,2})\s*%/i,
    // Generic: any XX.XX% near "APR" text
    /(\d{1,2}\.\d{1,2})%\s*(?:\(v\)|V|P|\(v\)\(d\)|\(d\))?\s*(?:variable|apr)/i,
  ]

  for (const pattern of aprPatterns) {
    const match = text.match(pattern)
    if (match) {
      const val = parseFloat(match[1])
      // Valid APR range: 0-40%, skip penalty APRs > 30% unless it's the only one
      if (val > 0 && val <= 35) {
        apr = val
        break
      }
    }
  }

  // If no APR found yet, try to find any percentage near interest-related words
  if (apr === 0) {
    const fallbackAPR = text.match(
      /(\d{1,2}\.\d{1,2})\s*%\s*(?:\(v\)|V|P|\(d\))?/g
    )
    if (fallbackAPR) {
      for (const match of fallbackAPR) {
        const val = parseFloat(match)
        if (val >= 10 && val <= 35) {
          apr = val
          break
        }
      }
    }
  }

  // ====== MINIMUM PAYMENT EXTRACTION ======
  let minPayment = 0
  const paymentPatterns = [
    // "Minimum Payment Due $40.00" (most common)
    /Minimum\s+Payment\s+Due\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Total Minimum Payment Due $35.00" (BoA)
    /Total\s+Minimum\s+Payment\s+Due\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Minimum Payment $25.00"
    /Minimum\s+Payment\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Minimum Due $XX.XX"
    /Minimum\s+Due\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Minimum Amount Due $XX.XX"
    /Minimum\s+Amount\s+Due\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
    // "Current Payment Due $35.00" (BoA)
    /Current\s+Payment\s+Due\s*\$?\s*([0-9,]+\.[0-9]{2})/i,
  ]

  for (const pattern of paymentPatterns) {
    const match = text.match(pattern)
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ""))
      if (val > 0 && val < 100000) {
        minPayment = val
        break
      }
    }
  }

  // Return card if we found ANY useful data (user can edit the rest)
  if (balance > 0 || apr > 0 || minPayment > 0) {
    return { name: cardName, balance, apr, minPayment }
  }
  return null
}

async function parseCSV(text: string): Promise<ParsedCard[]> {
  const rows = text.split("\n").filter((r) => r.trim())
  if (rows.length < 2) return []

  const header = rows[0].toLowerCase()
  const cols = rows[0].split(",").map((c) => c.trim().toLowerCase())

  // Try column-based extraction
  const nameIdx = cols.findIndex(
    (c) => c.includes("name") || c.includes("card") || c.includes("description")
  )
  const balanceIdx = cols.findIndex(
    (c) => c.includes("balance") || c.includes("amount") || c.includes("owed")
  )
  const aprIdx = cols.findIndex(
    (c) => c.includes("apr") || c.includes("rate") || c.includes("interest")
  )
  const paymentIdx = cols.findIndex(
    (c) => c.includes("payment") || c.includes("minimum") || c.includes("min")
  )

  if (balanceIdx >= 0) {
    const cards: ParsedCard[] = []
    rows.slice(1).forEach((row) => {
      const values = row.split(",").map((v) => v.trim())
      const balance = parseFloat(values[balanceIdx]?.replace(/[$,]/g, "") || "0")
      if (balance > 0) {
        cards.push({
          name: nameIdx >= 0 ? values[nameIdx] || "Imported Card" : "Imported Card",
          balance,
          apr: aprIdx >= 0 ? parseFloat(values[aprIdx]?.replace(/%/g, "") || "0") : 0,
          minPayment: paymentIdx >= 0 ? parseFloat(values[paymentIdx]?.replace(/[$,]/g, "") || "0") : 0,
        })
      }
    })
    return cards
  }

  // Fallback: positional columns [name, balance, apr, minPayment]
  const cards: ParsedCard[] = []
  rows.slice(1).forEach((row) => {
    const values = row.split(",").map((v) => v.trim())
    if (values.length >= 2) {
      const balance = parseFloat(values[1]?.replace(/[$,]/g, "") || "0")
      if (balance > 0) {
        cards.push({
          name: values[0] || "Imported Card",
          balance,
          apr: values[2] ? parseFloat(values[2].replace(/%/g, "")) : 0,
          minPayment: values[3] ? parseFloat(values[3].replace(/[$,]/g, "")) : 0,
        })
      }
    }
  })
  return cards
}

async function parsePDF(file: File): Promise<ParsedCard[]> {
  try {
    const pdfjsLib = await import("pdfjs-dist")

    // Match worker version to installed pdfjs-dist version dynamically
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise

    let fullText = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
      fullText += pageText + "\n"
    }

    if (!fullText || fullText.trim().length < 20) {
      // PDF might be image-based / scanned
      return []
    }

    const card = extractFinancialData(fullText)
    return card ? [card] : []
  } catch (error) {
    console.error("PDF parsing error:", error)
    // Fallback: try reading as raw text (some PDFs are text-based)
    try {
      const text = await file.text()
      if (text && text.trim().length > 50) {
        const card = extractFinancialData(text)
        return card ? [card] : []
      }
    } catch {
      // ignore
    }
    return []
  }
}

async function parseDOCX(file: File): Promise<ParsedCard[]> {
  try {
    const mammoth = await import("mammoth")
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    const card = extractFinancialData(result.value)
    return card ? [card] : []
  } catch (error) {
    console.error("DOCX parsing error:", error)
    return []
  }
}

async function parseXLSX(file: File): Promise<ParsedCard[]> {
  try {
    const XLSX = await import("xlsx")
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet)

    const cards: ParsedCard[] = []
    json.forEach((row) => {
      // Flexible column matching (case-insensitive)
      const keys = Object.keys(row)
      const nameKey = keys.find((k) =>
        /name|card|description/i.test(k)
      )
      const balanceKey = keys.find((k) =>
        /balance|amount|owed/i.test(k)
      )
      const aprKey = keys.find((k) => /apr|rate|interest/i.test(k))
      const paymentKey = keys.find((k) =>
        /payment|minimum|min/i.test(k)
      )

      const balance = balanceKey
        ? parseFloat(String(row[balanceKey]).replace(/[$,]/g, ""))
        : 0

      if (balance > 0) {
        cards.push({
          name: nameKey ? String(row[nameKey]).substring(0, 40) : "Imported Card",
          balance,
          apr: aprKey ? parseFloat(String(row[aprKey]).replace(/%/g, "")) : 0,
          minPayment: paymentKey
            ? parseFloat(String(row[paymentKey]).replace(/[$,]/g, ""))
            : 0,
        })
      }
    })
    return cards
  } catch (error) {
    console.error("XLSX parsing error:", error)
    return []
  }
}

async function parseTXT(file: File): Promise<ParsedCard[]> {
  const text = await file.text()
  const card = extractFinancialData(text)
  return card ? [card] : []
}

// ==================== COMPONENT ====================

export function UploadStatement({ onApplyCards }: UploadStatementProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([])
  const [editingCards, setEditingCards] = useState<ParsedCard[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    const newParsedFiles: ParsedFile[] = []
    const newCards: ParsedCard[] = [...editingCards]

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      let cards: ParsedCard[] = []
      let errorMessage: string | undefined

      try {
        switch (ext) {
          case "csv":
            const csvText = await file.text()
            cards = await parseCSV(csvText)
            break
          case "pdf":
            cards = await parsePDF(file)
            break
          case "docx":
            cards = await parseDOCX(file)
            break
          case "xlsx":
          case "xls":
            cards = await parseXLSX(file)
            break
          case "txt":
            cards = await parseTXT(file)
            break
          default:
            errorMessage = `Unsupported file type: .${ext}`
        }
      } catch (err) {
        errorMessage = `Failed to parse ${file.name}`
        console.error(err)
      }

      if (cards.length > 0) {
        newParsedFiles.push({
          name: file.name,
          status: "success",
          cardCount: cards.length,
        })
        newCards.push(...cards)
      } else if (!errorMessage) {
        newParsedFiles.push({
          name: file.name,
          status: "error",
          cardCount: 0,
          errorMessage: "No card data found in file",
        })
      } else {
        newParsedFiles.push({
          name: file.name,
          status: "error",
          cardCount: 0,
          errorMessage,
        })
      }
    }

    setParsedFiles((prev) => [...prev, ...newParsedFiles])
    setEditingCards(newCards)
    setIsProcessing(false)
  }, [editingCards])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) handleFiles(files)
    },
    [handleFiles]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) handleFiles(files)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const updateCard = (index: number, field: keyof ParsedCard, value: string) => {
    const updated = [...editingCards]
    if (field === "name") {
      updated[index].name = value
    } else {
      updated[index][field] = parseFloat(value) || 0
    }
    setEditingCards(updated)
  }

  const removeCard = (index: number) => {
    setEditingCards(editingCards.filter((_, i) => i !== index))
  }

  const handleApply = () => {
    const debts: Debt[] = editingCards
      .filter((c) => c.balance > 0)
      .map((c) => ({
        id: Date.now().toString() + Math.random(),
        name: c.name || "Imported Card",
        type: "Credit Card" as const,
        balance: c.balance,
        apr: c.apr,
        monthlyPayment: c.minPayment,
        minimumPayment: c.minPayment,
      }))

    if (debts.length > 0) {
      onApplyCards(debts)
      setEditingCards([])
      setParsedFiles([])
    }
  }

  return (
    <div className="space-y-6">
      {/* File Type Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {FILE_TYPES.map((ft) => (
          <div
            key={ft.format}
            className="rounded-lg border border-border bg-secondary/30 p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{ft.icon}</span>
              <span className="text-sm font-bold text-foreground">
                {ft.format}
              </span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary ${ft.badgeColor}`}
              >
                {ft.badge}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {ft.description}
            </p>
          </div>
        ))}
      </div>

      {/* Drag-and-Drop Zone */}
      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${isDragging
                ? "border-green-500 bg-green-500/5"
                : "border-border hover:border-muted-foreground"
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.docx,.xlsx,.xls,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <Upload
              className={`h-10 w-10 mx-auto mb-3 ${isDragging ? "text-green-500" : "text-muted-foreground"
                }`}
            />
            <p className="text-sm font-medium text-foreground mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF · CSV · DOCX · XLSX · TXT · Multiple files OK
            </p>
            {isProcessing && (
              <div className="mt-3">
                <div className="w-32 h-1.5 bg-secondary rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full animate-pulse w-2/3" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Processing...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parsed Files List */}
      {parsedFiles.length > 0 && (
        <div className="space-y-2">
          {parsedFiles.map((pf, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${pf.status === "success"
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
                }`}
            >
              <div className="flex items-center gap-2">
                {pf.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-foreground">{pf.name}</span>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${pf.status === "success"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                  }`}
              >
                {pf.status === "success"
                  ? `${pf.cardCount} card${pf.cardCount !== 1 ? "s" : ""} found`
                  : pf.errorMessage}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Editable Preview Table */}
      {editingCards.length > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-green-500 font-medium">
                ✓ Found {editingCards.length} card{editingCards.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Edit any field before applying
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Card Name
                    </th>
                    <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Balance ($)
                    </th>
                    <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      APR (%)
                    </th>
                    <th className="text-right px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Min Payment ($)
                    </th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {editingCards.map((card, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={card.name}
                          onChange={(e) => updateCard(i, "name", e.target.value)}
                          className="w-full bg-transparent text-sm text-foreground outline-none border-b border-transparent focus:border-green-500 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={card.balance || ""}
                          onChange={(e) => updateCard(i, "balance", e.target.value)}
                          className="w-full bg-transparent text-sm text-foreground text-right outline-none border-b border-transparent focus:border-green-500 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={card.apr || ""}
                          onChange={(e) => updateCard(i, "apr", e.target.value)}
                          step="0.01"
                          className="w-full bg-transparent text-sm text-foreground text-right outline-none border-b border-transparent focus:border-green-500 py-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={card.minPayment || ""}
                          onChange={(e) => updateCard(i, "minPayment", e.target.value)}
                          className="w-full bg-transparent text-sm text-foreground text-right outline-none border-b border-transparent focus:border-green-500 py-1"
                        />
                      </td>
                      <td className="px-1 py-2">
                        <button
                          onClick={() => removeCard(i)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Apply to Calculator Button */}
            <button
              onClick={handleApply}
              className="w-full mt-4 rounded-lg bg-green-500 py-3.5 text-sm font-semibold text-black hover:bg-green-400 transition-colors"
            >
              ✓ Apply to Calculator
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
