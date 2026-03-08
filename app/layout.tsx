import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AnalyticsWrapper from "@/components/Analytics"
// Analytics is a client component and properly handles ssr: false
import "./globals.css"

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
      { url: "/favicon-512.jpg", type: "image/jpeg" },
    ],
    apple: [
      { url: "/favicon-512.jpg", type: "image/jpeg" },
    ],
    shortcut: "/favicon-512.jpg",
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
          {children}
          <AnalyticsWrapper />
        </ThemeProvider>
      </body>
    </html>
  )
}
