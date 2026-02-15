"use client"

import { useState } from "react"
import { TradingViewHeatmap } from "./tradingview-heatmap"
import { Button } from "@/components/ui/button"

export function HeatmapsSection() {
  const [activeMap, setActiveMap] = useState<"SPX500" | "NDX">("SPX500")

  return (
    <section id="heatmaps" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Real-Time Market Heat Maps
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Visualize the entire market at a glance. Track sector performance and identify opportunities
            with our interactive S&P 500 and NASDAQ heat maps.
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant={activeMap === "SPX500" ? "default" : "outline"}
            onClick={() => setActiveMap("SPX500")}
            className={activeMap === "SPX500" 
              ? "bg-primary text-primary-foreground" 
              : "border-border text-foreground hover:bg-secondary"
            }
          >
            S&P 500
          </Button>
          <Button
            variant={activeMap === "NDX" ? "default" : "outline"}
            onClick={() => setActiveMap("NDX")}
            className={activeMap === "NDX" 
              ? "bg-primary text-primary-foreground" 
              : "border-border text-foreground hover:bg-secondary"
            }
          >
            NASDAQ 100
          </Button>
        </div>

        {/* Heat Maps */}
        <div className="max-w-6xl mx-auto">
          {activeMap === "SPX500" ? (
            <TradingViewHeatmap
              dataSource="SPX500"
              title="S&P 500 Stock Heat Map"
              height={600}
            />
          ) : (
            <TradingViewHeatmap
              dataSource="NDX"
              title="NASDAQ 100 Stock Heat Map"
              height={600}
            />
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Real-Time Data</h3>
            <p className="text-sm text-muted-foreground">
              Live market data updated continuously throughout trading hours.
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Sector Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Group stocks by sector to identify market trends and rotation.
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Visual Overview</h3>
            <p className="text-sm text-muted-foreground">
              Size represents market cap, color shows performance at a glance.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
