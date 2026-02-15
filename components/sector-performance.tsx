"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, PieChart, ArrowUpDown } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import { useRouter } from "next/navigation"

interface SectorData {
  name: string
  displayName: string
  price: number
  change: number
  changePercent: number
  yourExposure: number
  holdingsCount: number
}

// Mock sector ETF data (will update daily at market close in Phase 2)
const MOCK_SECTOR_PRICES: Record<string, { price: number; change: number; changePercent: number }> = {
  'Technology': { price: 185.20, change: 2.31, changePercent: 1.26 },
  'Healthcare': { price: 142.80, change: 0.95, changePercent: 0.67 },
  'Financials': { price: 38.50, change: -0.22, changePercent: -0.57 },
  'Consumer Discretionary': { price: 172.40, change: 1.80, changePercent: 1.05 },
  'Communication Services': { price: 68.30, change: -0.40, changePercent: -0.58 },
  'Industrials': { price: 115.60, change: 0.75, changePercent: 0.65 },
  'Energy': { price: 88.90, change: 1.20, changePercent: 1.37 },
  'Materials': { price: 82.40, change: 0.50, changePercent: 0.61 },
  'Real Estate': { price: 38.70, change: -0.15, changePercent: -0.39 },
  'Utilities': { price: 68.50, change: 0.30, changePercent: 0.44 },
  'Consumer Staples': { price: 75.20, change: 0.20, changePercent: 0.27 },
}

// Map Finnhub sector names to standard sector names
function mapSectorName(apiSectorName: string): string {
  const mapping: Record<string, string> = {
    'Financial Services': 'Financials',
    'Consumer Cyclical': 'Consumer Discretionary',
    'Consumer Defensive': 'Consumer Staples',
    'Basic Materials': 'Materials',
    'Technology': 'Technology',
    'Healthcare': 'Healthcare',
    'Communication Services': 'Communication Services',
    'Energy': 'Energy',
    'Real Estate': 'Real Estate',
    'Industrials': 'Industrials',
    'Utilities': 'Utilities',
    'Others': 'Other',
    'Unknown': 'Other',
    '': 'Other',
  }
  
  return mapping[apiSectorName] || 'Other'
}

