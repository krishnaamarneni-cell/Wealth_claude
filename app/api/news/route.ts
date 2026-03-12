import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

interface Article {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
}

// ── GNews (primary — best free-tier country filtering) ─────────────────
async function fetchGNews(country: string, iso2: string): Promise<Article[]> {
  const key = process.env.GNEWS_KEY
  if (!key) throw new Error("No GNEWS_KEY")

  const q = encodeURIComponent(`${country} stock market economy`)
  const url = `https://gnews.io/api/v4/search?q=${q}&lang=en&max=5&token=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`GNews HTTP ${res.status}: ${text.slice(0, 100)}`)
  }

  const json = await res.json()
  const articles = (json.articles ?? []).filter((a: any) => a.title && a.url)
  if (articles.length === 0) throw new Error("GNews returned 0 articles")

  return articles.slice(0, 5).map((a: any) => ({
    title: a.title,
    description: a.description ?? "",
    url: a.url,
    source: a.source?.name ?? "GNews",
    publishedAt: a.publishedAt,
  }))
}

// ── TheNewsAPI (second) ────────────────────────────────────────────────
async function fetchTheNewsAPI(country: string): Promise<Article[]> {
  const key = process.env.THENEWSAPI_KEY
  if (!key) throw new Error("No THENEWSAPI_KEY")

  const q = encodeURIComponent(`${country} stock market economy finance`)
  const url = `https://api.thenewsapi.com/v1/news/all?search=${q}&language=en&limit=5&api_token=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`TheNewsAPI HTTP ${res.status}: ${text.slice(0, 100)}`)
  }

  const json = await res.json()
  const articles = (json.data ?? []).filter((a: any) => a.title && a.url)
  if (articles.length === 0) throw new Error("TheNewsAPI returned 0 articles")

  return articles.slice(0, 5).map((a: any) => ({
    title: a.title,
    description: a.description ?? "",
    url: a.url,
    source: a.source ?? "TheNewsAPI",
    publishedAt: a.published_at,
  }))
}

// ── NewsAPI (last resort — free tier only works with tight keyword query) 
async function fetchNewsAPI(country: string): Promise<Article[]> {
  const key = process.env.NEWSAPI_KEY
  if (!key) throw new Error("No NEWSAPI_KEY")

  // Free tier: use 'everything' with very tight query
  const q = encodeURIComponent(`"${country}" stock OR market OR economy OR index`)
  const url = `https://newsapi.org/v2/everything?q=${q}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`NewsAPI HTTP ${res.status}: ${text.slice(0, 100)}`)
  }

  const json = await res.json()
  if (json.status === "error") throw new Error(`NewsAPI error: ${json.message}`)

  // Filter articles to only keep ones that actually mention the country
  const countryLower = country.toLowerCase()
  const articles = (json.articles ?? [])
    .filter((a: any) => {
      const text = `${a.title ?? ""} ${a.description ?? ""}`.toLowerCase()
      return a.title && a.url && text.includes(countryLower)
    })

  if (articles.length === 0) throw new Error("NewsAPI: no country-relevant articles found")

  return articles.slice(0, 5).map((a: any) => ({
    title: a.title,
    description: a.description ?? "",
    url: a.url,
    source: a.source?.name ?? "NewsAPI",
    publishedAt: a.publishedAt,
  }))
}

// ── Groq summarizer ────────────────────────────────────────────────────
async function summarizeWithGroq(
  articles: Article[],
  countryName: string,
  indexName: string,
  changePct: number,
): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    console.error("[news] No GROQ_API_KEY set")
    return ""
  }

  const direction = changePct > 0
    ? `up ${changePct.toFixed(2)}%`
    : changePct < 0
      ? `down ${Math.abs(changePct).toFixed(2)}%`
      : "flat"

  const headlines = articles
    .map((a, i) => `${i + 1}. ${a.title}${a.description ? ". " + a.description.slice(0, 120) : ""}`)
    .join("\n")

  const prompt = `You are a financial analyst. The ${indexName} (${countryName}) is ${direction} today.

Based on these recent headlines, write 2-3 sentences explaining the key factors driving ${countryName}'s market performance right now. Be specific and focused on market impact. Do not say "based on the headlines" or reference the articles directly.

Headlines:
${headlines}

Summary:`

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error(`[news] Groq HTTP ${res.status}:`, text.slice(0, 200))
      return ""
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content?.trim() ?? ""
    if (!content) console.error("[news] Groq returned empty content:", JSON.stringify(json))
    return content
  } catch (e: any) {
    console.error("[news] Groq fetch error:", e.message)
    return ""
  }
}

// ── Main handler ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const country = searchParams.get("country") ?? ""
  const iso2 = searchParams.get("iso2") ?? "us"
  const indexName = searchParams.get("indexName") ?? ""
  const changePct = parseFloat(searchParams.get("changePct") ?? "0")

  if (!country) {
    return NextResponse.json({ error: "Missing country param" }, { status: 400 })
  }

  // Try each news source in order — stop at first with ≥2 articles
  let articles: Article[] = []
  const errors: string[] = []

  for (const [name, fetcher] of [
    ["GNews", () => fetchGNews(country, iso2)],
    ["TheNewsAPI", () => fetchTheNewsAPI(country)],
    ["NewsAPI", () => fetchNewsAPI(country)],
  ] as [string, () => Promise<Article[]>][]) {
    try {
      const result = await fetcher()
      console.log(`[news] ${name} returned ${result.length} articles for ${country}`)
      if (result.length >= 2) {
        articles = result
        break
      }
      errors.push(`${name}: only ${result.length} articles`)
    } catch (e: any) {
      console.error(`[news] ${name} failed for ${country}:`, e.message)
      errors.push(`${name}: ${e.message}`)
    }
  }

  // Groq summary
  const summary = articles.length > 0
    ? await summarizeWithGroq(articles, country, indexName, changePct)
    : ""

  console.log(`[news] Final: ${articles.length} articles, summary length: ${summary.length}, errors: ${errors.join(" | ")}`)

  return NextResponse.json({
    country,
    summary,
    articles,
    count: articles.length,
    errors: errors.length ? errors : undefined,
  }, {
    headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" }
  })
}