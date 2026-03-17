"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Unlock,
  Loader2,
  CheckCircle2,
  ExternalLink,
  PieChart,
  DollarSign,
  Percent,
  BarChart3
} from "lucide-react"
import Link from "next/link"

interface Holding {
  symbol: string
  shares: number | null
  avgCost: number | null
  currentPrice: number | null
  marketValue: number | null
  totalGain: number | null
  totalGainPercent: number
  todayGain: number | null
  todayGainPercent: number
  allocation: number | null
  sector: string
}

interface PortfolioData {
  displayName: string
  totalGainPercent: number
  todayGainPercent: number
  totalValue: number | null
  totalCost: number | null
  holdings: Holding[]
  updatedAt: string
  hasPaid: boolean
  portfolioId?: string
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6"]

export default function PublicPortfolioPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [email, setEmail] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Check for success callback from Stripe
  useEffect(() => {
    const success = searchParams.get('success')
    const emailParam = searchParams.get('email')
    if (success === 'true' && emailParam) {
      setEmail(emailParam)
      setPaymentSuccess(true)
      // Re-fetch with email to get full access
      fetchPortfolio(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    fetchPortfolio()
  }, [slug])

  const fetchPortfolio = async (userEmail?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const emailToUse = userEmail || email
      const url = emailToUse 
        ? `/api/portfolio-share/public?slug=${slug}&email=${encodeURIComponent(emailToUse)}`
        : `/api/portfolio-share/public?slug=${slug}`
      
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Portfolio not found')
      }

      setPortfolio(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!email) return
    
    setIsProcessingPayment(true)
    
    try {
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          portfolioId: portfolio?.portfolioId,
          slug,
        }),
      })

      const data = await res.json()

      if (data.alreadyPaid) {
        // User already has access, re-fetch
        await fetchPortfolio(email)
        setShowPaymentModal(false)
        return
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return "—"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return "—"
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium mb-2">Portfolio Not Found</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/start">
              <Button>Start Your Journey</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!portfolio) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{portfolio.displayName}'s Portfolio</h1>
              <p className="text-muted-foreground">
                Last updated: {new Date(portfolio.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {portfolio.hasPaid ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <Unlock className="h-3 w-3 mr-1" />
                Full Access
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Limited View
              </Badge>
            )}
          </div>

          {/* Success Message */}
          {paymentSuccess && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-800 dark:text-green-200">
                Payment successful! You now have full access to this portfolio.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Return</p>
              </div>
              <p className={`text-2xl font-bold ${portfolio.totalGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercent(portfolio.totalGainPercent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
              <p className={`text-2xl font-bold ${portfolio.todayGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercent(portfolio.todayGainPercent)}
              </p>
            </CardContent>
          </Card>

          <Card className={!portfolio.hasPaid ? "relative overflow-hidden" : ""}>
            {!portfolio.hasPaid && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(portfolio.totalValue)}
              </p>
            </CardContent>
          </Card>

          <Card className={!portfolio.hasPaid ? "relative overflow-hidden" : ""}>
            {!portfolio.hasPaid && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cost Basis</p>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(portfolio.totalCost)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Holdings ({portfolio.holdings.length})</CardTitle>
              {!portfolio.hasPaid && (
                <Button onClick={() => setShowPaymentModal(true)}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Full View - $29
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                    <TableHead className="text-right">Today</TableHead>
                    {portfolio.hasPaid && (
                      <>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Avg Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Gain</TableHead>
                        <TableHead className="text-right">Allocation</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.holdings.map((holding, index) => (
                    <TableRow key={holding.symbol}>
                      <TableCell className="font-medium">{holding.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {holding.sector}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${holding.totalGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercent(holding.totalGainPercent)}
                      </TableCell>
                      <TableCell className={`text-right ${holding.todayGainPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercent(holding.todayGainPercent)}
                      </TableCell>
                      {portfolio.hasPaid && (
                        <>
                          <TableCell className="text-right">{holding.shares?.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(holding.avgCost)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(holding.marketValue)}</TableCell>
                          <TableCell className={`text-right ${(holding.totalGain || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(holding.totalGain)}
                          </TableCell>
                          <TableCell className="text-right">{holding.allocation?.toFixed(1)}%</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Locked columns indicator */}
            {!portfolio.hasPaid && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium mb-1">Unlock Full Portfolio Details</p>
                <p className="text-sm text-muted-foreground mb-4">
                  See shares, prices, dollar amounts, allocations, and more
                </p>
                <Button onClick={() => setShowPaymentModal(true)}>
                  Unlock for $29
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA for non-paid users */}
        {!portfolio.hasPaid && (
          <Card className="mt-8 border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Want to Build Your Own Portfolio?</h3>
                  <p className="text-muted-foreground">
                    Start tracking your investments with WealthClaude for free
                  </p>
                </div>
                <Link href="/start">
                  <Button size="lg">
                    Get Started Free
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Full Portfolio Access</DialogTitle>
            <DialogDescription>
              Get lifetime access to {portfolio.displayName}'s complete portfolio data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-2">What you'll get:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Share quantities for all holdings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Dollar amounts and cost basis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Portfolio allocation percentages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Gain/loss in dollars
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Lifetime access (portfolio updates included)
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unlock-email">Your Email</Label>
              <Input
                id="unlock-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                We'll send your receipt to this email
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnlock} disabled={isProcessingPayment || !email}>
              {isProcessingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Pay $29
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
