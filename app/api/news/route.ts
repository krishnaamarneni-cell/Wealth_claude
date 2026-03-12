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

// ── NewsAPI ────────────────────────────────────────────────────────────
async function fetchNewsAPI(country: string, iso2: string): Promise<Article[]> {
  const key = process.env.NEWSAPI_KEY
  if (!key) throw new Error("No NEWSAPI_KEY")

  // Try country-specific endpoint first, fall back to everything search
  const url = `https://newsapi.org/v2/top-headlines?country=${iso2}&category=business&pageSize=5&apiKey=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`)
  const json = await res.json()

  let articles = (json.articles ?? []).filter((a: any) => a.title && a.url)

  // If country endpoint returns < 3 results, fall back to keyword search
  if (articles.length < 3) {
    const url2 = `https://newsapi.org/v2/everything?q=${encodeURIComponent(country + " economy finance")}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${key}`
    const res2 = await fetch(url2, { signal: AbortSignal.timeout(8000) })
    if (res2.ok) {
      const json2 = await res2.json()
      articles = (json2.articles ?? []).filter((a: any) => a.title && a.url)
    }
  }

  return articles.slice(0, 5).map((a: any) => ({
    title: a.title,
    description: a.description ?? "",
    url: a.url,
    source: a.source?.name ?? "NewsAPI",
    publishedAt: a.publishedAt,
  }))
}

// ── GNews ──────────────────────────────────────────────────────────────
async function fetchGNews(country: string, iso2: string): Promise<Article[]> {
  const key = process.env.GNEWS_KEY
  if (!key) throw new Error("No GNEWS_KEY")

  const q = encodeURIComponent(`${country} economy finance stock market`)
  const url = `https://gnews.io/api/v4/search?q=${q}&lang=en&country=${iso2}&max=5&token=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`GNews HTTP ${res.status}`)
  const json = await res.json()

  return (json.articles ?? []).slice(0, 5).map((a: any) => ({
    title: a.title,
    description: a.description ?? "",
    url: a.url,
    source: a.source?.name ?? "GNews",
    publishedAt: a.publishedAt,
  }))
}

// ── TheNewsAPI ─────────────────────────────────────────────────────────
async function fetchTheNewsAPI(country: string, iso2: string): Promise<Article[]> {
  const key = process.env.THENEWSAPI_KEY
  if (!key) throw new Error("No THENEWSAPI_KEY")

  const q = encodeURIComponent(`${country} economy finance`)
  const url = `https://api.thenewsapi.com/v1/news/all?search=${q}&language=en&locale=${iso2}&limit=5&api_token=${key}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`TheNewsAPI HTTP ${res.status}`)
  const json = await res.json()

  return (json.data ?? []).slice(0, 5).map((a: any) => ({
    title: a.title,
    description: a.description ?? "",
    url: a.url,
    source: a.source ?? "TheNewsAPI",
    publishedAt: a.published_at,
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
  if (!key) return ""

  const direction = changePct > 0 ? `up ${changePct.toFixed(2)}%` : `down ${Math.abs(changePct).toFixed(2)}%`
  const headlines = articles.map((a, i) => `${i + 1}. ${a.title}. ${a.description}`).join("\n")

  const prompt = `You are a financial analyst. The ${indexName} (${countryName}) is ${direction} today.

Based on these recent headlines, write a 2-3 sentence summary explaining the key factors driving ${countryName}'s market and economy right now. Be specific, factual, and focused on market impact. Do not mention the headlines directly.

Headlines:
${headlines}`

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
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) return ""
  const json = await res.json()
  return json.choices?.[0]?.message?.content?.trim() ?? ""
}

// ── Main handler ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const country = searchParams.get("country") ?? ""
  const iso2 = searchParams.get("iso2") ?? ""
  const indexName = searchParams.get("indexName") ?? ""
  const changePct = parseFloat(searchParams.get("changePct") ?? "0")

  if (!country) {
    return NextResponse.json({ error: "Missing country param" }, { status: 400 })
  }

  // Try each news source in order, stop at first success
  let articles: Article[] = []
  const errors: string[] = []

  for (const fetcher of [
    () => fetchNewsAPI(country, iso2),
    () => fetchGNews(country, iso2),
    () => fetchTheNewsAPI(country, iso2),
  ]) {
    try {
      const result = await fetcher()
      if (result.length >= 2) {
        articles = result
        break
      }
    } catch (e: any) {
      errors.push(e.message)
    }
  }

  // Groq summary — runs in parallel with article fetch if we have articles
  const summary = articles.length > 0
    ? await summarizeWithGroq(articles, country, indexName, changePct).catch(() => "")
    : ""

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