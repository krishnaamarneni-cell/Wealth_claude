import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const job = searchParams.get("job")
  // Also support ?type= as a direct post_type override (e.g. ?job=blog&type=geopolitical)
  const typeParam = searchParams.get("type")

  if (job === "blog-schedule") {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://www.wealthclaude.com"

      const utcHour = new Date().getUTCHours()
      
      // Map UTC hour to post type
      let subJob = "blog-premarket"
      if (utcHour === 11) subJob = "blog-premarket"
      else if (utcHour === 14 || utcHour === 16) subJob = "blog-market"
      else if (utcHour === 21) subJob = "blog-aftermarket"
      else if (utcHour === 23) subJob = "blog-geopolitical"
      else if (utcHour === 2) subJob = "blog-education"

      console.log(`[CRON] Starting blog-schedule job at ${new Date().toISOString()}`)
      console.log(`[CRON] UTC hour: ${utcHour}`)
      console.log(`[CRON] Mapped to subJob: ${subJob}`)
      console.log(`[CRON] Forwarding to /api/cron/run?job=blog`)

      const cronSecret = process.env.CRON_SECRET ?? ""
      const res = await fetch(`${baseUrl}/api/cron/run?job=blog`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()

      console.log(`[CRON] blog job response status: ${res.status}`)
      console.log(`[CRON] blog job response:`, JSON.stringify(data, null, 2))

      if (!res.ok) {
        console.error(`[CRON] blog job failed:`, data)
        return NextResponse.json(
          { job: "blog-schedule", success: false, utcHour, subJob, error: data },
          { status: res.status }
        )
      }

      return NextResponse.json({ job: "blog-schedule", success: true, utcHour, subJob, ...data })
    } catch (err: any) {
      console.error(`[CRON] blog-schedule job threw an error:`, err?.message)
      return NextResponse.json(
        { job: "blog-schedule", success: false, error: err?.message },
        { status: 500 }
      )
    }
  }

  // Map specific job names to post_type — used by cron-job.org external crons
  const JOB_TO_POST_TYPE: Record<string, string> = {
    "blog": "",                      // no override — auto-blog uses UTC hour
    "blog-premarket": "premarket",
    "blog-market": "market-analysis",
    "blog-market-1": "market-analysis",
    "blog-market-2": "market-analysis",
    "blog-aftermarket": "aftermarket",
    "blog-geopolitical": "geopolitical",
    "blog-education": "education",
  }

  if (job === "blog" || job in JOB_TO_POST_TYPE) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://www.wealthclaude.com"

      const cronSecret = process.env.CRON_SECRET ?? ""
      // typeParam (?type=geopolitical) takes priority, then job-name map, then UTC hour
      const postType = typeParam || JOB_TO_POST_TYPE[job ?? ""] || ""

      console.log(`[CRON] Starting ${job} job at ${new Date().toISOString()}`)
      console.log(`[CRON] Resolved post_type: "${postType || "auto (UTC hour)"}" (typeParam=${typeParam}, job=${job})`)

      const res = await fetch(`${baseUrl}/api/auto-blog`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postType ? { post_type: postType } : {}),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error(`[CRON] auto-blog failed for ${job}:`, data)
        return NextResponse.json(
          { job, success: false, error: data },
          { status: res.status }
        )
      }

      return NextResponse.json({ job, success: true, ...data })
    } catch (err: any) {
      console.error(`[CRON] ${job} threw an error:`, err?.message)
      return NextResponse.json(
        { job, success: false, error: err?.message },
        { status: 500 }
      )
    }
  }

  if (job === "ships") {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.wealthclaude.com"

      console.log(`[CRON] Calling ships-all at: ${baseUrl}/api/cron/ships-all`)

      const res = await fetch(`${baseUrl}/api/cron/ships-all`, {
        headers: {
          authorization: req.headers.get("authorization") ?? "",
        },
      })

      const data = await res.json()

      console.log(`[CRON] ships-all response status: ${res.status}`)
      console.log(`[CRON] ships-all response data:`, JSON.stringify(data))

      if (!res.ok) {
        return NextResponse.json(
          { job: "ships", success: false, error: data },
          { status: res.status }
        )
      }

      return NextResponse.json({ job: "ships", success: true, ...data })
    } catch (err: any) {
      console.error(`[CRON] ships job threw an error:`, err?.message)
      return NextResponse.json(
        { job: "ships", success: false, error: err?.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: "Unknown job" }, { status: 400 })
}
