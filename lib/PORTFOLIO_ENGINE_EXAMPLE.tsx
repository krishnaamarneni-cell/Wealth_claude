/**
 * PORTFOLIO ENGINE - QUICK START EXAMPLE
 * 
 * This file demonstrates a practical example of integrating PortfolioEngine
 * into your dashboard page with minimal changes.
 * 
 * Copy this code as a template for updating other pages.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  getAllPortfolioData, 
  clearCache,
  getHoldings,
  getPortfolioSummary,
  getAllocation,
  getPerformance,
  getDividends,
  getTradeAnalysis
} from '@/lib/portfolio-engine'

/**
 * Example: Updated Dashboard Component using PortfolioEngine
 * 
 * This shows how to:
 * 1. Load data from PortfolioEngine
 * 2. Handle loading states
 * 3. Display data without changing UI
 * 4. Clear cache when needed
 */
export function PortfolioEngineDashboardExample() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load all portfolio data on component mount
  useEffect(() => {
    try {
      setLoading(true)
      const portfolioData = getAllPortfolioData()
      setData(portfolioData)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error loading portfolio data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle manual refresh
  const handleRefresh = () => {
    clearCache()
    try {
      const portfolioData = getAllPortfolioData()
      setData(portfolioData)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin">Loading portfolio data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <p>Error: {error}</p>
        <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8">No portfolio data available</div>
  }

  const { holdings, summary, allocation, performance, dividends, tradeAnalysis } = data

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold">${summary.totalValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold">${summary.totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Gain</p>
              <p className={`text-2xl font-bold ${summary.totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${summary.totalGain.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Return %</p>
              <p className={`text-2xl font-bold ${summary.totalGainPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {summary.totalGainPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings ({holdings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {holdings.slice(0, 5).map((holding) => (
              <div key={holding.symbol} className="flex justify-between">
                <div>
                  <p className="font-semibold">{holding.symbol}</p>
                  <p className="text-sm text-gray-600">{holding.shares} shares @ ${holding.avgCost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${holding.totalCost.toFixed(2)}</p>
                  <p className={`text-sm ${holding.totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.totalGainPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
            {holdings.length > 5 && <p className="text-sm text-gray-600">...and {holdings.length - 5} more</p>}
          </div>
        </CardContent>
      </Card>

      {/* Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold mb-2">By Type</p>
            <div className="space-y-1">
              {Object.entries(allocation.assetType).map(([type, percentage]) => (
                <div key={type} className="flex justify-between">
                  <span>{type}</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">By Sector</p>
            <div className="space-y-1">
              {Object.entries(allocation.sector).slice(0, 5).map(([sector, percentage]) => (
                <div key={sector} className="flex justify-between">
                  <span>{sector}</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Daily Return</p>
            <p className="text-lg font-semibold">{performance.dailyReturn.toFixed(3)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Weekly Return</p>
            <p className="text-lg font-semibold">{performance.weeklyReturn.toFixed(3)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Return</p>
            <p className="text-lg font-semibold">{performance.monthlyReturn.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Yearly Return</p>
            <p className="text-lg font-semibold">{performance.yearlyReturn.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sharpe Ratio</p>
            <p className="text-lg font-semibold">{performance.sharpeRatio.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Max Drawdown</p>
            <p className="text-lg font-semibold">{performance.maxDrawdown.toFixed(2)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Dividends */}
      <Card>
        <CardHeader>
          <CardTitle>Dividends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Total Dividends Received</p>
            <p className="text-2xl font-bold">${dividends.totalDividends.toFixed(2)}</p>
          </div>
          {Object.entries(dividends.dividendsBySymbol).length > 0 && (
            <div>
              <p className="font-semibold mb-2">Breakdown by Stock</p>
              <div className="space-y-1">
                {Object.entries(dividends.dividendsBySymbol).map(([symbol, amount]) => (
                  <div key={symbol} className="flex justify-between">
                    <span>{symbol}</span>
                    <span>${(amount as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold">{tradeAnalysis.totalTrades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold">{tradeAnalysis.winRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Winning Trades</p>
              <p className="text-xl font-semibold text-green-500">{tradeAnalysis.winningTrades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Losing Trades</p>
              <p className="text-xl font-semibold text-red-500">{tradeAnalysis.losingTrades}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Best Trade</p>
            <p className="font-semibold">{tradeAnalysis.bestTrade.symbol}: ${tradeAnalysis.bestTrade.gain.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Worst Trade</p>
            <p className="font-semibold">{tradeAnalysis.worstTrade.symbol}: ${tradeAnalysis.worstTrade.loss.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex gap-2">
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Data
        </button>
      </div>
    </div>
  )
}

export default PortfolioEngineDashboardExample
