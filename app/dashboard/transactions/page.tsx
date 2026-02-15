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
import { saveTransactionsToStorage, getTransactionsFromStorage } from "@/lib/transaction-storage"

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
  const [transactions, setTransactions] = useState<Transaction[]>([])
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

  // Load data from localStorage on mount
  useEffect(() => {
    loadDataFromStorage()
  }, [])

  const loadDataFromStorage = () => {
    const storedTransactions = localStorage.getItem('transactions')
    const storedFiles = localStorage.getItem('uploadedFiles')
    
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions))
    }
    if (storedFiles) {
      setUploadedFiles(JSON.parse(storedFiles))
    }
  }

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

  const handleAddTransaction = () => {
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
    
    const updatedTransactions = [transaction, ...transactions]
    setTransactions(updatedTransactions)
    
    // Save to storage with verification
    saveTransactionsToStorage(updatedTransactions)
    const verifyTransaction = localStorage.getItem('portfolio-transactions')
    console.log("[v0] ✅ Actually saved transaction:", verifyTransaction !== null, "| Total count:", JSON.parse(verifyTransaction || '[]').length)
    
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

  const handleDeleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id)
    setTransactions(updatedTransactions)
    saveTransactionsToStorage(updatedTransactions)
  }

  const deleteFile = (fileId: string) => {
    const fileToDelete = uploadedFiles.find(f => f.id === fileId)
    if (!fileToDelete) return

    if (!confirm(`Delete "${fileToDelete.name}" and all its ${fileToDelete.transactionCount} transactions?`)) {
      return
    }

// Delete file from list
const updatedFiles = uploadedFiles.filter(f => f.id !== fileId)
setUploadedFiles(updatedFiles)
localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles))

// Delete transactions from that file
const updatedTransactions = transactions.filter(tx => tx.fileId !== fileId)
setTransactions(updatedTransactions)
saveTransactionsToStorage(updatedTransactions)

setUploadSuccess(`✅ Deleted "${fileToDelete.name}" and ${fileToDelete.transactionCount} transactions`)

// 🆕 ADD THIS LINE:
window.dispatchEvent(new Event('transactionsUpdated'))

setTimeout(() => setUploadSuccess(''), 3000)

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

  const parseTransactionsFromCSV = (csvData: string[][], fileId: string): Transaction[] => {
    if (csvData.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row')
    }

    const headers = csvData[0].map(h => h.toLowerCase().trim())
    const rows = csvData.slice(1)

    const dateIdx = headers.findIndex(h => 
      h.includes('activity date') || h.includes('date') || h.includes('time')
    )
    const typeIdx = headers.findIndex(h => 
      h.includes('trans code') || h.includes('type') || h.includes('action') || h.includes('transaction')
    )
    const symbolIdx = headers.findIndex(h => 
      h.includes('instrument') || h.includes('symbol') || h.includes('ticker') || h.includes('stock')
    )
    const descriptionIdx = headers.findIndex(h =>
      h.includes('description')
    )
    const sharesIdx = headers.findIndex(h => 
      h.includes('quantity') || h.includes('shares') || h.includes('qty')
    )
    const priceIdx = headers.findIndex(h => 
      h.includes('price') && !h.includes('settle')
    )
    const totalIdx = headers.findIndex(h => 
      h.includes('amount') || h.includes('total') || h.includes('value')
    )
    const feesIdx = headers.findIndex(h => 
      h.includes('fee') || h.includes('commission')
    )

    if (dateIdx === -1) {
      throw new Error('CSV must contain a "Date" column')
    }

    const parsedTransactions: Transaction[] = []

    for (const row of rows) {
      if (row.length === 0 || row.every(cell => !cell.trim())) continue
      if (row[0] && row[0].toLowerCase().includes('the data provided')) continue

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
          const symbolMatch = rawDescription.match(/^([A-Z]{1,5})\s/)
          if (symbolMatch) {
            symbol = symbolMatch[1]
          }
        }
        
        if (!symbol && (type === 'DIVIDEND' || type === 'DEPOSIT' || type === 'WITHDRAWAL')) {
          symbol = '-'
        }
        
        if (!symbol && (type === 'BUY' || type === 'SELL')) {
          continue
        }
        
        const rawShares = sharesIdx !== -1 ? (row[sharesIdx] || '0') : '0'
        const rawPrice = priceIdx !== -1 ? (row[priceIdx] || '0') : '0'
        const rawTotal = totalIdx !== -1 ? (row[totalIdx] || '0') : '0'
        
        let shares = parseFloat(rawShares.replace(/[^0-9.-]/g, '') || '0')
        let price = parseFloat(rawPrice.replace(/[$,()]/g, '').replace(/\(/g, '-') || '0')
        
        // Special handling for CDIV (dividend) - extract from description and column 9
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
        }
        
        // Special handling for CDIV (dividend) - use column 9 (index 8) directly
        let total = 0
        if (type === 'DIVIDEND' && row.length > 8 && row[8]) {
          // For CDIV rows, column 9 (index 8) contains the dividend amount
          total = parseFloat(row[8].replace(/[$,]/g, '') || '0')
        } else if (rawTotal) {
          // Otherwise use the normal total column
          total = parseFloat(rawTotal.replace(/[$,()]/g, '').replace(/^\(/, '-').replace(/\)$/, '') || '0')
        }
        
        if (rawTotal.includes('(') && rawTotal.includes(')') && !rawTotal.startsWith('-')) {
          total = -Math.abs(total)
        }
        
        const fees = feesIdx !== -1 ? parseFloat(row[feesIdx]?.replace(/[$,]/g, '') || '0') : 0

        if (total === 0 && shares > 0 && price > 0) {
          total = shares * price
          if (type === 'BUY') {
            total = -Math.abs(total)
          }
        }
        
        const displayTotal = Math.abs(total)

        parsedTransactions.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date,
          type,
          symbol: symbol || '-',
          shares: Math.abs(shares),
          price: Math.abs(price),
          total: displayTotal,
          broker: '',
          fees,
          fileId
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

  const confirmFileUpload = () => {
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

    const allTransactions = [...updatedTransactions, ...transactions]
    setTransactions(allTransactions)
    
    // Save to storage with verification
    saveTransactionsToStorage(allTransactions)
    const verifyTransaction = localStorage.getItem('portfolio-transactions')
    console.log("[v0] ✅ Actually saved:", verifyTransaction !== null, "| Count:", JSON.parse(verifyTransaction || '[]').length)

    const newFile: UploadedFile = {
      id: fileId,
      name: fileName.trim(),
      uploadDate: new Date().toISOString(),
      transactionCount: updatedTransactions.length
    }
    const allFiles = [...uploadedFiles, newFile]
    setUploadedFiles(allFiles)
    
    // Actually save to localStorage with verification
    const filesData = JSON.stringify(allFiles)
    localStorage.setItem('uploadedFiles', filesData)
    const verifyFiles = localStorage.getItem('uploadedFiles')
    console.log("[v0] ✅ Actually saved files:", verifyFiles !== null, "| Count:", JSON.parse(verifyFiles || '[]').length)

    setUploadSuccess(`✅ Successfully imported ${updatedTransactions.length} transaction${updatedTransactions.length > 1 ? 's' : ''} from "${fileName}"`)
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
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage and track all your investment transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2 bg-transparent" 
            onClick={() => window.location.reload()}
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
