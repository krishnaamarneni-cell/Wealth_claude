'use client'

import React from "react"

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { saveTransactionsToStorage } from '@/lib/transaction-storage'

// Metadata for upload page
export const metadata = {
  title: 'Upload Transactions — WealthClaude | Import Your Portfolio',
  description: 'Upload your brokerage CSV files to WealthClaude and instantly track your portfolio performance with AI insights.',
}

interface Transaction {
  id: string
  date: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'TAX' | 'INTEREST'
  symbol: string
  shares: number
  price: number
  total: number
  broker: string
  fees?: number
  fileId?: string
}

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [uploadSuccess, setUploadSuccess] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [transactionStats, setTransactionStats] = useState<{
    total: number
    dividends: number
    buys: number
    sells: number
  } | null>(null)
  const router = useRouter()

  const parseDate = (dateStr: string): string => {
    const trimmed = dateStr.trim()

    // Try M/D/YYYY format first
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (slashMatch) {
      const month = slashMatch[1].padStart(2, '0')
      const day = slashMatch[2].padStart(2, '0')
      const year = slashMatch[3]
      return `${year}-${month}-${day}`
    }

    // Try YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.split(' ')[0]
    }

    return new Date().toISOString().split('T')[0]
  }

  const parseCSV = (csvText: string): string[][] => {
    const rows = csvText.split('\n')
    const parsed: string[][] = []
    let currentRow: string[] = []
    let inQuotes = false
    let currentField = ''

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i]
      const nextChar = csvText[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentField.trim() || currentRow.length > 0) {
          currentRow.push(currentField.trim())
          if (currentRow.some(field => field.length > 0)) {
            parsed.push(currentRow)
          }
          currentRow = []
          currentField = ''
        }
        if (char === '\r' && nextChar === '\n') {
          i++
        }
      } else {
        currentField += char
      }
    }

    if (currentField.trim() || currentRow.length > 0) {
      currentRow.push(currentField.trim())
      if (currentRow.some(field => field.length > 0)) {
        parsed.push(currentRow)
      }
    }

    return parsed.filter(row => row.length > 0)
  }

  const detectTransactionType = (typeStr: string): Transaction['type'] => {
    const normalized = typeStr.toUpperCase().trim()
    if (normalized === 'BUY' || normalized.includes('PURCHASE')) return 'BUY'
    if (normalized === 'SELL' || normalized.includes('SALE')) return 'SELL'
    if (normalized === 'CDIV' || normalized.includes('DIV')) return 'DIVIDEND'
    if (normalized === 'DCF' || normalized.includes('DEPOSIT')) return 'DEPOSIT'
    return 'BUY'
  }

  const parseTransactionsFromCSV = (csvData: string[][]): Transaction[] => {
    if (csvData.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row')
    }

    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const dateIdx = headers.findIndex(h =>
      h.includes('activity date') || h.includes('date') || h.includes('time')
    )
    const typeIdx = headers.findIndex(h =>
      h.includes('trans code') || h.includes('type') || h.includes('action')
    )
    const symbolIdx = headers.findIndex(h =>
      h.includes('instrument') || h.includes('symbol') || h.includes('ticker')
    )
    const descriptionIdx = headers.findIndex(h => h.includes('description'))

    if (dateIdx === -1) {
      throw new Error('CSV must contain a "Date" column')
    }

    const parsedTransactions: Transaction[] = []

    for (const row of rows) {
      if (row.length === 0 || row.every(cell => !cell.trim())) continue

      try {
        const rawDate = row[dateIdx] || ''
        const rawType = typeIdx !== -1 ? (row[typeIdx] || '') : ''
        const rawSymbol = symbolIdx !== -1 ? (row[symbolIdx] || '').toUpperCase().trim() : ''

        if (!rawDate || !rawType.trim()) continue

        const date = parseDate(rawDate)
        const type = detectTransactionType(rawType)
        let symbol = rawSymbol

        // Special handling for CDIV (dividend)
        let shares = 0
        let price = 0
        let total = 0

        if (type === 'DIVIDEND') {
          // Get description from column 5 (index 4)
          const description = row[4] || ''

          // Extract shares from description: "29.729528 shares"
          const sharesMatch = description.match(/(\d+\.?\d*)\s+shares/)
          if (sharesMatch) {
            shares = parseFloat(sharesMatch[1])
          }

          // Extract rate from description: "at 0.235"
          const rateMatch = description.match(/at\s+(\d+\.?\d*)/)
          if (rateMatch) {
            price = parseFloat(rateMatch[1])
          }

          // Use column 9 (index 8) for total amount
          if (row.length > 8 && row[8]) {
            total = parseFloat(row[8].replace(/[$,]/g, '') || '0')
          }
        } else {
          // For BUY/SELL, try to find quantity and price
          const sharesIdx = headers.findIndex(h =>
            h.includes('quantity') || h.includes('shares') || h.includes('qty')
          )
          const priceIdx = headers.findIndex(h =>
            h.includes('price') && !h.includes('settle')
          )
          const totalIdx = headers.findIndex(h =>
            h.includes('amount') || h.includes('total') || h.includes('value')
          )

          const rawShares = sharesIdx !== -1 ? (row[sharesIdx] || '0') : '0'
          const rawPrice = priceIdx !== -1 ? (row[priceIdx] || '0') : '0'
          const rawTotal = totalIdx !== -1 ? (row[totalIdx] || '0') : '0'

          shares = parseFloat(rawShares.replace(/[^0-9.-]/g, '') || '0')
          price = parseFloat(rawPrice.replace(/[$,()]/g, '') || '0')
          total = parseFloat(rawTotal.replace(/[$,()]/g, '') || '0')

          if (total === 0 && shares > 0 && price > 0) {
            total = shares * price
          }
        }

        if (!symbol && type === 'DIVIDEND') {
          symbol = '-'
        }

        if (!symbol && (type === 'BUY' || type === 'SELL')) {
          continue
        }

        parsedTransactions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date,
          type,
          symbol: symbol || '-',
          shares: Math.abs(shares),
          price: Math.abs(price),
          total: Math.abs(total),
          broker: 'Fidelity',
        })
      } catch (err) {
        console.error('Error parsing row:', err)
      }
    }

    return parsedTransactions
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const text = await file.text()
      const csvData = parseCSV(text)
      const newTransactions = parseTransactionsFromCSV(csvData)

      if (newTransactions.length === 0) {
        throw new Error('No valid transactions found in the file')
      }

      // Get existing transactions
      const existingStr = localStorage.getItem('portfolio-transactions')
      const existingTransactions: Transaction[] = existingStr ? JSON.parse(existingStr) : []

      // Merge and remove duplicates by ID
      const mergedMap = new Map(existingTransactions.map(t => [t.id, t]))
      newTransactions.forEach(t => mergedMap.set(t.id, t))
      const allTransactions = Array.from(mergedMap.values())

      // Save to both locations
      saveTransactionsToStorage(allTransactions)

      // Clear cache
      if (typeof window !== 'undefined' && (window as any).__portfolioCache) {
        (window as any).__portfolioCache = null
      }

      // Calculate stats
      const stats = {
        total: newTransactions.length,
        dividends: newTransactions.filter(t => t.type === 'DIVIDEND').length,
        buys: newTransactions.filter(t => t.type === 'BUY').length,
        sells: newTransactions.filter(t => t.type === 'SELL').length,
      }
      setTransactionStats(stats)
      setUploadSuccess(
        `Uploaded ${stats.total} transactions (${stats.dividends} dividends, ${stats.buys} buys, ${stats.sells} sells)`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      setUploadError(errorMessage)
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Transaction CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Drag and drop your CSV file</h3>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button asChild variant="outline" disabled={isUploading}>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>

          {/* Error Alert */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {uploadSuccess && (
            <Alert className="border-green-500 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{uploadSuccess}</AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          {transactionStats && (
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-semibold">CSV Format Required:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Must include: Activity Date, Trans Code, Instrument/Symbol</li>
              <li>For dividends (CDIV): Description should contain shares and rate</li>
              <li>For buys/sells: Include Quantity, Price, and Amount columns</li>
              <li>Currency symbols ($) will be automatically removed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
