import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LineChart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border">
      {/* CTA Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            When it comes to your finance, we have to be serious.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Time is ticking! Have your investments under control now.
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
            Try for Free
          </Button>
        </div>
      </div>

      {/* Footer Links */}
      <div className="py-12 px-4 bg-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">

            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/market-heatmaps" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Heat Maps
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/#brokers" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Supported Brokers
                  </Link>
                </li>
                <li>
                  <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Free Tools — NEW */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-semibold text-foreground mb-4">Free Tools</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <ul className="space-y-3">
                  <li>
                    <Link href="/tools/fat-fire-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Fat FIRE Calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/barista-fire-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Barista FIRE Calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/lean-fire-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Lean FIRE Calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/coast-fire-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Coast FIRE Calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/early-retirement-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Early Retirement
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/dividend-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Dividend Calculator
                    </Link>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li>
                    <Link href="/tools/time-weighted-return" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Time-Weighted Return
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/money-weighted-return" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Money-Weighted Return
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/portfolio-rebalancing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Portfolio Rebalancing
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/portfolio-weight" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Portfolio Weight
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/dca-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      DCA Calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools/stock-profit-calculator" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                      Stock Profit Calculator
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <LineChart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">WealthClaude</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} WealthClaude. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Twitter/X */}
              <Link href="https://twitter.com/wealthclaude" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              {/* LinkedIn */}
              <Link href="https://www.linkedin.com/company/wealthclaude/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
