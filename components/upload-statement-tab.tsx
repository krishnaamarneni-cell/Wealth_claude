'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Edit2, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import * as mammoth from 'mammoth'
import * as pdfParse from 'pdf-parse'

interface CardDebt {
  name: string
  balance: number
  apr: number
  minPayment: number
}

interface UploadStatementProps {
  onApplyCards: (cards: CardDebt[]) => void
}

interface ParsedFile {
  name: string
  type: string
  cardsFound: number
  cards: CardDebt[]
  error?: string
}

const FileTypeBadge = ({ type, label }: { type: string; label: string }) => (
  <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
    <span className="font-mono text-xs font-semibold">{type}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </Badge>
)

export function UploadStatementTab({ onApplyCards }: UploadStatementProps) {
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([])
  const [editingCards, setEditingCards] = useState<CardDebt[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pattern matching for financial data
  const extractFinancialData = (text: string): Partial<CardDebt>[] => {
    const cards: Partial<CardDebt>[] = []
    
    // Try to find balance (common patterns)
    const balanceMatch = text.match(/(?:balance|amount due|total balance)[:\s]+\$?([\d,]+\.?\d*)/i)
    const aprMatch = text.match(/(?:apr|annual percentage rate)[:\s]+(\d+\.?\d*)%?/i)
    const paymentMatch = text.match(/(?:minimum payment|min payment|monthly payment)[:\s]+\$?([\d,]+\.?\d*)/i)
    const cardNameMatch = text.match(/(?:card|account)[:\s]+([^\n]+)/i)

    if (balanceMatch || aprMatch || paymentMatch) {
      cards.push({
        name: cardNameMatch ? cardNameMatch[1].trim() : 'Imported Card',
        balance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0,
        apr: aprMatch ? parseFloat(aprMatch[1]) : 0,
        minPayment: paymentMatch ? parseFloat(paymentMatch[1].replace(/,/g, '')) : 0,
      })
    }

    return cards
  }

  // Parse PDF
  const parsePDF = async (file: File): Promise<CardDebt[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfParse(arrayBuffer)
      const text = pdf.text

      return extractFinancialData(text) as CardDebt[]
    } catch (error) {
      console.error('[UploadStatement] PDF parsing error:', error)
      return []
    }
  }

  // Parse CSV
  const parseCSV = (file: File): Promise<CardDebt[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const rows = text.split('\n').slice(1)
          
          // Try to auto-detect columns
          const cards: CardDebt[] = []
          for (const row of rows) {
            if (!row.trim()) continue
            const cols = row.split(',').map(c => c.trim())
            
            if (cols.length >= 2) {
              cards.push({
                name: cols[0] || 'Imported Card',
                balance: parseFloat(cols[1]) || 0,
                apr: parseFloat(cols[2]) || 0,
                minPayment: parseFloat(cols[3]) || 0,
              })
            }
          }
          resolve(cards)
        } catch (error) {
          console.error('[UploadStatement] CSV parsing error:', error)
          resolve([])
        }
      }
      reader.readAsText(file)
    })
  }

  // Parse DOCX
  const parseDOCX = async (file: File): Promise<CardDebt[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const text = result.value

      return extractFinancialData(text) as CardDebt[]
    } catch (error) {
      console.error('[UploadStatement] DOCX parsing error:', error)
      return []
    }
  }

  // Parse XLSX
  const parseXLSX = (file: File): Promise<CardDebt[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(worksheet)

          const cards: CardDebt[] = (rows as any[]).map((row) => ({
            name: row.name || row.card || row.Card || 'Imported Card',
            balance: parseFloat(row.balance || row.Balance || 0),
            apr: parseFloat(row.apr || row.APR || 0),
            minPayment: parseFloat(row.minPayment || row.minimum_payment || 0),
          }))

          resolve(cards)
        } catch (error) {
          console.error('[UploadStatement] XLSX parsing error:', error)
          resolve([])
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  // Parse TXT
  const parseTXT = (file: File): Promise<CardDebt[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          return resolve(extractFinancialData(text) as CardDebt[])
        } catch (error) {
          console.error('[UploadStatement] TXT parsing error:', error)
          resolve([])
        }
      }
      reader.readAsText(file)
    })
  }

  // Main file handler
  const handleFiles = async (files: File[]) => {
    const results: ParsedFile[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let cards: CardDebt[] = []
      let error: string | undefined

      try {
        switch (ext) {
          case 'pdf':
            cards = await parsePDF(file)
            break
          case 'csv':
            cards = await parseCSV(file)
            break
          case 'docx':
            cards = await parseDOCX(file)
            break
          case 'xlsx':
          case 'xls':
            cards = await parseXLSX(file)
            break
          case 'txt':
            cards = await parseTXT(file)
            break
          default:
            error = 'Unsupported file type'
        }

        if (cards.length === 0 && !error) {
          error = 'No card data found in file'
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error'
      }

      results.push({
        name: file.name,
        type: ext || 'unknown',
        cardsFound: cards.length,
        cards,
        error,
      })

      setEditingCards([...editingCards, ...cards])
    }

    setParsedFiles([...parsedFiles, ...results])
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const updateCard = (index: number, field: keyof CardDebt, value: any) => {
    const updated = [...editingCards]
    updated[index][field] = field === 'name' ? value : parseFloat(value) || 0
    setEditingCards(updated)
  }

  const removeCard = (index: number) => {
    setEditingCards(editingCards.filter((_, i) => i !== index))
  }

  const removeParsedFile = (index: number) => {
    const file = parsedFiles[index]
    setEditingCards(editingCards.filter(card => !file.cards.includes(card)))
    setParsedFiles(parsedFiles.filter((_, i) => i !== index))
  }

  const handleApply = () => {
    if (editingCards.length > 0) {
      onApplyCards(editingCards)
    }
  }

  return (
    <div className="space-y-6">
      {/* File Type Badges */}
      <div className="flex flex-wrap gap-2">
        <FileTypeBadge type="PDF" label="pdf.js" />
        <FileTypeBadge type="CSV" label="native" />
        <FileTypeBadge type="DOCX" label="mammoth" />
        <FileTypeBadge type="XLSX" label="SheetJS" />
        <FileTypeBadge type="TXT" label="text" />
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
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

        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground">
          PDF · CSV · DOCX · XLSX · TXT · Multiple files OK
        </p>
      </div>

      {/* Parsed Files Results */}
      {parsedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Statements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parsedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    {file.error ? (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-3 w-3" />
                        {file.error}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {file.cardsFound} card{file.cardsFound !== 1 ? 's' : ''} found
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeParsedFile(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Editable Cards Table */}
      {editingCards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Card Details ({editingCards.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3 font-semibold">Card Name</th>
                    <th className="text-right py-3 px-3 font-semibold">Balance</th>
                    <th className="text-right py-3 px-3 font-semibold">APR (%)</th>
                    <th className="text-right py-3 px-3 font-semibold">Min Payment</th>
                    <th className="text-center py-3 px-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editingCards.map((card, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={card.name}
                          onChange={(e) => updateCard(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-background border border-input rounded text-sm"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={card.balance}
                          onChange={(e) => updateCard(idx, 'balance', e.target.value)}
                          className="w-full px-2 py-1 bg-background border border-input rounded text-sm text-right"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={card.apr}
                          onChange={(e) => updateCard(idx, 'apr', e.target.value)}
                          className="w-full px-2 py-1 bg-background border border-input rounded text-sm text-right"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={card.minPayment}
                          onChange={(e) => updateCard(idx, 'minPayment', e.target.value)}
                          className="w-full px-2 py-1 bg-background border border-input rounded text-sm text-right"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => removeCard(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply Button */}
      {editingCards.length > 0 && (
        <Button
          onClick={handleApply}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          Apply to Calculator ({editingCards.length} cards)
        </Button>
      )}
    </div>
  )
}
