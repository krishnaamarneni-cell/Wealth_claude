"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Clock, Loader2 } from "lucide-react"

export default function AssessmentThankYouPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  const [userName, setUserName] = useState("")

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/assessment/session?id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.full_name) {
            setUserName(data.full_name.split(" ")[0])
          }
        })
        .catch(console.error)
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg mx-auto text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Thank you{userName ? `, ${userName}` : ""}!
        </h1>

        {/* Message */}
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Your assessment has been submitted successfully. Our financial advisor will review your results and contact you within 24-48 hours with your personalized financial plan.
        </p>

        {/* Timeline Card */}
        <div className="bg-card border border-border rounded-xl p-6 inline-flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">What happens next?</p>
            <p className="text-sm text-muted-foreground">We'll email you within 24-48 hours</p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-muted-foreground">
          You can close this page now. We've saved all your responses.
        </p>

        {/* Logo */}
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">W</span>
          </div>
          <span className="text-sm">WealthClaude</span>
        </div>
      </div>
    </div>
  )
}
