"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Trash2, 
  Upload, 
  Loader2,
  X
} from 'lucide-react'

interface DemoDataBannerProps {
  onClear?: () => void
  onImport?: () => void
}

export function DemoDataBanner({ 
  onClear, 
  onImport,
}: DemoDataBannerProps) {
  const router = useRouter()
  const [isClearing, setIsClearing] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleClearDemo = async () => {
    if (!confirm('Clear all demo data? Your dashboard will be empty until you import your own transactions.')) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch('/api/seed-demo-data', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to clear demo data')
      }

      // Trigger refresh
      window.dispatchEvent(new Event('transactionsUpdated'))
      
      // Callback if provided
      if (onClear) {
        onClear()
      }

      // Reload the page to reflect changes
      router.refresh()
      window.location.reload()

    } catch (error) {
      console.error('Error clearing demo data:', error)
      alert('Failed to clear demo data. Please try again.')
    } finally {
      setIsClearing(false)
    }
  }

  const handleImportClick = () => {
    if (onImport) {
      onImport()
    } else {
      router.push('/dashboard/transactions')
    }
  }

  if (isDismissed) {
    return null
  }

  return (
    <div className="mb-6 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Icon and text */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-foreground">This is sample data</span>
            <span className="text-muted-foreground"> — showing you what WealthClaude can do.</span>
          </div>
        </div>

        {/* Right side - Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            className="gap-1.5 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Your Data
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDemo}
            disabled={isClearing}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            {isClearing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Clear Demo
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook to check if user has demo data
export function useDemoData() {
  const [hasDemoData, setHasDemoData] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkDemoData = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (!response.ok) return

      const transactions = await response.json()
      const hasDemo = transactions.some((tx: any) => tx.source === 'demo')
      setHasDemoData(hasDemo)
    } catch (error) {
      console.error('Error checking demo data:', error)
      setHasDemoData(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { hasDemoData, isLoading, checkDemoData }
}
