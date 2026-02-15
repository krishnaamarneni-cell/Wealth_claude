import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function APIKeyNotice() {
  const hasFinnhubKey = process.env.NEXT_PUBLIC_DEMO_MODE ? false : true
  
  if (hasFinnhubKey) return null

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <strong>Demo Mode:</strong> API keys not configured. Stock prices and dividends show placeholder data. 
        To see live data, add <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">FINNHUB_API_KEY</code> and 
        <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs ml-1">POLYGON_API_KEY</code> to your <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs ml-1">.env.local</code> file.
      </AlertDescription>
    </Alert>
  )
}
