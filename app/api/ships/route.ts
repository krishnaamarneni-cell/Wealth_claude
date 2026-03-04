import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from("ship_cache")
    .select("ships")

  const ships = data?.flatMap(row => row.ships ?? []) ?? []

  return NextResponse.json({ ships, count: ships.length })
}
