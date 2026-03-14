import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

// Get today's date in ISO format
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// Fetch from Finnhub
async function fetchFinnhub(endpoint: string): Promise<any> {
  const url = `https://finnhub.io/api/v1${endpoint}&token=${process.env.FINNHUB_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub error: ${response.status}`);
  }
  return response.json();
}

// Fetch stock quote
async function getStockQuote(symbol: string): Promise<{ price: number; change: number }> {
  try {
    const data = await fetchFinnhub(`/quote?symbol=${symbol}`);
    return {
      price: data.c || 0, // Current price
      change: data.dp || 0, // Percent change
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return { price: 0, change: 0 };
  }
}

// Fetch crypto from Finnhub
async function getCryptoQuote(symbol: string): Promise<{ price: number; change: number }> {
  try {
    // Finnhub crypto uses exchange:pair format
    const data = await fetchFinnhub(`/quote?symbol=${symbol}`);
    return {
      price: data.c || 0,
      change: data.dp || 0,
    };
  } catch (error) {
    console.error(`Error fetching crypto ${symbol}:`, error);
    // Fallback: try alternative endpoint
    return { price: 0, change: 0 };
  }
}

// Fetch Fear & Greed Index (Alternative.me - no key needed)
async function getFearGreedIndex(): Promise<{ value: number; label: string }> {
  try {
    const response = await fetch("https://api.alternative.me/fng/?limit=1");
    const data = await response.json();
    const fng = data.data[0];
    return {
      value: parseInt(fng.value),
      label: fng.value_classification, // "Fear", "Greed", "Extreme Fear", etc.
    };
  } catch (error) {
    console.error("Error fetching Fear & Greed:", error);
    return { value: 50, label: "Neutral" };
  }
}

// Fetch currency rates
async function getCurrencyRates(): Promise<{ usd_inr: number; usd_eur: number }> {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATE_API_KEY}/latest/USD`
    );
    const data = await response.json();
    return {
      usd_inr: data.conversion_rates.INR || 0,
      usd_eur: data.conversion_rates.EUR || 0,
    };
  } catch (error) {
    console.error("Error fetching currency rates:", error);
    return { usd_inr: 0, usd_eur: 0 };
  }
}

// Fetch top gainers/losers from Finnhub
async function getTopMovers(): Promise<{ gainers: any[]; losers: any[] }> {
  try {
    // Finnhub doesn't have direct gainers/losers endpoint on free tier
    // We'll fetch popular stocks and calculate ourselves
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'NFLX', 'CRM'];

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        const quote = await getStockQuote(symbol);
        return {
          symbol,
          name: symbol, // We could fetch company names too
          price: quote.price,
          change: quote.change,
        };
      })
    );

    // Sort by change
    const sorted = quotes.filter(q => q.price > 0).sort((a, b) => b.change - a.change);

    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
    };
  } catch (error) {
    console.error("Error fetching top movers:", error);
    return { gainers: [], losers: [] };
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = getTodayISO();
    console.log(`Fetching market data for: ${today}`);

    // Fetch all data in parallel
    const [
      sp500,
      dow,
      nasdaq,
      btc,
      eth,
      fearGreed,
      currencies,
      topMovers,
    ] = await Promise.all([
      getStockQuote("SPY"),   // S&P 500 ETF
      getStockQuote("DIA"),   // Dow Jones ETF
      getStockQuote("QQQ"),   // NASDAQ ETF
      getCryptoQuote("BINANCE:BTCUSDT"),
      getCryptoQuote("BINANCE:ETHUSDT"),
      getFearGreedIndex(),
      getCurrencyRates(),
      getTopMovers(),
    ]);

    // Prepare data for storage
    const marketData = {
      cache_date: today,

      // Market Indices (using ETF prices as proxies)
      sp500_price: sp500.price,
      sp500_change: sp500.change,
      dow_price: dow.price,
      dow_change: dow.change,
      nasdaq_price: nasdaq.price,
      nasdaq_change: nasdaq.change,

      // Crypto
      btc_price: btc.price,
      btc_change: btc.change,
      eth_price: eth.price,
      eth_change: eth.change,

      // Currency
      usd_inr: currencies.usd_inr,
      usd_eur: currencies.usd_eur,

      // Sentiment
      fear_greed_value: fearGreed.value,
      fear_greed_label: fearGreed.label,

      // Top Movers
      top_gainers: topMovers.gainers,
      top_losers: topMovers.losers,

      fetched_at: new Date().toISOString(),
    };

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from("market_data_cache")
      .upsert(marketData, { onConflict: "cache_date" })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error", details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Market data cached for ${today}`,
      data: {
        indices: {
          sp500: { price: sp500.price, change: sp500.change },
          dow: { price: dow.price, change: dow.change },
          nasdaq: { price: nasdaq.price, change: nasdaq.change },
        },
        crypto: {
          btc: { price: btc.price, change: btc.change },
          eth: { price: eth.price, change: eth.change },
        },
        currencies: currencies,
        fearGreed: fearGreed,
        topMovers: topMovers,
      },
    });

  } catch (error) {
    console.error("Market data fetch error:", error);
    return NextResponse.json({
      error: "Failed to fetch market data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}