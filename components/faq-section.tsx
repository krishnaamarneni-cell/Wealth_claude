"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Which assets do TrackFolio support?",
    answer:
      "TrackFolio tracks a wide variety of assets including US, UK, Europe, Canada, Singapore, Australia, Brazil, South Korea and other global stocks from more than 70+ exchanges, 20000+ ETFs, and Cryptocurrencies.",
  },
  {
    question: "Is TrackFolio available for free?",
    answer:
      "You can create a free portfolio on TrackFolio. This will have access to almost all of the functionalities. However, when your number of trades get larger, you will have to upgrade to see the full portfolio.",
  },
  {
    question: "How can I track all my investments?",
    answer:
      "Simply input the trades you made via our intuitive interface or by uploading a file containing your trade history. Once TrackFolio has data on your past trades, it's ready to track and visualize all your portfolios in various aspects.",
  },
  {
    question: "Can I import my trade history from my Brokerage?",
    answer:
      "Absolutely! TrackFolio supports file formats from major brokerages including Interactive Brokers, TD Ameritrade, Charles Schwab, Fidelity, Robinhood, E*TRADE, and 50+ more brokers worldwide.",
  },
  {
    question: "How do the market heat maps work?",
    answer:
      "Our heat maps provide real-time visualization of market performance. Stock sizes represent market capitalization, while colors indicate daily performance - green for gains and red for losses. You can toggle between S&P 500 and NASDAQ 100 views.",
  },
  {
    question: "Is my financial data secure?",
    answer:
      "Yes, we take security seriously. Your data is encrypted at rest and in transit. We never store your brokerage login credentials, and you can export or delete your data at any time.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about TrackFolio
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
            >
              <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
