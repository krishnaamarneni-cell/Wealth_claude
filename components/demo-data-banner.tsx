"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  showOnPages?: ('transactions' | 'holdings' | 'dashboard' | 'all')[]
}

export function DemoDataBanner({ 
  onClear, 
  onImport,
  showOnPages = ['all']
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
    <Alert className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 border-purple-500/30 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm">
            <span className="font-semibold text-foreground">This is sample data</span>
            <span className="text-muted-foreground ml-1">
              — showing you what WealthClaude can do. Import your own transactions or clear the demo to start fresh.
            </span>
          </AlertDescription>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            className="gap-2 bg-background/50 hover:bg-background"
          >
            <Upload className="h-4 w-4" />
            Import Your Data
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDemo}
            disabled={isClearing}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            {isClearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear Demo
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
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
