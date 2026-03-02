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

  const updateCard = (index: number, field: keyof CardDebt, value: any) => {
    const updatedCards = [...cards]
    updatedCards[index][field] = value
    setCards(updatedCards)
  }

  const deleteCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index))
  }

  const calculateDebtPayoff = () => {
    setLoading(true)
    // Simulated calculation
    setTimeout(() => {
      setShowResults(true)
      setLoading(false)
    }, 1000)
  }

  const totalDebt = cards.reduce((sum, card) => sum + card.balance, 0)
  const avgApr = cards.length > 0 ? cards.reduce((sum, card) => sum + card.apr, 0) / cards.length : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/tools" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Link>
          <h1 className="text-3xl font-bold">Credit Card Debt Calculator</h1>
          <p className="text-muted-foreground mt-2">Calculate the fastest way to eliminate credit card debt</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Input */}
          <div className="md:col-span-2">
            {/* Add Cards Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Your Credit Cards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cards.map((card, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Card Name</Label>
                        <Input
                          value={card.name}
                          onChange={(e) => updateCard(index, 'name', e.target.value)}
                          placeholder="e.g., Chase Sapphire"
                        />
                      </div>
                      <div>
                        <Label>Balance</Label>
                        <Input
                          type="number"
                          value={card.balance}
                          onChange={(e) => updateCard(index, 'balance', parseFloat(e.target.value))}
                          placeholder="$0.00"
                        />
                      </div>
                      <div>
                        <Label>APR (%)</Label>
                        <Input
                          type="number"
                          value={card.apr}
                          onChange={(e) => updateCard(index, 'apr', parseFloat(e.target.value))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Min Payment</Label>
                        <Input
                          type="number"
                          value={card.minPayment}
                          onChange={(e) => updateCard(index, 'minPayment', parseFloat(e.target.value))}
                          placeholder="$0.00"
                        />
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCard(index)}
                    >
                      Remove Card
                    </Button>
                  </div>
                ))}
                <Button onClick={addCard} className="w-full">
                  + Add Credit Card
                </Button>
              </CardContent>
            </Card>

            {/* Strategy Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payoff Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {strategies.map((strategy) => (
                  <label key={strategy.name} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted">
                    <input
                      type="radio"
                      name="strategy"
                      value={strategy.name.toLowerCase()}
                      checked={selectedStrategy === strategy.name.toLowerCase()}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {strategy.icon}
                      <div>
                        <p className="font-medium">{strategy.name}</p>
                        <p className="text-sm text-muted-foreground">{strategy.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Extra Payment */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Extra Monthly Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <Label>Additional Amount Beyond Minimums</Label>
                <Input
                  type="number"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(parseFloat(e.target.value))}
                  placeholder="$0.00"
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* CSV Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Import Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept=".csv"
                    onChange={handleCsvUpload}
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Debt Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Debt</p>
                  <p className="text-2xl font-bold">${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average APR</p>
                  <p className="text-2xl font-bold">{avgApr.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strategy</p>
                  <Badge className="mt-1">{selectedStrategy.charAt(0).toUpperCase() + selectedStrategy.slice(1)}</Badge>
                </div>
                <Button
                  onClick={calculateDebtPayoff}
                  disabled={cards.length === 0 || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Calculating...' : 'Calculate Payoff Plan'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        {showResults && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Payoff Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                With your {selectedStrategy} strategy and ${extraPayment.toFixed(2)} extra monthly payment, you can become debt-free in approximately 18-24 months.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
