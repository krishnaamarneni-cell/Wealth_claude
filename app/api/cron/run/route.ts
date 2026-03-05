import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const job = searchParams.get("job")

  if (job === "blog") {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://www.wealthclaude.com"

      console.log(`[CRON] Calling auto-blog at: ${baseUrl}/api/auto-blog`)

      const res = await fetch(`${baseUrl}/api/auto-blog`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
          "Content-Type": "application/json",
        },
      })


      const data = await res.json()

      console.log(`[CRON] auto-blog response status: ${res.status}`)
      console.log(`[CRON] auto-blog response data:`, JSON.stringify(data))

      if (!res.ok) {
        console.error(`[CRON] auto-blog failed:`, data)
        return NextResponse.json(
          { job: "blog", success: false, error: data },
          { status: res.status }
        )
      }

      return NextResponse.json({ job: "blog", success: true, ...data })
    } catch (err: any) {
      console.error(`[CRON] blog job threw an error:`, err?.message)
      return NextResponse.json(
        { job: "blog", success: false, error: err?.message },
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
