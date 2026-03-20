import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AnalyticsWrapper from "@/components/Analytics"
// Analytics is a client component and properly handles ssr: false
import "./globals.css"
import { AIChatButtonPublic } from "@/components/ai-chat/chat-button-public"
import { OnboardingProviderWrapper } from "@/components/onboarding-provider-wrapper"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wealthclaude.com"),
  title: "WealthClaude - AI-Powered Portfolio Tracker",
  description:
    "WealthClaude — AI-powered portfolio tracker with real-time market intelligence. Track stocks, analyze performance and get AI insights. Free to start.",
  keywords:
    "portfolio tracker, stock portfolio tracker, investment tracker, wealth management, AI portfolio analysis, free portfolio tracker, AI stock tracker, market intelligence",
  alternates: {
    canonical: "https://www.wealthclaude.com",
  },
  verification: {
    google: "k6ogtZfRjD_sjQ0Rf1XyuB7D9Huce1RopsC2tgCfWzk",
    other: {
      "msvalidate.01": "5D22DCD29FB1E60647A1628D46B35F98",
    },
  },
  openGraph: {
    title: "WealthClaude - AI-Powered Portfolio Tracker",
    description:
      "WealthClaude — AI-powered portfolio tracker with real-time market intelligence. Track stocks, analyze performance and get AI insights. Free to start.",
    url: "https://www.wealthclaude.com",
    siteName: "WealthClaude",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png?v=2",
        width: 1200,
        height: 630,
        alt: "WealthClaude - AI-Powered Portfolio Tracker",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WealthClaude - AI-Powered Portfolio Tracker",
    description:
      "WealthClaude — AI-powered portfolio tracker with real-time market intelligence. Track stocks, analyze performance and get AI insights. Free to start.",
    creator: "@wealthclaude",
    images: ["/logo.png?v=2"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.jpg", type: "image/jpeg", sizes: "any" },
    ],
    apple: [
      { url: "/icon.jpg", type: "image/jpeg" },
    ],
    shortcut: "/icon.jpg",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WealthClaude",
  },
  category: "Finance",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress globe.gl Three.js warnings
            const originalWarn = console.warn;
            const originalError = console.error;
            
            function shouldSuppress(msg) {
              const str = String(msg || '');
              return str.includes('Multiple instances of Three.js') || 
                     str.includes('multiple instances') ||
                     (str.includes('WebGLRenderer') && str.includes('useLegacyLights'));
            }
            
            console.warn = function(...args) {
              if (args.some(shouldSuppress)) return;
              originalWarn.apply(console, args);
            };
            
            console.error = function(...args) {
              if (args.some(shouldSuppress)) return;
              originalError.apply(console, args);
            };
          `
        }} />
      </head>
      <body
        className="font-sans antialiased min-h-screen"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <OnboardingProviderWrapper>
            {children}
          </OnboardingProviderWrapper>
          <AnalyticsWrapper />
          <AIChatButtonPublic />
        </ThemeProvider>
      </body>
    </html>
  )
}
