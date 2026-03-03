import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const job = searchParams.get("job")

  if (job === "blog") {
    // Forward to existing auto-blog handler
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auto-blog`, {
      headers: { authorization: req.headers.get("authorization") ?? "" }
    })
    const data = await res.json()
    return NextResponse.json({ job: "blog", ...data })
  }

  if (job === "ships") {
    // Forward to ships-all handler
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/ships-all`, {
      headers: { authorization: req.headers.get("authorization") ?? "" }
    })
    const data = await res.json()
    return NextResponse.json({ job: "ships", ...data })
  }

  return NextResponse.json({ error: "Unknown job" }, { status: 400 })
}
