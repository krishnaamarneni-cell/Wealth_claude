"use client"

import { ReactNode } from "react"
import { OnboardingProvider } from "@/lib/onboarding-context"
import { OnboardingBar } from "@/components/onboarding-bar"
import { OnboardingWelcome } from "@/components/onboarding-welcome"

interface OnboardingProviderWrapperProps {
  children: ReactNode
}

export function OnboardingProviderWrapper({ children }: OnboardingProviderWrapperProps) {
  return (
    <OnboardingProvider>
      <div className="pb-20">
        {children}
      </div>
      <OnboardingWelcome />
      <OnboardingBar />
    </OnboardingProvider>
  )
}
