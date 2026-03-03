"use client"

import { useEffect, useRef } from "react"
import { MarketDataPoint, formatPrice } from "@/lib/mockData"
import { pctToColor, pctToTextClass } from "@/lib/colorScale"

interface CountryPanelProps {
  data: MarketDataPoint | null
  countryName: string | null
  onClose: () => void
}

export function CountryPanel({ data, countryName, onClose }: CountryPanelProps) {
  const isOpen = data !== null
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const pctClass = pctToTextClass(data?.changePct)
  const fillColor = pctToColor(data?.changePct)
  const isUp = (data?.changePct ?? 0) > 0
  const isDown = (data?.changePct ?? 0) < 0

  return (
    <>
      {/* Backdrop (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-80 z-40
          bg-[#0d1117] border-l border-white/8
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            {/* Color dot */}
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-lg"
              style={{ background: fillColor, boxShadow: `0 0 8px ${fillColor}` }}
            />
            <div>
              <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                {countryName ?? ""}
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                {data?.indexName ?? "—"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8"
          >
            ×
          </button>
        </div>

        {data ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Big price + change */}
            <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-5">
              <div className="text-3xl font-extrabold text-white tabular-nums mb-1">
                {formatPrice(data.price, data.currency)}
              </div>
              <div className="text-xs text-white/40 mb-3">{data.currency}</div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-2xl font-bold tabular-nums ${pctClass}`}
                >
                  {isUp ? "+" : ""}{data.changePct.toFixed(2)}%
                </span>
                <span className={`text-sm tabular-nums ${pctClass} opacity-70`}>
                  {isUp ? "▲" : isDown ? "▼" : ""} {data.change >= 0 ? "+" : ""}{formatPrice(data.change, data.currency)}
                </span>
              </div>

              {/* Mini change bar */}
              <div className="mt-4 h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.abs(data.changePct) / 5 * 100)}%`,
                    marginLeft: data.changePct < 0 ? undefined : undefined,
                    background: fillColor,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/20 mt-1">
                <span>-5%</span><span>0%</span><span>+5%</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Exchange", value: data.exchange },
                { label: "Ticker", value: data.ticker },
                { label: "Prev. Close", value: formatPrice(data.previousClose, data.currency) },
                { label: "Currency", value: data.currency },
                { label: "Status", value: data.isOpen ? "Open" : "Closed" },
                { label: "Last Updated", value: data.lastUpdated },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-white/3 border border-white/8 px-3 py-2.5">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">{s.label}</div>
                  <div className="text-sm font-semibold text-white truncate">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Sentiment bar */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Daily Sentiment</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400 w-8 text-right">Bear</span>
                <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden relative">
                  {/* Neutral center marker */}
                  <div className="absolute left-1/2 top-0 w-px h-full bg-white/20" />
                  <div
                    className="absolute top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(50, Math.abs(data.changePct) / 5 * 50)}%`,
                      left: data.changePct >= 0 ? "50%" : undefined,
                      right: data.changePct < 0 ? "50%" : undefined,
                      background: fillColor,
                    }}
                  />
                </div>
                <span className="text-xs text-emerald-400 w-8">Bull</span>
              </div>
              <div className="text-center mt-2">
                <span className={`text-xs font-bold ${pctClass}`}>
                  {Math.abs(data.changePct) < 0.3 ? "Neutral" :
                    Math.abs(data.changePct) < 1 ? (isUp ? "Mildly Bullish" : "Mildly Bearish") :
                      Math.abs(data.changePct) < 2.5 ? (isUp ? "Bullish" : "Bearish") :
                        (isUp ? "Strongly Bullish" : "Strongly Bearish")}
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="text-[10px] text-white/20 text-center leading-relaxed">
              End-of-day data · Auto-refreshes 4:30 PM ET
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
            Select a country on the globe
          </div>
        )}
      </div>
    </>
  )
}
