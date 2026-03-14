import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");
  const issueId = searchParams.get("issue");

  if (email && issueId) {
    try {
      // Update analytics record
      const { data: existing } = await supabase
        .from("newsletter_analytics")
        .select("*")
        .eq("subscriber_email", email)
        .eq("newsletter_id", issueId)
        .single();

      if (existing) {
        await supabase
          .from("newsletter_analytics")
          .update({
            opened_at: existing.opened_at || new Date().toISOString(),
            open_count: (existing.open_count || 0) + 1,
          })
          .eq("id", existing.id);
      }

      // Update subscriber's last opened timestamp
      await supabase
        .from("subscribers")
        .update({
          last_opened_at: new Date().toISOString(),
          total_opens: supabase.rpc("increment_opens", { row_email: email }),
        })
        .eq("email", email);

      // Update newsletter issue total opens
      await supabase.rpc("update_newsletter_stats", { p_newsletter_id: issueId });

    } catch (error) {
      console.error("Tracking error:", error);
      // Don't fail the request - still return the pixel
    }
  }

  // Return 1x1 transparent GIF
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}