"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  X, 
  Plus, 
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface StockData {
  symbol: string
  name: string
  logo: string
  currentPrice: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  marketCap: string
  peRatio: number
  divYield: number
  high52: number
  low52: number
  qtrlyDivAmt: number
  volume: string
  avgVolume: string
  eps: number
  beta: number
  priceToBook: number
  debtToEquity: number
  roe: number
  revenueGrowth: number
  profitMargin: number
  color: string
}

// Mock stock data - in production this would come from an API
const stockDatabase: Record<string, StockData> = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    logo: 'https://logo.clearbit.com/apple.com',
    currentPrice: 178.50,
    change: -2.30,
    changePercent: -1.27,
    open: 180.20,
    high: 181.50,
    low: 177.80,
    marketCap: '2.78T',
    peRatio: 28.45,
    divYield: 0.53,
    high52: 199.62,
    low52: 142.66,
    qtrlyDivAmt: 0.24,
    volume: '52.3M',
    avgVolume: '58.2M',
    eps: 6.27,
    beta: 1.28,
    priceToBook: 45.12,
    debtToEquity: 1.81,
    roe: 147.25,
    revenueGrowth: 2.1,
    profitMargin: 25.31,
    color: '#22c55e'
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    logo: 'https://logo.clearbit.com/microsoft.com',
    currentPrice: 378.20,
    change: -5.60,
    changePercent: -1.46,
    open: 382.00,
    high: 384.50,
    low: 376.20,
    marketCap: '2.81T',
    peRatio: 35.42,
    divYield: 0.79,
    high52: 420.82,
    low52: 309.98,
    qtrlyDivAmt: 0.75,
    volume: '18.5M',
    avgVolume: '21.2M',
    eps: 10.68,
    beta: 0.91,
    priceToBook: 12.45,
    debtToEquity: 0.35,
    roe: 38.52,
    revenueGrowth: 15.2,
    profitMargin: 35.02,
    color: '#3b82f6'
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    logo: 'https://logo.clearbit.com/google.com',
    currentPrice: 141.80,
    change: 1.20,
    changePercent: 0.85,
    open: 140.50,
    high: 143.20,
    low: 139.80,
    marketCap: '1.76T',
    peRatio: 25.18,
    divYield: 0.00,
    high52: 153.78,
    low52: 115.83,
    qtrlyDivAmt: 0.00,
    volume: '24.1M',
    avgVolume: '28.5M',
    eps: 5.63,
    beta: 1.05,
    priceToBook: 6.28,
    debtToEquity: 0.11,
    roe: 25.12,
    revenueGrowth: 11.8,
    profitMargin: 24.01,
    color: '#f59e0b'
  },
  'NVDA': {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    logo: 'https://logo.clearbit.com/nvidia.com',
    currentPrice: 682.50,
    change: -18.50,
    changePercent: -2.64,
    open: 698.00,
    high: 702.30,
    low: 678.20,
    marketCap: '1.68T',
    peRatio: 62.85,
    divYield: 0.02,
    high52: 974.00,
    low52: 342.29,
    qtrlyDivAmt: 0.04,
    volume: '42.8M',
    avgVolume: '48.5M',
    eps: 10.86,
    beta: 1.72,
    priceToBook: 42.15,
    debtToEquity: 0.41,
    roe: 91.45,
    revenueGrowth: 122.4,
    profitMargin: 55.04,
    color: '#8b5cf6'
  },
  'AMZN': {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    logo: 'https://logo.clearbit.com/amazon.com',
    currentPrice: 178.90,
    change: 2.10,
    changePercent: 1.19,
    open: 176.50,
    high: 180.20,
    low: 175.80,
    marketCap: '1.87T',
    peRatio: 58.92,
    divYield: 0.00,
    high52: 201.20,
    low52: 118.35,
    qtrlyDivAmt: 0.00,
    volume: '38.2M',
    avgVolume: '42.1M',
    eps: 3.04,
    beta: 1.15,
    priceToBook: 8.92,
    debtToEquity: 0.58,
    roe: 17.82,
    revenueGrowth: 12.5,
    profitMargin: 5.52,
    color: '#ec4899'
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    logo: 'https://logo.clearbit.com/tesla.com',
    currentPrice: 248.60,
    change: -8.40,
    changePercent: -3.27,
    open: 255.00,
    high: 258.20,
    low: 245.30,
    marketCap: '790.2B',
    peRatio: 72.45,
    divYield: 0.00,
    high52: 299.29,
    low52: 138.80,
    qtrlyDivAmt: 0.00,
    volume: '98.5M',
    avgVolume: '105.2M',
    eps: 3.43,
    beta: 2.08,
    priceToBook: 12.85,
    debtToEquity: 0.12,
    roe: 21.08,
    revenueGrowth: 19.2,
    profitMargin: 15.45,
    color: '#06b6d4'
  },
}

// Mock price history data
const generatePriceHistory = (stocks: string[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month, i) => {
    const data: Record<string, string | number> = { date: month }
    stocks.forEach(symbol => {
      const base = stockDatabase[symbol]?.currentPrice || 100
      const variance = (Math.random() - 0.5) * 0.3
      const monthFactor = (i - 6) / 12
      data[symbol] = Math.round((base * (1 + variance + monthFactor * 0.2)) * 100) / 100
    })
    return data
  })
}

const availableStocks = Object.keys(stockDatabase)

