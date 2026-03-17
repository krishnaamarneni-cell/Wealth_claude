"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Share2, Copy, ExternalLink, Loader2, Check, XCircle } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"

interface SharePortfolioModalProps {
  open: boolean
  onClose: () => void
}

export default function SharePortfolioModal({ open, onClose }: SharePortfolioModalProps) {
  const { holdings, portfolioValue, totalGainPercent, totalCost, performance } = usePortfolio()
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Shared portfolio state
  const [sharedPortfolio, setSharedPortfolio] = useState<{
    slug: string
    displayName: string
    url: string
    isActive: boolean
    updatedAt: string
  } | null>(null)

  // Check if portfolio is already shared
  useEffect(() => {
    if (open) {
      checkShareStatus()
    }
  }, [open])

  const checkShareStatus = async () => {
    setIsCheckingStatus(true)
    try {
      const res = await fetch('/api/portfolio-share')
      const data = await res.json()
      
      if (data.shared) {
        setSharedPortfolio({
          slug: data.slug,
          displayName: data.displayName,
          url: `${window.location.origin}${data.url}`,
          isActive: data.isActive,
          updatedAt: data.updatedAt,
        })
        // Pre-fill name fields
        const [first, ...rest] = data.displayName.split(' ')
        setFirstName(first)
        setLastName(rest.join(' '))
      } else {
        setSharedPortfolio(null)
      }
    } catch (err) {
      console.error('Error checking share status:', err)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleShare = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/portfolio-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          holdings,
          totalValue: portfolioValue,
          totalGainPercent,
          totalCost,
          todayGainPercent: performance.todayReturn.percent,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to share portfolio')
      }

      setSharedPortfolio({
        slug: data.slug,
        displayName: `${firstName} ${lastName}`,
        url: `${window.location.origin}${data.url}`,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopSharing = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/portfolio-share', { method: 'DELETE' })
      setSharedPortfolio(null)
      setFirstName('')
      setLastName('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (sharedPortfolio?.url) {
      navigator.clipboard.writeText(sharedPortfolio.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const previewSlug = firstName && lastName 
    ? `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/[^a-z0-9-]/g, '')
    : 'your-name'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Portfolio
          </DialogTitle>
          <DialogDescription>
            {sharedPortfolio 
              ? 'Your portfolio is being shared publicly'
              : 'Create a public link to share your portfolio'}
          </DialogDescription>
        </DialogHeader>

        {isCheckingStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sharedPortfolio ? (
          // Already shared view
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                Portfolio is live!
              </p>
              <div className="flex items-center gap-2">
                <Input 
                  value={sharedPortfolio.url} 
                  readOnly 
                  className="text-sm bg-white dark:bg-gray-900"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(sharedPortfolio.url, '_blank')}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Shared as: <span className="font-medium text-foreground">{sharedPortfolio.displayName}</span></p>
              <p>Last updated: {new Date(sharedPortfolio.updatedAt).toLocaleString()}</p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleShare} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Snapshot
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleStopSharing}
                disabled={isLoading}
              >
                Stop Sharing
              </Button>
            </div>
          </div>
        ) : (
          // New share form
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Krishna"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Amarneni"
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your public link will be:</p>
              <p className="text-sm font-mono text-foreground">
                wealthclaude.com/u/<span className="text-primary">{previewSlug}</span>/portfolio
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Free viewers will see:</strong></p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>All your holdings (ticker symbols)</li>
                <li>Total return percentage</li>
                <li>Individual stock return %</li>
              </ul>
              <p className="mt-2"><strong>Paid viewers ($29) will also see:</strong></p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Dollar amounts</li>
                <li>Share quantities</li>
                <li>Allocations</li>
                <li>Cost basis</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </div>
        )}

        {!sharedPortfolio && !isCheckingStatus && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={isLoading || !firstName || !lastName}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
              Share Portfolio
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
