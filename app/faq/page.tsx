"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ArrowLeft, HelpCircle, Shield, CreditCard, Zap, BarChart3, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  title: string
  icon: React.ReactNode
  items: FAQItem[]
}

const faqData: FAQCategory[] = [
  {
    title: "Getting Started",
    icon: <Zap className="w-5 h-5" />,
    items: [
      {
        question: "What is WealthClaude?",
        answer: "WealthClaude is an AI-powered financial intelligence platform that helps you track your portfolio, analyze your investments, and make smarter financial decisions. We combine real-time market data with advanced analytics and AI insights to give you a complete picture of your financial health."
      },
      {
        question: "How do I get started?",
        answer: "Simply create an account, connect your brokerage or upload your transaction history, and WealthClaude will automatically calculate your holdings, performance, and provide personalized insights. The entire setup takes less than 5 minutes."
      },
      {
        question: "Which brokerages do you support?",
        answer: "You can upload transaction history from any brokerage in CSV format. We support standard formats from Fidelity, Charles Schwab, TD Ameritrade, Robinhood, E*TRADE, Vanguard, and most other major brokerages. Manual entry is also available."
      },
      {
        question: "Is my data secure?",
        answer: "Absolutely. We use bank-level 256-bit encryption for all data transmission and storage. We never store your brokerage credentials, and your financial data is encrypted at rest. We're SOC 2 compliant and undergo regular security audits."
      }
    ]
  },
  {
    title: "Plans & Pricing",
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      {
        question: "What's included in the Free plan?",
        answer: "The Free plan includes portfolio overview, holdings tracking, transaction history, heat maps, and stock comparison tools. It's perfect for getting started and understanding your basic portfolio metrics."
      },
      {
        question: "What additional features do I get with Pro?",
        answer: "Pro ($5.99/month) unlocks performance analytics, detailed portfolio breakdowns, trade analysis, goal tracking, and priority support. Pro users also get access to advanced charts and historical performance data."
      },
      {
        question: "What makes Premium worth it?",
        answer: "Premium ($9.99/month) includes everything in Pro plus our AI portfolio assistant. Get personalized insights, smart rebalancing recommendations, and unlimited AI-powered queries about your portfolio. It's like having a financial advisor in your pocket."
      },
      {
        question: "Is there a free trial?",
        answer: "Yes! Pro monthly subscriptions come with a 7-day free trial. You can explore all Pro features risk-free, and cancel anytime before the trial ends if it's not for you."
      },
      {
        question: "Can I switch plans?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the end of your current billing period."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor, Stripe. We also support Apple Pay and Google Pay."
      }
    ]
  },
  {
    title: "Portfolio & Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    items: [
      {
        question: "How is my portfolio value calculated?",
        answer: "Your portfolio value is calculated using real-time market prices from major exchanges. We multiply your share count by the current market price for each holding and sum the totals. Prices are updated throughout market hours."
      },
      {
        question: "How do you calculate my returns?",
        answer: "We use time-weighted returns (TWR) to calculate your performance, which accounts for the timing and size of your contributions. This gives you an accurate picture of how your investments are performing independent of cash flows."
      },
      {
        question: "What is the rebalancing feature?",
        answer: "Our rebalancing tool helps you maintain your target asset allocation. Set your desired percentages for each holding, and we'll show you exactly what to buy or sell to get back on track. Pro users also get tax-aware recommendations."
      },
      {
        question: "How often is data updated?",
        answer: "Portfolio values update in real-time during market hours (9:30 AM - 4:00 PM ET). After-hours and pre-market data is also available. Historical data and analytics are recalculated daily."
      },
      {
        question: "Can I track multiple portfolios?",
        answer: "Yes! You can create multiple portfolios to track different accounts or investment strategies separately. Each portfolio has its own analytics and insights."
      }
    ]
  },
  {
    title: "AI Assistant",
    icon: <MessageCircle className="w-5 h-5" />,
    items: [
      {
        question: "What can the AI assistant do?",
        answer: "Our AI assistant can answer questions about your portfolio, explain market trends, provide personalized insights, suggest rebalancing strategies, and help you understand complex financial concepts. It's trained on financial data and has context about your specific holdings."
      },
      {
        question: "Is the AI giving me financial advice?",
        answer: "The AI provides educational information and analysis based on your portfolio data. It's designed to help you make more informed decisions, but it's not a replacement for professional financial advice. Always consult with a qualified advisor for major financial decisions."
      },
      {
        question: "How many questions can I ask?",
        answer: "Premium users get unlimited AI queries. The AI assistant is available 24/7 and can handle complex, multi-part questions about your investments and financial goals."
      }
    ]
  },
  {
    title: "Security & Privacy",
    icon: <Shield className="w-5 h-5" />,
    items: [
      {
        question: "How do you protect my data?",
        answer: "We use industry-leading security practices including 256-bit SSL encryption, secure data centers, regular security audits, and strict access controls. Your data is encrypted both in transit and at rest."
      },
      {
        question: "Do you sell my data?",
        answer: "Never. Your financial data is yours alone. We don't sell, share, or monetize your personal information. Our business model is based on subscriptions, not data harvesting."
      },
      {
        question: "Can I delete my data?",
        answer: "Yes, you can delete your account and all associated data at any time from your profile settings. Once deleted, your data is permanently removed from our systems within 30 days."
      },
      {
        question: "Do you have read-only access to my brokerage?",
        answer: "We don't connect directly to your brokerage accounts. You upload transaction data via CSV files, which means we never have access to your brokerage credentials or the ability to make trades on your behalf."
      }
    ]
  }
]

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors"
      >
        <span className="font-medium pr-4">{item.question}</span>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-96 pb-4" : "max-h-0"
      )}>
        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  )
}

function FAQSection({ category }: { category: FAQCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
          {category.icon}
        </div>
        <h2 className="text-xl font-semibold">{category.title}</h2>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        {category.items.map((item, index) => (
          <FAQAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
              <HelpCircle className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
              <p className="text-muted-foreground mt-1">
                Everything you need to know about WealthClaude
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {faqData.map((category, index) => (
          <FAQSection key={index} category={category} />
        ))}

        {/* Contact Section */}
        <div className="mt-16 text-center p-8 bg-card border border-border rounded-2xl">
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <a href="mailto:support@wealthclaude.com">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/upgrade">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} WealthClaude. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
