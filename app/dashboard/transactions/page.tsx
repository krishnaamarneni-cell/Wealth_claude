"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Plus,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Filter,
  Download,
  AlertCircle,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTransactionsFromStorage } from "@/lib/transaction-storage"
import { usePortfolio } from "@/lib/portfolio-context"

interface Transaction {
  id: string
  date: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL'
  symbol: string
  shares: number
  price: number
  total: number
  broker: string
  fees: number
  fileId: string
}

interface UploadedFile {
  id: string
  name: string
  uploadDate: string
  transactionCount: number
}

const brokers = [
  'Robinhood',
  'Fidelity',
  'Charles Schwab',
  'TD Ameritrade',
  'E*TRADE',
  'Webull',
  'Interactive Brokers',
  'Vanguard',
  'Merrill Edge',
  'Other'
]

export default function TransactionsPage() {
  const { transactions: contextTransactions, refresh: contextRefresh } = usePortfolio()
  const [transactions, setTransactions] = useState<Transaction[]>(contextTransactions)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [uploadError, setUploadError] = useState<string>('')
  const [uploadSuccess, setUploadSuccess] = useState<string>('')
  const [pendingFile, setPendingFile] = useState<{ data: Transaction[], originalName: string } | null>(null)
  const [fileName, setFileName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [searchSymbol, setSearchSymbol] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'BUY' as Transaction['type'],
    symbol: '',
    shares: '',
    price: '',
    broker: '',
    fees: '0'
  })

  // Load uploaded files from localStorage on mount only
  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem('uploadedFiles')
      if (storedFiles) setUploadedFiles(JSON.parse(storedFiles))
    } catch (error) {
      console.error('[transactions-page] Error loading files:', error)
    }
  }, [])
  // Sync transactions from context (no Supabase call on every page visit)
  useEffect(() => {
    setTransactions(contextTransactions)
  }, [contextTransactions])

  // FIXED: Sync transactions with uploaded files
  const syncDataWithFiles = () => {
    setIsRefreshing(true)

    // Get current file IDs
    const validFileIds = uploadedFiles.map(f => f.id)
    validFileIds.push('manual') // Keep manually added transactions

    // Filter transactions to only keep those from existing files
    const syncedTransactions = transactions.filter(tx => validFileIds.includes(tx.fileId))

    // Update state and save to storage
    setTransactions(syncedTransactions)
    saveTransactionsToStorage(syncedTransactions)

    setUploadSuccess('✅ Data synced successfully')
    setTimeout(() => {
      setUploadSuccess('')
      setIsRefreshing(false)
    }, 2000)
  }

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (searchSymbol && !t.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false
    if (dateFrom && t.date < dateFrom) return false
    if (dateTo && t.date > dateTo) return false
    if (minPrice && t.price < parseFloat(minPrice)) return false
    if (maxPrice && t.price > parseFloat(maxPrice)) return false
    if (minTotal && t.total < parseFloat(minTotal)) return false
    if (maxTotal && t.total > parseFloat(maxTotal)) return false
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // Calculate stats
  const totalInvested = transactions
    .filter(t => t.type === 'BUY')
    .reduce((sum, t) => sum + t.total, 0)

  const totalSold = transactions
    .filter(t => t.type === 'SELL')
    .reduce((sum, t) => sum + t.total, 0)

  const totalDividends = transactions
    .filter(t => t.type === 'DIVIDEND')
    .reduce((sum, t) => sum + t.total, 0)

  const uniqueSymbols = new Set(transactions.filter(t => t.type === 'BUY' || t.type === 'SELL').map(t => t.symbol))

  const clearFilters = () => {
    setFilterType('all')
    setSearchSymbol('')
    setDateFrom('')
    setDateTo('')
    setMinPrice('')
    setMaxPrice('')
    setMinTotal('')
    setMaxTotal('')
    setCurrentPage(1)
  }

  const handleAddTransaction = async () => {
    const shares = parseFloat(newTransaction.shares) || 0
    const price = parseFloat(newTransaction.price) || 0
    const fees = parseFloat(newTransaction.fees) || 0

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: newTransaction.date,
      type: newTransaction.type,
      symbol: newTransaction.symbol.toUpperCase(),
      shares,
      price,
      total: shares * price,
      broker: newTransaction.broker,
      fees,
      fileId: 'manual'
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [transaction] })
      })

      if (!response.ok) throw new Error('Failed to save')

      const freshTransactions = await getTransactionsFromStorage()
      setTransactions(freshTransactions)
      window.dispatchEvent(new Event('transactionsUpdated'))
    } catch (error) {
      console.error('[transactions-page] Error adding transaction:', error)
      setUploadError('Failed to add transaction')
      setTimeout(() => setUploadError(''), 3000)
    }

    setIsAddDialogOpen(false)
    setNewTransaction({
      date: new Date().toISOString().split('T')[0],
      type: 'BUY',
      symbol: '',
      shares: '',
      price: '',
      broker: '',
      fees: '0'
    })
  }

  const handleDeleteTransaction = async (id: string) => {
    // First, delete from Supabase
    try {
      console.log('[transactions-page] Deleting transaction:', id)
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        console.error('[transactions-page] Delete failed:', response.status)
        setUploadError('Failed to delete transaction')
        setTimeout(() => setUploadError(''), 3000)
        return
      }

      console.log('[transactions-page] ✅ Deleted from Supabase')

      // Then reload all transactions from Supabase
      const updatedTransactions = await getTransactionsFromStorage()
      setTransactions(updatedTransactions)

      setUploadSuccess('✅ Transaction deleted')
      setTimeout(() => setUploadSuccess(''), 3000)

      // Trigger portfolio refresh
      window.dispatchEvent(new Event('transactionsUpdated'))
    } catch (error) {
      console.error('[transactions-page] Error deleting transaction:', error)
      setUploadError('Error deleting transaction')
      setTimeout(() => setUploadError(''), 3000)
    }
  }

  const deleteFile = async (fileId: string) => {
    const fileToDelete = uploadedFiles.find(f => f.id === fileId)
    if (!fileToDelete) return

    if (!confirm(`Delete "${fileToDelete.name}" and all its ${fileToDelete.transactionCount} transactions?`)) {
      return
    }

    try {
      // Find all transactions with this fileId
      const transactionsToDelete = transactions.filter(tx => tx.fileId === fileId)

      // Delete each transaction from Supabase
      for (const tx of transactionsToDelete) {
        await fetch(`/api/transactions/${tx.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
      }

      console.log('[transactions-page] ✅ Deleted', transactionsToDelete.length, 'transactions from Supabase')

      // Update local state
      const updatedFiles = uploadedFiles.filter(f => f.id !== fileId)
      setUploadedFiles(updatedFiles)

      const updatedTransactions = transactions.filter(tx => tx.fileId !== fileId)
      setTransactions(updatedTransactions)

      setUploadSuccess(`✅ Deleted "${fileToDelete.name}" and ${fileToDelete.transactionCount} transactions`)
      window.dispatchEvent(new Event('transactionsUpdated'))

      setTimeout(() => setUploadSuccess(''), 3000)
    } catch (error) {
      console.error('[transactions-page] Error deleting file:', error)
      setUploadError('Error deleting transactions')
      setTimeout(() => setUploadError(''), 3000)
    }
  }

  const deleteAllData = () => {
    if (!confirm('⚠️ Delete ALL transactions and files? This cannot be undone!')) return

    localStorage.removeItem('transactions')
    localStorage.removeItem('uploadedFiles')

    // Verify deletion
    const verifyTx = localStorage.getItem('transactions')
    const verifyFiles = localStorage.getItem('uploadedFiles')
    console.log("[v0] ✅ Actually deleted: tx null?", verifyTx === null, "files null?", verifyFiles === null)

    setTransactions([])
    setUploadedFiles([])
    setUploadSuccess('✅ All data deleted')

    // 🆕 ADD THESE 2 LINES:
    window.dispatchEvent(new Event('transactionsUpdated'))
    setTimeout(() => window.location.reload(), 500)

    setTimeout(() => setUploadSuccess(''), 3000)
  }


  const parseCSV = (text: string): string[][] => {
    const result: string[][] = []
    let current = ''
    let inQuotes = false
    let row: string[] = []

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++
        }
        if (current || row.length > 0) {
          row.push(current.trim())
          if (row.some(cell => cell)) {
            result.push(row)
          }
          row = []
          current = ''
        }
      } else {
        current += char
      }
    }

    if (current || row.length > 0) {
      row.push(current.trim())
      if (row.some(cell => cell)) {
        result.push(row)
      }
    }

    return result
  }

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0]

    try {
      let date = new Date(dateStr)

      if (isNaN(date.getTime())) {
        const parts = dateStr.split(/[\/\-]/)
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1
          const day = parseInt(parts[1])
          const year = parseInt(parts[2])
          date = new Date(year, month, day)
        }
      }

      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0]
      }

      return date.toISOString().split('T')[0]
    } catch {
      return new Date().toISOString().split('T')[0]
    }
  }

  const detectTransactionType = (typeStr: string, description?: string): Transaction['type'] => {
    const normalized = typeStr.toUpperCase().trim()

    if (normalized === 'BUY' || normalized.includes('PURCHASE') || normalized === 'BTO' || normalized === 'Buy') return 'BUY'
    if (normalized === 'SELL' || normalized.includes('SALE') || normalized === 'STC' || normalized === 'Sell') return 'SELL'
    if (normalized === 'CDIV' || normalized.includes('DIV') || normalized.includes('DIVIDEND')) return 'DIVIDEND'
    if (normalized === 'DCF' || normalized.includes('DEPOSIT') || normalized.includes('CASH IN') ||
      (description && description.toLowerCase().includes('transfer'))) return 'DEPOSIT'
    if (normalized.includes('WITHDRAWAL') || normalized.includes('CASH OUT')) return 'WITHDRAWAL'
    if (normalized === 'SLIP' || normalized.includes('STOCK LENDING')) return 'DIVIDEND'
    if (normalized === 'INT' || normalized.includes('INTEREST')) return 'DIVIDEND'

    return 'BUY'
  }

  // ============================================================
  // PASTE THESE FUNCTIONS inside TransactionsPage component,
  // REPLACING everything from parseFidelityCSV down through
  // the end of parseTransactionsFromCSV
  // ============================================================

  // ── Shared helpers ──────────────────────────────────────────

  const cleanNum = (val: string) =>
    parseFloat((val || '0').replace(/[$,()%\s]/g, '').replace(/^\((.+)\)$/, '-$1') || '0')

  const detectType = (raw: string): Transaction['type'] | null => {
    const s = raw.toUpperCase().trim()
    if (s.includes('BUY') || s.includes('PURCHASE') || s === 'BTO' || s.includes('REINVEST')) return 'BUY'
    if (s.includes('SELL') || s.includes('SALE') || s === 'STC' || s.includes('YOU SOLD')) return 'SELL'
    if (s === 'CDIV' || s === 'MDIV' || s.includes('DIVIDEND') || s.includes('DIV') || s === 'INT' || s.includes('INTEREST') || s === 'SLIP') return 'DIVIDEND'
    if (s === 'DCF' || s.includes('DEPOSIT') || s.includes('CONTRIBUTION') || s.includes('WIRE IN') || s.includes('ACH IN')) return 'DEPOSIT'
    if (s.includes('WITHDRAW') || s.includes('DISTRIBUTION') || s.includes('WIRE OUT') || s.includes('ACH OUT')) return 'WITHDRAWAL'
    return null
  }

  const makeId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

  // ── Broker detection ────────────────────────────────────────

  const detectBroker = (headers: string[]): string => {
    const h = headers.join(',')
    if (h.includes('run date') && h.includes('action') && h.includes('account number')) return 'fidelity'
    if (h.includes('side') && h.includes('filled') && h.includes('avg price') && h.includes('placed time')) return 'webull'
    if (h.includes('activity date') && h.includes('trans code') && h.includes('instrument')) return 'robinhood'
    if (h.includes('date') && h.includes('action') && h.includes('symbol') && h.includes('fees & comm')) return 'schwab'
    if (h.includes('transaction id') && h.includes('reg fee')) return 'tdameritrade'
    if (h.includes('transactiondate') || (h.includes('transactiontype') && h.includes('securitytype'))) return 'etrade'
    if (h.includes('net amount') && h.includes('gross amount') && h.includes('commission') && h.includes('time')) return 'merrill'
    if (h.includes('share price') && h.includes('total cost') && !h.includes('avg price')) return 'sofi'
    if (h.includes('trade date') && h.includes('principal') && h.includes('net amount') && !h.includes('commission ($)')) return 'chase'
    if (h.includes('action') && h.includes('net amount') && h.includes('commission') && h.includes('time') && !h.includes('account number')) return 'ally'
    if (h.includes('clientaccountid') || (h.includes('buy/sell') && h.includes('tradeprice'))) return 'ibkr'
    if (h.includes('trade date') && h.includes('transaction type') && h.includes('investment name')) return 'vanguard'
    return 'generic'
  }

  // ── Fidelity ────────────────────────────────────────────────
  // Columns: Run Date, Account, Account Number, Action, Symbol,
  //          Description, Type, Price ($), Quantity, Commission ($),
  //          Fees ($), Accrued Interest ($), Amount ($), Settlement Date

  const parseFidelityCSV = (csvData: string[][], fileId: string): Transaction[] => {
    const headerIdx = csvData.findIndex(r => r.some(c => c.toLowerCase().includes('run date')))
    if (headerIdx === -1) throw new Error('Cannot find header row in Fidelity CSV')
    const headers = csvData[headerIdx].map(h => h.toLowerCase().trim().replace(/\s*\(\$\)\s*/g, '').trim())
    const rows = csvData.slice(headerIdx + 1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('run date'), actionIdx = col('action'), symbolIdx = col('symbol')
    const priceIdx = col('price'), qtyIdx = col('quantity'), amountIdx = col('amount')
    const commIdx = col('commission'), feesIdx = col('fees')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const action = (row[actionIdx] || '').toUpperCase()
      const symbol = (row[symbolIdx] || '').trim()
      if (!action || symbol === 'SPAXX' || !symbol) return []

      let type: Transaction['type']
      if (action.includes('YOU BOUGHT') || action.includes('REINVEST')) type = 'BUY'
      else if (action.includes('YOU SOLD')) type = 'SELL'
      else if (action.includes('DIVIDEND') || action.includes('INTEREST')) type = 'DIVIDEND'
      else if (action.includes('CONTRIBUTION') || action.includes('DEPOSIT')) type = 'DEPOSIT'
      else return []

      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const amount = Math.abs(cleanNum(row[amountIdx] || '0'))
      const fees = Math.abs(cleanNum(row[commIdx] || '0')) + Math.abs(cleanNum(row[feesIdx] || '0'))
      const total = amount || qty * price
      if (total === 0 && qty === 0) return []

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── Webull ──────────────────────────────────────────────────
  // Columns: Name, Symbol, Side, Status, Filled, Total Qty,
  //          Price, Avg Price, Time-in-Force, Placed Time, Filled Time

  const parseWebullCSV = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const symbolIdx = col('symbol'), sideIdx = col('side'), statusIdx = col('status')
    const filledIdx = col('filled'), avgPriceIdx = col('avg price'), dateIdx = col('filled time')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const status = (row[statusIdx] || '').trim()
      if (status.toLowerCase() !== 'filled') return []

      const side = (row[sideIdx] || '').toUpperCase()
      const type: Transaction['type'] = side === 'BUY' ? 'BUY' : side === 'SELL' ? 'SELL' : null
      if (!type) return []

      const symbol = (row[symbolIdx] || '').trim()
      if (!symbol) return []

      // Filled Time looks like "10/06/2025 10:07:14 EDT"
      const rawDate = (row[dateIdx] || '').split(' ')[0]
      const shares = Math.abs(cleanNum(row[filledIdx] || '0'))
      const price = Math.abs(cleanNum(row[avgPriceIdx] || '0'))
      const total = shares * price

      return [{
        id: makeId(), date: parseDate(rawDate), type, symbol,
        shares, price, total, broker: '', fees: 0, fileId
      }]
    })
  }

  // ── Charles Schwab ──────────────────────────────────────────
  // Columns: Date, Action, Symbol, Description, Quantity, Price,
  //          Fees & Comm, Amount
  // Note: Schwab CSV has a few header/footer lines to skip

  const parseSchwabCSV = (csvData: string[][], fileId: string): Transaction[] => {
    const headerIdx = csvData.findIndex(r =>
      r.some(c => c.toLowerCase().trim() === 'date') &&
      r.some(c => c.toLowerCase().trim() === 'action')
    )
    if (headerIdx === -1) throw new Error('Cannot find header in Schwab CSV')
    const headers = csvData[headerIdx].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(headerIdx + 1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('date'), actionIdx = col('action'), symbolIdx = col('symbol')
    const qtyIdx = col('quantity'), priceIdx = col('price')
    const feesIdx = col('fees'), amountIdx = col('amount')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const action = (row[actionIdx] || '').trim()
      const symbol = (row[symbolIdx] || '').trim()
      if (!action || !symbol) return []

      const type = detectType(action)
      if (!type) return []

      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const amount = Math.abs(cleanNum(row[amountIdx] || '0'))
      const fees = Math.abs(cleanNum(row[feesIdx] || '0'))
      const total = amount || qty * price
      if (total === 0) return []

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── TD Ameritrade ───────────────────────────────────────────
  // Columns: DATE, TRANSACTION ID, DESCRIPTION, QUANTITY, SYMBOL,
  //          PRICE, COMMISSION, AMOUNT, REG FEE, ...

  const parseTDAmeritrade = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('date'), descIdx = col('description'), symbolIdx = col('symbol')
    const qtyIdx = col('quantity'), priceIdx = col('price')
    const commIdx = col('commission'), amountIdx = col('amount'), regFeeIdx = col('reg fee')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const desc = (row[descIdx] || '').toUpperCase()
      const symbol = (row[symbolIdx] || '').trim()
      if (!desc || !symbol) return []

      const type = detectType(desc)
      if (!type) return []

      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const amount = Math.abs(cleanNum(row[amountIdx] || '0'))
      const fees = Math.abs(cleanNum(row[commIdx] || '0')) + Math.abs(cleanNum(row[regFeeIdx] || '0'))
      const total = amount || qty * price

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── E*TRADE ─────────────────────────────────────────────────
  // Columns: TransactionDate, TransactionType, SecurityType,
  //          Symbol, Quantity, Amount, Price, Commission, Description

  const parseEtrade = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().replace(/\s+/g, '').trim())
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('transactiondate') !== -1 ? col('transactiondate') : col('date')
    const typeIdx = col('transactiontype') !== -1 ? col('transactiontype') : col('type')
    const symbolIdx = col('symbol'), qtyIdx = col('quantity')
    const priceIdx = col('price'), amountIdx = col('amount'), commIdx = col('commission')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const symbol = (row[symbolIdx] || '').trim()
      const rawType = (row[typeIdx] || '').trim()
      if (!symbol || !rawType) return []

      const type = detectType(rawType)
      if (!type) return []

      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const amount = Math.abs(cleanNum(row[amountIdx] || '0'))
      const fees = Math.abs(cleanNum(row[commIdx] || '0'))
      const total = amount || qty * price

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── Merrill Edge ────────────────────────────────────────────
  // Columns: Date, Time, Type, Quantity, Symbol, Price,
  //          Gross Amount, Commission, Net Amount, Description

  const parseMerrillEdge = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('date'), typeIdx = col('type'), symbolIdx = col('symbol')
    const qtyIdx = col('quantity'), priceIdx = col('price')
    const commIdx = col('commission'), netIdx = col('net amount')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const symbol = (row[symbolIdx] || '').trim()
      const rawType = (row[typeIdx] || '').trim()
      if (!symbol || !rawType) return []

      const type = detectType(rawType)
      if (!type) return []

      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const amount = Math.abs(cleanNum(row[netIdx] || '0'))
      const fees = Math.abs(cleanNum(row[commIdx] || '0'))
      const total = amount || qty * price

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── SoFi ────────────────────────────────────────────────────
  // Columns: Date, Symbol, Type, Shares, Share Price, Total Cost, Description

  const parseSoFi = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('date'), symbolIdx = col('symbol'), typeIdx = col('type')
    const sharesIdx = col('shares'), priceIdx = col('share price'), totalIdx = col('total cost')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const symbol = (row[symbolIdx] || '').trim()
      const rawType = (row[typeIdx] || '').trim()
      if (!symbol || !rawType) return []

      const type = detectType(rawType)
      if (!type) return []

      const shares = Math.abs(cleanNum(row[sharesIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const total = Math.abs(cleanNum(row[totalIdx] || '0')) || shares * price

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares, price, total, broker: '', fees: 0, fileId
      }]
    })
  }

  // ── Chase (You Invest) ───────────────────────────────────────
  // Columns: Trade Date, Symbol, Type, Quantity, Price,
  //          Principal, Fees, Net Amount

  const parseChase = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('trade date'), symbolIdx = col('symbol'), typeIdx = col('type')
    const qtyIdx = col('quantity'), priceIdx = col('price')
    const feesIdx = col('fees'), netIdx = col('net amount')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const symbol = (row[symbolIdx] || '').trim()
      const rawType = (row[typeIdx] || '').trim()
      if (!symbol || !rawType) return []

      const type = detectType(rawType)
      if (!type) return []

      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const total = Math.abs(cleanNum(row[netIdx] || '0')) || qty * price
      const fees = Math.abs(cleanNum(row[feesIdx] || '0'))

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── Ally Invest ─────────────────────────────────────────────
  // Columns: Date, Time, Action, Symbol, Description, Quantity,
  //          Price, Commission, Net Amount

  const parseAlly = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('date'), actionIdx = col('action'), symbolIdx = col('symbol')
    const qtyIdx = col('quantity'), priceIdx = col('price')
    const commIdx = col('commission'), netIdx = col('net amount')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const symbol = (row[symbolIdx] || '').trim()
      const rawType = (row[actionIdx] || '').trim()
      if (!symbol || !rawType) return []

      const type = detectType(rawType)
      if (!type) return []

      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const total = Math.abs(cleanNum(row[netIdx] || '0')) || qty * price
      const fees = Math.abs(cleanNum(row[commIdx] || '0'))

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── Interactive Brokers ─────────────────────────────────────
  // Columns: ClientAccountID, Currency, Symbol, DateTime,
  //          Quantity, TradePrice, IBCommission, NetCash, Buy/Sell

  const parseIBKR = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim().replace(/\//g, ''))
    const rows = csvData.slice(1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('datetime'), symbolIdx = col('symbol')
    const qtyIdx = col('quantity'), priceIdx = col('tradeprice')
    const commIdx = col('ibcommission'), netIdx = col('netcash')
    const sideIdx = col('buysell')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const symbol = (row[symbolIdx] || '').trim()
      const side = (row[sideIdx] || '').trim().toUpperCase()
      if (!symbol || !side) return []

      const type: Transaction['type'] = side === 'BUY' ? 'BUY' : side === 'SELL' ? 'SELL' : null
      if (!type) return []

      const rawDate = (row[dateIdx] || '').split(',')[0].split(' ')[0]
      const qty = Math.abs(cleanNum(row[qtyIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const total = Math.abs(cleanNum(row[netIdx] || '0')) || qty * price
      const fees = Math.abs(cleanNum(row[commIdx] || '0'))

      return [{
        id: makeId(), date: parseDate(rawDate), type, symbol,
        shares: qty, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── Vanguard ─────────────────────────────────────────────────
  // Columns: Trade date, Settlement date, Transaction type,
  //          Transaction description, Investment name, Symbol,
  //          Shares, Share price, Principal amount, Commission fees,
  //          Net amount, Accrued interest, Account type

  const parseVanguard = (csvData: string[][], fileId: string): Transaction[] => {
    const headerIdx = csvData.findIndex(r => r.some(c => c.toLowerCase().includes('trade date')))
    if (headerIdx === -1) throw new Error('Cannot find header in Vanguard CSV')
    const headers = csvData[headerIdx].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(headerIdx + 1)

    const col = (name: string) => headers.findIndex(h => h.includes(name))
    const dateIdx = col('trade date'), typeIdx = col('transaction type')
    const symbolIdx = col('symbol'), sharesIdx = col('shares')
    const priceIdx = col('share price'), netIdx = col('net amount')
    const commIdx = col('commission')

    return rows.flatMap(row => {
      if (!row.length || row.every(c => !c.trim())) return []
      const symbol = (row[symbolIdx] || '').trim()
      const rawType = (row[typeIdx] || '').trim()
      if (!symbol || !rawType) return []

      const type = detectType(rawType)
      if (!type) return []

      const shares = Math.abs(cleanNum(row[sharesIdx] || '0'))
      const price = Math.abs(cleanNum(row[priceIdx] || '0'))
      const total = Math.abs(cleanNum(row[netIdx] || '0')) || shares * price
      const fees = Math.abs(cleanNum(row[commIdx] || '0'))

      return [{
        id: makeId(), date: parseDate(row[dateIdx] || ''), type, symbol,
        shares, price, total, broker: '', fees, fileId
      }]
    })
  }

  // ── Master parser (auto-detects broker) ─────────────────────

  const parseTransactionsFromCSV = (csvData: string[][], fileId: string): Transaction[] => {
    if (csvData.length < 2) throw new Error('CSV must have at least a header and one data row')

    // Find first non-empty row for header detection
    const firstRow = csvData.find(r => r.some(c => c.trim())) || csvData[0]
    const headers = firstRow.map(h => h.toLowerCase().trim().replace(/\s*\(\$\)\s*/g, '').trim())
    const broker = detectBroker(headers)

    console.log('[CSV Parser] Detected broker format:', broker)

    switch (broker) {
      case 'fidelity': return parseFidelityCSV(csvData, fileId)
      case 'webull': return parseWebullCSV(csvData, fileId)
      case 'schwab': return parseSchwabCSV(csvData, fileId)
      case 'tdameritrade': return parseTDAmeritrade(csvData, fileId)
      case 'etrade': return parseEtrade(csvData, fileId)
      case 'merrill': return parseMerrillEdge(csvData, fileId)
      case 'sofi': return parseSoFi(csvData, fileId)
      case 'chase': return parseChase(csvData, fileId)
      case 'ally': return parseAlly(csvData, fileId)
      case 'ibkr': return parseIBKR(csvData, fileId)
      case 'vanguard': return parseVanguard(csvData, fileId)
      default: return parseRobinhoodCSV(csvData, fileId) // fallback
    }
  }

  // ── Robinhood (original, kept as fallback) ───────────────────

  const parseRobinhoodCSV = (csvData: string[][], fileId: string): Transaction[] => {
    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const dateIdx = headers.findIndex(h => h.includes('activity date') || h.includes('date'))
    const typeIdx = headers.findIndex(h => h.includes('trans code') || h.includes('type') || h.includes('action'))
    const symbolIdx = headers.findIndex(h => h.includes('instrument') || h.includes('symbol') || h.includes('ticker'))
    const descriptionIdx = headers.findIndex(h => h.includes('description'))
    const sharesIdx = headers.findIndex(h => h.includes('quantity') || h.includes('shares'))
    const priceIdx = headers.findIndex(h => h.includes('price') && !h.includes('settle'))
    const totalIdx = headers.findIndex(h => h.includes('amount') || h.includes('total'))
    const feesIdx = headers.findIndex(h => h.includes('fee') || h.includes('commission'))

    if (dateIdx === -1) throw new Error('CSV must contain a "Date" column')

    const parsedTransactions: Transaction[] = []

    for (const row of rows) {
      if (!row.length || row.every(c => !c.trim())) continue
      if (row[0]?.toLowerCase().includes('the data provided')) continue

      try {
        const rawDate = row[dateIdx] || ''
        const rawType = typeIdx !== -1 ? (row[typeIdx] || '') : ''
        const rawDescription = descriptionIdx !== -1 ? (row[descriptionIdx] || '') : ''
        const rawSymbol = symbolIdx !== -1 ? (row[symbolIdx] || '').toUpperCase().trim() : ''

        if (!rawDate || !rawType.trim()) continue

        const date = parseDate(rawDate)
        const type = detectTransactionType(rawType, rawDescription)

        let symbol = rawSymbol
        if (!symbol && rawDescription) {
          const m = rawDescription.match(/^([A-Z]{1,5})\s/)
          if (m) symbol = m[1]
        }
        if (!symbol && (type === 'DIVIDEND' || type === 'DEPOSIT' || type === 'WITHDRAWAL')) symbol = '-'
        if (!symbol && (type === 'BUY' || type === 'SELL')) continue

        const rawShares = sharesIdx !== -1 ? (row[sharesIdx] || '0') : '0'
        const rawPrice = priceIdx !== -1 ? (row[priceIdx] || '0') : '0'
        const rawTotal = totalIdx !== -1 ? (row[totalIdx] || '0') : '0'

        let shares = parseFloat(rawShares.replace(/[^0-9.-]/g, '') || '0')
        let price = parseFloat(rawPrice.replace(/[$,()]/g, '') || '0')

        if (type === 'DIVIDEND') {
          const description = row[4] || ''
          const sharesMatch = description.match(/(\d+\.?\d*)\s+shares/)
          if (sharesMatch) shares = parseFloat(sharesMatch[1])
          const rateMatch = description.match(/at\s+(\d+\.?\d*)/)
          if (rateMatch) price = parseFloat(rateMatch[1])
        }

        let total = 0
        if (type === 'DIVIDEND' && row.length > 8 && row[8]) {
          total = parseFloat(row[8].replace(/[$,]/g, '') || '0')
        } else if (rawTotal) {
          total = parseFloat(rawTotal.replace(/[$,()]/g, '').replace(/^\(/, '-').replace(/\)$/, '') || '0')
        }

        if (rawTotal.includes('(') && rawTotal.includes(')') && !rawTotal.startsWith('-')) {
          total = -Math.abs(total)
        }

        if (total === 0 && shares > 0 && price > 0) {
          total = shares * price
          if (type === 'BUY') total = -Math.abs(total)
        }

        const fees = feesIdx !== -1 ? parseFloat(row[feesIdx]?.replace(/[$,]/g, '') || '0') : 0

        parsedTransactions.push({
          id: makeId(),
          date, type,
          symbol: symbol || '-',
          shares: Math.abs(shares),
          price: Math.abs(price),
          total: Math.abs(total),
          broker: '', fees, fileId
        })
      } catch (err) {
        console.error('Error parsing row:', err)
      }
    }

    return parsedTransactions
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploadSuccess('')

    try {
      const text = await file.text()
      const csvData = parseCSV(text)

      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const newTransactions = parseTransactionsFromCSV(csvData, fileId)

      if (newTransactions.length === 0) {
        throw new Error('No valid transactions found in the file')
      }

      setPendingFile({ data: newTransactions, originalName: file.name })
      setFileName(file.name.replace('.csv', ''))

      event.target.value = ''
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse file'
      setUploadError(errorMessage)
      console.error('Error parsing file:', err)
    }
  }

  const confirmFileUpload = async () => {
    if (!pendingFile || !fileName.trim()) {
      alert('Please enter a file name')
      return
    }

    const fileId = Date.now().toString()

    const updatedTransactions = pendingFile.data.map(tx => ({
      ...tx,
      broker: fileName.trim(),
      fileId: fileId
    }))

    try {
      // Save each transaction to Supabase via API
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: updatedTransactions })
      })

      if (!response.ok) {
        throw new Error('Failed to save transactions to server')
      }

      // Reload all transactions from Supabase
      const freshTransactions = await getTransactionsFromStorage()
      setTransactions(freshTransactions)

      // Save file record to localStorage
      const newFile: UploadedFile = {
        id: fileId,
        name: fileName.trim(),
        uploadDate: new Date().toISOString(),
        transactionCount: updatedTransactions.length
      }
      const allFiles = [...uploadedFiles, newFile]
      setUploadedFiles(allFiles)
      localStorage.setItem('uploadedFiles', JSON.stringify(allFiles))

      setUploadSuccess(`✅ Successfully imported ${updatedTransactions.length} transaction${updatedTransactions.length > 1 ? 's' : ''} from "${fileName}"`)
      window.dispatchEvent(new Event('transactionsUpdated'))
    } catch (error) {
      console.error('[transactions-page] Error saving transactions:', error)
      setUploadError('Failed to save transactions. Please try again.')
      setTimeout(() => setUploadError(''), 5000)
    }

    setPendingFile(null)
    setFileName('')
    setTimeout(() => setUploadSuccess(''), 5000)
  }

  const cancelFileUpload = () => {
    setPendingFile(null)
    setFileName('')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'BUY':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case 'SELL':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case 'DIVIDEND':
        return <span className="text-yellow-500 text-xs font-bold">DIV</span>
      case 'DEPOSIT':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />
      case 'WITHDRAWAL':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />
    }
  }

  const getTypeBadge = (type: Transaction['type']) => {
    const variants: Record<Transaction['type'], string> = {
      BUY: 'bg-green-500/20 text-green-500',
      SELL: 'bg-red-500/20 text-red-500',
      DIVIDEND: 'bg-yellow-500/20 text-yellow-500',
      DEPOSIT: 'bg-blue-500/20 text-blue-500',
      WITHDRAWAL: 'bg-orange-500/20 text-orange-500'
    }
    return (
      <Badge variant="outline" className={variants[type]}>
        {type}
      </Badge>
    )
  }

  const activeFiltersCount = [
    filterType !== 'all',
    searchSymbol,
    dateFrom,
    dateTo,
    minPrice,
    maxPrice,
    minTotal,
    maxTotal
  ].filter(Boolean).length

  return (
    <div className="p-4 lg:p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage and track all your investment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => contextRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Enter the details of your transaction manually.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as Transaction['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">Buy</SelectItem>
                        <SelectItem value="SELL">Sell</SelectItem>
                        <SelectItem value="DIVIDEND">Dividend</SelectItem>
                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                        <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Ticker Symbol</Label>
                    <Input
                      id="symbol"
                      placeholder="e.g., AAPL"
                      value={newTransaction.symbol}
                      onChange={(e) => setNewTransaction({ ...newTransaction, symbol: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shares">Shares</Label>
                    <Input
                      id="shares"
                      type="number"
                      placeholder="0"
                      value={newTransaction.shares}
                      onChange={(e) => setNewTransaction({ ...newTransaction, shares: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Share</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newTransaction.price}
                      onChange={(e) => setNewTransaction({ ...newTransaction, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees">Fees (optional)</Label>
                    <Input
                      id="fees"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newTransaction.fees}
                      onChange={(e) => setNewTransaction({ ...newTransaction, fees: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broker">Broker (optional)</Label>
                  <Select
                    value={newTransaction.broker}
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, broker: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map((broker) => (
                        <SelectItem key={broker} value={broker}>{broker}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddTransaction}>Add Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {pendingFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Name Your Import</h3>
            <p className="text-muted-foreground mb-4">
              Found {pendingFile.data.length} transactions. Give this import a name:
            </p>
            <Input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., Robinhood 2025 Q1"
              className="mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && confirmFileUpload()}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={cancelFileUpload} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={confirmFileUpload} className="flex-1">
                Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <Alert className="bg-green-500/10 border-green-500/50">
          <AlertCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {uploadSuccess}
          </AlertDescription>
        </Alert>
      )}

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invested (Buy)</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sold</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSold)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dividends</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDividends)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Symbols</p>
                  <p className="text-2xl font-bold">{uniqueSymbols.size}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Transactions</CardTitle>
            <CardDescription>Upload transaction history from your broker</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upload">File Upload</TabsTrigger>
                <TabsTrigger value="brokers">Broker Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Upload Transaction File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports CSV files from Robinhood, Fidelity, etc.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button asChild>
                        <span>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Choose File
                        </span>
                      </Button>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="brokers">
                <div className="grid sm:grid-cols-2 gap-4">
                  {['Robinhood', 'Fidelity', 'Charles Schwab', 'Webull'].map((broker) => (
                    <Card key={broker} className="cursor-pointer hover:bg-secondary/50 transition-colors">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg font-bold">{broker[0]}</span>
                        </div>
                        <p className="font-medium text-sm">{broker}</p>
                        <Button variant="link" size="sm" className="mt-2 h-auto p-0">
                          <Download className="h-3 w-3 mr-1" />
                          Download Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Imported Files ({uploadedFiles.length})</CardTitle>
              {uploadedFiles.length > 0 && (
                <Button variant="ghost" size="sm" onClick={deleteAllData} className="text-destructive">
                  Delete All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No files imported yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.transactionCount} transactions • {new Date(file.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFile(file.id)}
                      className="ml-3 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-lg">Filters</CardTitle>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount} active</Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-symbol" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Symbol
              </Label>
              <Input
                id="search-symbol"
                placeholder="e.g., CELH, LULU"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-type">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                  <SelectItem value="DIVIDEND">Dividend</SelectItem>
                  <SelectItem value="DEPOSIT">Deposit</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-price">Min Price</Label>
              <Input
                id="min-price"
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-price">Max Price</Label>
              <Input
                id="max-price"
                type="number"
                step="0.01"
                placeholder="$999.99"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-total">Min Total</Label>
              <Input
                id="min-total"
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-total">Max Total</Label>
              <Input
                id="max-total"
                type="number"
                step="0.01"
                placeholder="$9999.99"
                value={maxTotal}
                onChange={(e) => setMaxTotal(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Transaction History ({filteredTransactions.length} of {transactions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Show:</Label>
              <Select value={rowsPerPage.toString()} onValueChange={(value) => {
                setRowsPerPage(parseInt(value))
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {transactions.length === 0
                        ? 'No transactions found. Add your first transaction or import from a broker.'
                        : 'No transactions match your filters. Try adjusting your search criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          {getTypeBadge(transaction.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{transaction.symbol}</TableCell>
                      <TableCell className="text-right">{transaction.shares || '-'}</TableCell>
                      <TableCell className="text-right">
                        {transaction.price ? formatCurrency(transaction.price) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.total)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{transaction.broker}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.fees > 0 ? formatCurrency(transaction.fees) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
