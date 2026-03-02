'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LineChart, ArrowLeft, Upload, Download, PieChart, BarChart3,
  CreditCard, Percent, DollarSign, Calendar, Snowflake, Flame
} from 'lucide-react'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CardDebt {
  name: string
  balance: number
  apr: number
  minPayment: number
  csvData?: any[]
}

interface Strategy {
  name: string
  description: string
  icon: React.ReactNode
}

const strategies: Strategy[] = [
  {
    name: 'Snowball',
    description: 'Pay smallest balance first (motivational)',
    icon: <Snowflake className="h-4 w-4" />,
  },
  {
    name: 'Avalanche',
    description: 'Pay highest APR first (saves money)',
    icon: <Flame className="h-4 w-4" />,
  },
  {
    name: 'Hybrid',
    description: 'Balance momentum and interest savings',
    icon: <BarChart3 className="h-4 w-4" />,
  },
]

export default function DebtCalculatorPage() {
  const [cards, setCards] = useState<CardDebt[]>([])
  const [csvFiles, setCsvFiles] = useState<{ [key: string]: File }>({})
  const [csvData, setCsvData] = useState<{ [key: string]: any[] }>({})
  const [selectedStrategy, setSelectedStrategy] = useState('avalanche')
  const [extraPayment, setExtraPayment] = useState(100)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newCsvFiles: { [key: string]: File } = {}
    const newCsvData: { [key: string]: any[] } = {}

    for (const file of files) {
      const text = await file.text()
      const rows = text.split('\n').slice(1) // Skip header
      const parsedRows = rows.map(row => {
        const cols = row.split(',')
        return {
          date: cols[0],
          description: cols[1],
          amount: parseFloat(cols[2]) || 0,
        }
      }).filter(row => row.amount > 0)

      newCsvFiles[file.name] = file
      newCsvData[file.name] = parsedRows
    }

    setCsvFiles(newCsvFiles)
    setCsvData(newCsvData)
  }

  const addCard = () => {
    setCards([...cards, { name: '', balance: 0, apr: 0, minPayment: 0 }])
  }
