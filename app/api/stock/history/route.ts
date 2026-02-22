import { NextRequest, NextResponse } from "next/server"

const FMP_KEY = process.env.FMP_API_KEY || ""
const BASE = "https://financialmodelingprep.com/api/v3"

const PERIODS: Record<string, { intraday: boolean; interval?: string; timeseries?: number }> = {
  "1D": { intraday: true, interval: "5min" },
  "1W": { intraday: false, timeseries: 7 },
  "1M": { intraday: false, timeseries: 30 },
  "3M": { intraday: false, timeseries: 90 },
  "6M": { intraday: false, timeseries: 180 },
  "1Y": { intraday: false, timeseries: 365 },
  "5Y": { intraday: false, timeseries: 1825 },
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")
  const period = req.nextUrl.searchParams.get("period") || "1Y"
  if (!symbol) return NextResponse.json([], { status: 400 })

  const cfg = PERIODS[period] || PERIODS["1Y"]

  try {
    let points: { date: string; price: number }[] = []

    if (cfg.intraday) {
      const res = await fetch(`${BASE}/historical-chart/${cfg.interval}/${symbol}?apikey=${FMP_KEY}`)
      const json = await res.json()
      const today = new Date().toISOString().split("T")[0]
      points = (Array.isArray(json) ? json : [])
        .filter((d: any) => d.date?.startsWith(today))
        .map((d: any) => ({ date: d.date.split(" ")[1] ?? d.date, price: d.close }))
        .reverse()
      // fallback: if market closed use previous day
      if (points.length === 0) {
        points = (Array.isArray(json) ? json : [])
          .slice(0, 80)
          .map((d: any) => ({ date: d.date.split(" ")[1] ?? d.date, price: d.close }))
          .reverse()
      }
    } else {
      const res = await fetch(`${BASE}/historical-price-full/${symbol}?timeseries=${cfg.timeseries}&apikey=${FMP_KEY}`)
      const json = await res.json()
      points = ((json as any).historical || [])
        .map((d: any) => ({ date: d.date as string, price: d.close as number }))
        .reverse()
    }

    return NextResponse.json(points)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}