export default function ComparePage() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(['AAPL', 'MSFT', 'NVDA'])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const addStock = (symbol: string) => {
    if (selectedStocks.length < 5 && !selectedStocks.includes(symbol)) {
      setSelectedStocks([...selectedStocks, symbol])
    }
    setShowSearch(false)
    setSearchQuery('')
  }

  const removeStock = (symbol: string) => {
    setSelectedStocks(selectedStocks.filter(s => s !== symbol))
  }

  const filteredStocks = availableStocks.filter(
    s => s.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedStocks.includes(s)
  )

  const priceHistory = generatePriceHistory(selectedStocks)
  const selectedStockData = selectedStocks.map(s => stockDatabase[s]).filter(Boolean)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  // TradingView Advanced Chart Widget
  useEffect(() => {
    if (chartContainerRef.current && selectedStocks.length > 0) {
      chartContainerRef.current.innerHTML = ''
      
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
      script.async = true
      script.innerHTML = JSON.stringify({
        symbols: selectedStocks.map(s => [`${s}|1D`]),
        chartOnly: false,
        width: '100%',
        height: 400,
        locale: 'en',
        colorTheme: 'dark',
        autosize: true,
        showVolume: true,
        showMA: true,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: 'right',
        scaleMode: 'Normal',
        fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
        fontSize: '10',
        noTimeScale: false,
        valuesTracking: '1',
        changeMode: 'price-and-percent',
        chartType: 'area',
        maLineColor: '#2962FF',
        maLineWidth: 1,
        maLength: 9,
        lineWidth: 2,
        lineType: 0,
        dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M']
      })
      
      chartContainerRef.current.appendChild(script)
    }
  }, [selectedStocks])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compare Stocks</h1>
        <p className="text-muted-foreground">Compare up to 5 stocks side by side</p>
      </div>

      {/* Stock Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Selected Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {selectedStocks.map(symbol => {
              const stock = stockDatabase[symbol]
              return (
                <div 
                  key={symbol}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/50"
                  style={{ borderLeftColor: stock?.color, borderLeftWidth: 3 }}
                >
                  {stock?.logo && (
                    <Image src={stock.logo || "/placeholder.svg"} alt={symbol} width={20} height={20} className="rounded" unoptimized />
                  )}
                  <span className="font-semibold">{symbol}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 rounded-full"
                    onClick={() => removeStock(symbol)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
            
            {selectedStocks.length < 5 && (
              <div className="relative">
                {showSearch ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ticker..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-40"
                        autoFocus
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {searchQuery && filteredStocks.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-60 bg-card border border-border rounded-lg shadow-lg z-10">
                        {filteredStocks.slice(0, 5).map(symbol => {
                          const stock = stockDatabase[symbol]
                          return (
                            <button
                              key={symbol}
                              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-secondary text-left"
                              onClick={() => addStock(symbol)}
                            >
                              {stock?.logo && (
                                <Image src={stock.logo || "/placeholder.svg"} alt={symbol} width={20} height={20} className="rounded" unoptimized />
                              )}
                              <span className="font-semibold">{symbol}</span>
                              <span className="text-sm text-muted-foreground truncate">{stock?.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowSearch(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Technical Chart */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Technical Chart</TabsTrigger>
          <TabsTrigger value="performance">Price Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Analysis</CardTitle>
              <CardDescription>Interactive chart with technical indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={chartContainerRef} className="h-[400px] rounded-lg overflow-hidden" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price Performance (12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    {selectedStocks.map(symbol => (
                      <Line
                        key={symbol}
                        type="monotone"
                        dataKey={symbol}
                        stroke={stockDatabase[symbol]?.color || '#888'}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quote Data Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedStockData.map(stock => (
          <Card key={stock.symbol} style={{ borderTopColor: stock.color, borderTopWidth: 3 }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {stock.logo && (
                  <Image src={stock.logo || "/placeholder.svg"} alt={stock.symbol} width={40} height={40} className="rounded" unoptimized />
                )}
                <div>
                  <h3 className="font-bold text-lg">{stock.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                </div>
              </div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(stock.currentPrice)}</p>
                  <div className={`flex items-center gap-1 ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span className="font-medium">{formatCurrency(Math.abs(stock.change))}</span>
                    <span>({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Open</span>
                  <span>{formatCurrency(stock.open)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High</span>
                  <span>{formatCurrency(stock.high)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Low</span>
                  <span>{formatCurrency(stock.low)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mkt Cap</span>
                  <span>{stock.marketCap}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fundamentals Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fundamentals Comparison</CardTitle>
          <CardDescription>Key financial metrics side by side</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Metric</TableHead>
                  {selectedStockData.map(stock => (
                    <TableHead key={stock.symbol} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {stock.logo && (
                          <Image src={stock.logo || "/placeholder.svg"} alt={stock.symbol} width={20} height={20} className="rounded" unoptimized />
                        )}
                        {stock.symbol}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Current Price</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center font-semibold">
                      {formatCurrency(stock.currentPrice)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Market Cap</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.marketCap}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">P/E Ratio</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.peRatio.toFixed(2)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">EPS</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{formatCurrency(stock.eps)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Dividend Yield</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">
                      {stock.divYield > 0 ? `${stock.divYield.toFixed(2)}%` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Quarterly Dividend</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">
                      {stock.qtrlyDivAmt > 0 ? formatCurrency(stock.qtrlyDivAmt) : '-'}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">52-Week High</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{formatCurrency(stock.high52)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">52-Week Low</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{formatCurrency(stock.low52)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Beta</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.beta.toFixed(2)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Price to Book</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.priceToBook.toFixed(2)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Debt to Equity</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.debtToEquity.toFixed(2)}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ROE</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.roe.toFixed(2)}%</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Revenue Growth (YoY)</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">
                      <span className={stock.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {stock.revenueGrowth >= 0 ? '+' : ''}{stock.revenueGrowth.toFixed(1)}%
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Profit Margin</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.profitMargin.toFixed(2)}%</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Volume</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.volume}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Avg Volume</TableCell>
                  {selectedStockData.map(stock => (
                    <TableCell key={stock.symbol} className="text-center">{stock.avgVolume}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
