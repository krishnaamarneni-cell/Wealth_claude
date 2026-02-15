import { PieChart, TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: PieChart,
    badge: "Investment Allocation Tracker",
    title: "Visualize Asset Allocation",
    description:
      "Easily analyze and evaluate your investment portfolio with an allocation breakdown in multiple perspectives which includes businesses, industries, sectors, countries and more.",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: TrendingUp,
    badge: "Portfolio Performance Report",
    title: "Portfolio Performance Tracker",
    description:
      "Track, measure and analyze portfolio performance of your holdings at customizable time intervals possible within a glance.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: DollarSign,
    badge: "Dividend Portfolio Tracker",
    title: "Track Your Dividend",
    description:
      "Track your dividend investments globally, including in the US, UK, Europe, Canada, Singapore, Australia, Brazil, South Korea and more.",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  {
    icon: BarChart3,
    badge: "Trade Performance Report",
    title: "Analyze your Decisions",
    description:
      "With our portfolio trade analyzer, you can see the impacts and performances of each trade or action you make and compare them against the benchmarks.",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            All In One Portfolio Tracker
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Your all-in-one portfolio tracking solution that combines all your investments in one place.
            Available on iOS and Android.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl border border-border p-8 hover:border-primary/50 transition-all duration-300"
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <span className="inline-block text-xs font-medium text-primary mb-4 px-3 py-1 bg-primary/10 rounded-full">
                  {feature.badge}
                </span>
                
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>

                <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
                  Try for free
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