type SortColumn = 'sector' | 'price' | 'changeDollar' | 'changePercent' | 'exposure' | 'holdings'
type SortDirection = 'asc' | 'desc'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function SectorPerformance() {
  const { holdings, portfolioValue } = usePortfolio()
  const router = useRouter()
  const [sectorData, setSectorData] = useState<SectorData[]>([])
  const [sortColumn, setSortColumn] = useState<SortColumn>('exposure')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    console.log('[Sector Performance] Total holdings:', holdings.length)
    
    // Calculate user's exposure per sector
    const sectorExposure: Record<string, { value: number; count: number; symbols: string[] }> = {}
    
    holdings.forEach(holding => {
      // Map API sector name to standard sector name
      const apiSector = holding.sector || 'Unknown'
      const standardSector = mapSectorName(apiSector)
      
      // Skip "Other" sector (don't show in table)
      if (standardSector === 'Other') {
        console.log(`[Sector] ${holding.symbol}: ${apiSector} → ${standardSector} (SKIPPED)`)
        return
      }
      
      console.log(`[Sector] ${holding.symbol}: ${apiSector} → ${standardSector}`)
      
      if (!sectorExposure[standardSector]) {
        sectorExposure[standardSector] = { value: 0, count: 0, symbols: [] }
      }
      sectorExposure[standardSector].value += holding.marketValue
      sectorExposure[standardSector].count += 1
      sectorExposure[standardSector].symbols.push(holding.symbol)
    })

    console.log('[Sector Performance] Sector exposure:', sectorExposure)

    // Build sector data with all 11 sectors (excluding "Other")
    const allSectors = Object.keys(MOCK_SECTOR_PRICES)
    const enrichedData: SectorData[] = allSectors.map(sectorName => {
      const exposure = sectorExposure[sectorName] || { value: 0, count: 0 }
      const exposurePercent = portfolioValue > 0 ? (exposure.value / portfolioValue) * 100 : 0
      const mockPrices = MOCK_SECTOR_PRICES[sectorName]
      
      return {
        name: sectorName,
        displayName: sectorName,
        price: mockPrices.price,
        change: mockPrices.change,
        changePercent: mockPrices.changePercent,
        yourExposure: exposurePercent,
        holdingsCount: exposure.count
      }
    })

    // Apply sorting
    sortSectorData(enrichedData, sortColumn, sortDirection)
    
    setSectorData(enrichedData)
  }, [holdings, portfolioValue, sortColumn, sortDirection])

  const sortSectorData = (data: SectorData[], column: SortColumn, direction: SortDirection) => {
    const multiplier = direction === 'asc' ? 1 : -1
    
    data.sort((a, b) => {
      switch (column) {
        case 'sector':
          return multiplier * a.name.localeCompare(b.name)
        case 'price':
          return multiplier * (a.price - b.price)
        case 'changeDollar':
          return multiplier * (a.change - b.change)
        case 'changePercent':
          return multiplier * (a.changePercent - b.changePercent)
        case 'exposure':
          return multiplier * (a.yourExposure - b.yourExposure)
        case 'holdings':
          return multiplier * (a.holdingsCount - b.holdingsCount)
        default:
          return 0
      }
    })
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to desc
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleSectorClick = (sectorName: string) => {
    // Navigate to portfolio (allocation) page
    router.push('/dashboard/portfolio')
  }

  // Calculate total holdings shown (excluding "Other")
  const totalHoldingsShown = sectorData.reduce((sum, s) => sum + s.holdingsCount, 0)

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground ml-1" />
    }
    return sortDirection === 'asc' ? (
      <TrendingUp className="h-3 w-3 text-primary ml-1" />
    ) : (
      <TrendingDown className="h-3 w-3 text-primary ml-1" />
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Sector Performance
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {totalHoldingsShown} of {holdings.length} holdings across {sectorData.filter(s => s.holdingsCount > 0).length} sectors
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('sector')}
                >
                  <div className="flex items-center">
                    Sector
                    <SortIcon column="sector" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end">
                    Price
                    <SortIcon column="price" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('changeDollar')}
                >
                  <div className="flex items-center justify-end">
                    Change ($)
                    <SortIcon column="changeDollar" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('changePercent')}
                >
                  <div className="flex items-center justify-end">
                    Change (%)
                    <SortIcon column="changePercent" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('exposure')}
                >
                  <div className="flex items-center justify-end">
                    Your Exposure
                    <SortIcon column="exposure" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold text-right cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => handleSort('holdings')}
                >
                  <div className="flex items-center justify-end">
                    Holdings
                    <SortIcon column="holdings" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectorData.map((sector) => (
                <TableRow
                  key={sector.name}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleSectorClick(sector.name)}
                >
                  {/* Sector Name */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        sector.yourExposure > 0 ? 'bg-blue-500' : 'bg-muted'
                      }`} />
                      <span className="font-semibold">{sector.displayName}</span>
                    </div>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sector.price)}
                  </TableCell>

                  {/* Change ($) */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {sector.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={sector.change >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                        {formatCurrency(Math.abs(sector.change))}
                      </span>
                    </div>
                  </TableCell>

                  {/* Change (%) */}
                  <TableCell className="text-right">
                    <span className={`font-medium ${sector.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercent(sector.changePercent)}
                    </span>
                  </TableCell>

                  {/* Your Exposure */}
                  <TableCell className="text-right">
                    {sector.yourExposure > 0 ? (
                      <>
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${Math.min(sector.yourExposure, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold text-blue-500 min-w-[45px]">
                            {sector.yourExposure.toFixed(1)}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Holdings Count */}
                  <TableCell className="text-right">
                    {sector.holdingsCount > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        {sector.holdingsCount} {sector.holdingsCount === 1 ? 'stock' : 'stocks'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>You own stocks in this sector</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted" />
            <span>No holdings</span>
          </div>
          <div className="text-xs">
            Click any column header to sort • Click sector to view detailed allocation
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
