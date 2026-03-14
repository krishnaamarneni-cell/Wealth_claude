import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");
  const issueId = searchParams.get("issue");
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Decode the URL
  const targetUrl = decodeURIComponent(url);

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
        const clickedLinks = existing.clicked_links || [];
        clickedLinks.push({
          url: targetUrl,
          clicked_at: new Date().toISOString(),
        });

        await supabase
          .from("newsletter_analytics")
          .update({
            clicked_at: existing.clicked_at || new Date().toISOString(),
            click_count: (existing.click_count || 0) + 1,
            clicked_links: clickedLinks,
          })
          .eq("id", existing.id);
      }

      // Update subscriber's click count
      await supabase
        .from("subscribers")
        .update({
          total_clicks: supabase.rpc("increment_clicks", { row_email: email }),
        })
        .eq("email", email);

      // Update newsletter issue stats
      await supabase.rpc("update_newsletter_stats", { p_newsletter_id: issueId });

    } catch (error) {
      console.error("Click tracking error:", error);
      // Don't fail - still redirect
    }
  }

  // Redirect to the target URL
  return NextResponse.redirect(targetUrl);
}