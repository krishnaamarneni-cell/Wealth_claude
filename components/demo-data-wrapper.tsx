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

  useEffect(() => {
    // If transactions are passed, check them directly
    if (transactions !== undefined) {
      const hasDemo = transactions.some((tx: any) => tx.source === 'demo')
      setHasDemoData(hasDemo)
      setIsChecking(false)
      return
    }

    // Otherwise fetch to check
    const checkForDemoData = async () => {
      try {
        const response = await fetch('/api/transactions')
        if (!response.ok) {
          setIsChecking(false)
          return
        }

        const data = await response.json()
        const hasDemo = data.some((tx: any) => tx.source === 'demo')
        setHasDemoData(hasDemo)
      } catch (error) {
        console.error('Error checking demo data:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkForDemoData()
  }, [transactions])

  // Listen for transaction updates
  useEffect(() => {
    const handleUpdate = () => {
      // Re-check for demo data after updates
      if (transactions === undefined) {
        fetch('/api/transactions')
          .then(res => res.json())
          .then(data => {
            const hasDemo = data.some((tx: any) => tx.source === 'demo')
            setHasDemoData(hasDemo)
          })
          .catch(console.error)
      }
    }

    window.addEventListener('transactionsUpdated', handleUpdate)
    return () => window.removeEventListener('transactionsUpdated', handleUpdate)
  }, [transactions])

  return (
    <>
      {hasDemoData && !isChecking && <DemoDataBanner />}
      {children}
    </>
  )
}
