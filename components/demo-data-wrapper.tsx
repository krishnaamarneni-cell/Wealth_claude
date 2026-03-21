"use client"

import { useState, useEffect } from 'react'
import { DemoDataBanner } from '@/components/demo-data-banner'

interface DemoDataWrapperProps {
  children: React.ReactNode
  transactions?: any[] // Pass transactions if already loaded
}

export function DemoDataWrapper({ children, transactions }: DemoDataWrapperProps) {
  const [hasDemoData, setHasDemoData] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    const checkAndSeedDemoData = async () => {
      try {
        // Fetch current transactions
        const response = await fetch('/api/transactions')
        if (!response.ok) {
          setIsChecking(false)
          return
        }

        const data = await response.json()
        
        // Check if user has demo data
        const hasDemo = data.some((tx: any) => tx.source === 'demo')
        setHasDemoData(hasDemo)

        // If user has NO transactions at all, auto-seed demo data
        if (data.length === 0) {
          console.log('[DemoDataWrapper] New user detected, seeding demo data...')
          setIsSeeding(true)
          
          try {
            const seedResponse = await fetch('/api/seed-demo-data', {
              method: 'POST',
            })
            
            if (seedResponse.ok) {
              const result = await seedResponse.json()
              console.log('[DemoDataWrapper] ✅ Demo data seeded:', result)
              setHasDemoData(true)
              
              // Trigger portfolio refresh
              window.dispatchEvent(new Event('transactionsUpdated'))
              
              // Reload to show the data
              window.location.reload()
            } else {
              console.warn('[DemoDataWrapper] Failed to seed demo data')
            }
          } catch (seedError) {
            console.error('[DemoDataWrapper] Error seeding:', seedError)
          } finally {
            setIsSeeding(false)
          }
        }
      } catch (error) {
        console.error('[DemoDataWrapper] Error checking transactions:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkAndSeedDemoData()
  }, [])

  // Listen for transaction updates
  useEffect(() => {
    const handleUpdate = () => {
      fetch('/api/transactions')
        .then(res => res.json())
        .then(data => {
          const hasDemo = data.some((tx: any) => tx.source === 'demo')
          setHasDemoData(hasDemo)
        })
        .catch(console.error)
    }

    window.addEventListener('transactionsUpdated', handleUpdate)
    return () => window.removeEventListener('transactionsUpdated', handleUpdate)
  }, [])

  // Show loading state while seeding
  if (isSeeding) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your demo portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {hasDemoData && !isChecking && <DemoDataBanner />}
      {children}
    </>
  )
}
