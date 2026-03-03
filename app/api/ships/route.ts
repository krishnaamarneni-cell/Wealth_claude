import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from("ship_cache")
    .select("region, ships, updated_at")

  if (error || !data?.length) {
    return NextResponse.json({ ships: [], count: 0, cached: false })
  }

  const ships = data.flatMap(row => row.ships ?? [])
  const oldestUpdate = data.reduce((oldest, row) =>
    row.updated_at < oldest ? row.updated_at : oldest,
    data[0].updated_at
  )

  return NextResponse.json({
    ships,
    count: ships.length,
    fetchedAt: oldestUpdate,
    cached: true,
  }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
  })
}