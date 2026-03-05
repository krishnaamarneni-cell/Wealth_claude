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
    "portfolio tracker, stock portfolio tracker, investment tracker, wealth management, AI portfolio analysis, free portfolio tracker, AI stock tracker",
  alternates: {
    canonical: "https://www.wealthclaude.com",
  },
  verification: {
    google: "k6ogtZfRjD_sjQ0Rf1XyuB7D9Huce1RopsC2tgCfWzk",
  },
  openGraph: {
    title: "WealthClaude - AI-Powered Portfolio Tracker",
    description:
      "WealthClaude — AI-powered portfolio tracker with real-time market intelligence. Track stocks, analyze performance and get AI insights. Free to start.",
    url: "https://www.wealthclaude.com",
    siteName: "WealthClaude",
    type: "website",
    images: [
      {
        url: "/logo.png",
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
    images: ["/logo.png"],
  },
  robots: "index, follow",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "48x48",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WealthClaude",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="k6ogtZfRjD_sjQ0Rf1XyuB7D9Huce1RopsC2tgCfWzk"
        />
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
          {children}
          <AnalyticsWrapper />
        </ThemeProvider>
      </body>
    </html>
  )
}
