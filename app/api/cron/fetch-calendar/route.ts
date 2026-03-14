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

// Get next week's date range
function getNextWeekRange(): { start: string; end: string; weekStart: string } {
  const today = new Date();

  // Find next Monday
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateISO = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return {
    start: formatDate(nextMonday),
    end: formatDate(nextSunday),
    weekStart: formatDateISO(nextMonday)
  };
}

// Call Perplexity API
async function fetchFromPerplexity(prompt: string): Promise<any> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: "You are a financial data assistant. Return data in valid JSON format only. No markdown, no explanation, just JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Parse Perplexity response to JSON
function parseCalendarResponse(response: string): any[] {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Try parsing as-is
    return JSON.parse(response);
  } catch (error) {
    console.error("Failed to parse Perplexity response:", response);
    return [];
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
    const { start, end, weekStart } = getNextWeekRange();

    console.log(`Fetching calendar for: ${start} to ${end}`);

    // Build prompt for Perplexity
    const prompt = `
List ALL important financial and economic events for the week of ${start} to ${end}. Include:

1. Federal Reserve events (FOMC meetings, Fed chair speeches, minutes releases)
2. Major company earnings reports (especially: AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, and other S&P 500 companies)
3. Economic data releases (CPI, PPI, GDP, Jobs Report, Unemployment, Retail Sales, Housing Data, Consumer Confidence)
4. Notable IPOs
5. Important dividend ex-dates for major stocks
6. Options expiration dates
7. Any other market-moving events

Return ONLY a JSON array with this exact format, no other text:
[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM AM/PM" or "All Day",
    "name": "Event name",
    "type": "fed" | "earnings" | "economic" | "ipo" | "dividend" | "other",
    "importance": "high" | "medium" | "low",
    "symbol": "AAPL" or null,
    "description": "Brief description"
  }
]

Be thorough and include at least 15-20 events if available.
`;

    // Fetch from Perplexity
    const perplexityResponse = await fetchFromPerplexity(prompt);
    const events = parseCalendarResponse(perplexityResponse);

    if (!events || events.length === 0) {
      console.error("No events parsed from Perplexity");
      return NextResponse.json({
        error: "Failed to parse calendar events",
        raw: perplexityResponse
      }, { status: 500 });
    }

    console.log(`Parsed ${events.length} events`);

    // Delete old events for this week (if re-running)
    await supabase
      .from("economic_calendar")
      .delete()
      .eq("week_start", weekStart);

    // Insert new events
    const eventsToInsert = events.map((event: any) => ({
      event_date: event.date,
      event_time: event.time || "All Day",
      event_name: event.name,
      event_type: event.type || "other",
      description: event.description || null,
      importance: event.importance || "medium",
      related_symbol: event.symbol || null,
      week_start: weekStart,
      source: "perplexity",
      fetched_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("economic_calendar")
      .insert(eventsToInsert)
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database error", details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Fetched and stored ${events.length} events`,
      week: `${start} to ${end}`,
      weekStart,
      eventsCount: events.length,
      events: data,
    });

  } catch (error) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json({
      error: "Failed to fetch calendar",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}