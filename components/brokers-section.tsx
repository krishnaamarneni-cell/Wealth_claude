import { Button } from "@/components/ui/button"
import { Upload, Eye, TrendingUp, Lightbulb } from "lucide-react"

const steps = [
  {
    icon: Upload,
    step: "1",
    title: "Export trades from your broker account",
    description: "Download your transaction history from any supported broker.",
  },
  {
    icon: Eye,
    step: "2", 
    title: "Upload the file",
    description: "Simply drag and drop or select your exported file.",
  },
  {
    icon: TrendingUp,
    step: "3",
    title: "Monitor your performance against a benchmark",
    description: "See how your portfolio compares to market indices.",
  },
  {
    icon: Lightbulb,
    step: "4",
    title: "Learn from your decisions",
    description: "Analyze your trades and become a better investor.",
  },
]

const brokers = [
  "Interactive Brokers",
  "TD Ameritrade",
  "Charles Schwab",
  "Fidelity",
  "Robinhood",
  "E*TRADE",
  "Webull",
  "Vanguard",
  "Trading 212",
  "DEGIRO",
  "M1 Finance",
  "Freetrade",
]

export function BrokersSection() {
  return (
    <section id="brokers" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Easy To Import From Your Brokers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Get started in minutes. We support file formats from all major brokerages worldwide.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Supported Brokers */}
        <div className="bg-card rounded-2xl border border-border p-8 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
            Supported Brokers
          </h3>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {brokers.map((broker) => (
              <span
                key={broker}
                className="px-4 py-2 bg-secondary rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-default"
              >
                {broker}
              </span>
            ))}
            <span className="px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
              + 50 more
            </span>
          </div>
          <div className="text-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Try for Free
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
