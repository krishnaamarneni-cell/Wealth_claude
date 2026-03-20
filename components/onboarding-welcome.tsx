"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useOnboarding } from '@/lib/onboarding-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Rocket, 
  SkipForward, 
  CheckCircle2,
  User,
  FileText,
  Wallet,
  BarChart3,
  Target,
  GitCompare
} from 'lucide-react'

const WELCOME_STORAGE_KEY = 'wealthclaude_welcome_shown'
const SIGNUP_FLAG_KEY = 'wealthclaude_just_signed_up'

// Only show onboarding on these paths (authenticated pages)
const DASHBOARD_PATHS = ['/dashboard']

export function OnboardingWelcome() {
  const { startOnboarding, isOnboarding } = useOnboarding()
  const [showWelcome, setShowWelcome] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Only show on dashboard pages (means user is logged in)
    const isOnDashboard = pathname?.startsWith('/dashboard')
    if (!isOnDashboard) return

    // Check if user just signed up (set this flag in your signup flow)
    const justSignedUp = localStorage.getItem(SIGNUP_FLAG_KEY)
    
    // Check if this user has already seen the welcome
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY)
    
    // Show welcome if: on dashboard + (just signed up OR never seen welcome) + not already onboarding
    if (!hasSeenWelcome && !isOnboarding) {
      const timer = setTimeout(() => {
        setShowWelcome(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOnboarding, pathname])

  const handleStartTour = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
    localStorage.removeItem(SIGNUP_FLAG_KEY) // Clear signup flag
    setShowWelcome(false)
    startOnboarding()
  }

  const handleSkip = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
    localStorage.removeItem(SIGNUP_FLAG_KEY) // Clear signup flag
    setShowWelcome(false)
  }

  return (
    <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to WealthClaude! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            Let's set up your portfolio in just a few steps. We'll guide you through each feature.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Here's what we'll cover:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Set Up Your Profile</p>
                <p className="text-xs text-muted-foreground">Add your name and preferences</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Import Transactions</p>
                <p className="text-xs text-muted-foreground">Upload from your broker</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">View Holdings & Dividends</p>
                <p className="text-xs text-muted-foreground">Track your portfolio performance</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Market Overview</p>
                <p className="text-xs text-muted-foreground">See money flow across assets</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Set Goals & Compare</p>
                <p className="text-xs text-muted-foreground">Define targets and analyze stocks</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Takes about 5 minutes • You can skip anytime
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full sm:w-auto"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Skip for now
          </Button>
          <Button
            onClick={handleStartTour}
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Start Quick Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
