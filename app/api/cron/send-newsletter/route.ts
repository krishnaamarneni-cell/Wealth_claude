import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Types
interface MarketData {
  sp500_price: number;
  sp500_change: number;
  dow_price: number;
  dow_change: number;
  nasdaq_price: number;
  nasdaq_change: number;
  btc_price: number;
  btc_change: number;
  eth_price: number;
  eth_change: number;
  usd_inr: number;
  usd_eur: number;
  fear_greed_value: number;
  fear_greed_label: string;
  top_gainers: Array<{ symbol: string; price: number; change: number }>;
  top_losers: Array<{ symbol: string; price: number; change: number }>;
}

interface CalendarEvent {
  event_time: string;
  event_name: string;
  event_type: string;
  importance: string;
  related_symbol: string | null;
}

interface Subscriber {
  email: string;
  name: string | null;
}

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

// Get today's date
function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format change with color
function formatChange(change: number): string {
  const arrow = change >= 0 ? "📈" : "📉";
  const sign = change >= 0 ? "+" : "";
  return `${arrow} ${sign}${change.toFixed(2)}%`;
}

// Get emoji for market sentiment
function getSentimentEmoji(value: number): string {
  if (value <= 25) return "😱";
  if (value <= 45) return "😰";
  if (value <= 55) return "😐";
  if (value <= 75) return "😊";
  return "🤑";
}

// Generate subject line based on market performance
function generateSubjectLine(marketData: MarketData, issueNumber: number): string {
  const sp500Change = marketData.sp500_change;
  const emoji = sp500Change >= 1 ? "🚀" : sp500Change >= 0 ? "📈" : sp500Change >= -1 ? "📉" : "🔴";

  const sign = sp500Change >= 0 ? "+" : "";
  const topGainer = marketData.top_gainers[0];

  let subject = `${emoji} S&P ${sign}${sp500Change.toFixed(1)}%`;

  if (topGainer && topGainer.change > 3) {
    subject += ` | ${topGainer.symbol} on fire!`;
  }

  subject += ` | Issue #${issueNumber}`;

  return subject;
}

// Generate preview text
function generatePreviewText(marketData: MarketData): string {
  return `Your 2-min market brief: BTC $${formatNumber(marketData.btc_price)} • Fear & Greed: ${marketData.fear_greed_value}`;
}

// Build HTML email template
function buildEmailHTML(
  subscriberName: string,
  marketData: MarketData,
  todayEvents: CalendarEvent[],
  weekEvents: CalendarEvent[],
  issueNumber: number,
  issueDate: string,
  trackingPixelUrl: string
): string {
  const firstName = subscriberName?.split(" ")[0] || "Investor";

  // Determine overall market mood
  const marketMood = marketData.sp500_change >= 0 ? "green" : "red";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WealthClaude Daily</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  
  <!-- Tracking Pixel -->
  <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 16px 16px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: bold;">🌐 WealthClaude Daily</h1>
                    <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Issue #${issueNumber} · ${new Date(issueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </td>
                  <td align="right" style="color: white; font-size: 12px;">
                    ${marketMood === 'green' ? '🟢 Markets Up' : '🔴 Markets Down'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- GREETING -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px;">
              <p style="margin: 0; color: #e2e8f0; font-size: 16px;">
                Good morning, ${firstName}! ☕
              </p>
              <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">
                Here's your 2-minute market briefing.
              </p>
            </td>
          </tr>
          
          <!-- MARKET SNAPSHOT -->
          <tr>
            <td style="background-color: #1e293b; padding: 0 24px;">
              <h2 style="margin: 0 0 16px 0; color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                📊 Market Snapshot
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="padding: 12px; background-color: #0f172a; border-radius: 8px;">
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">S&P 500</p>
                    <p style="margin: 4px 0 0 0; color: white; font-size: 18px; font-weight: bold;">$${formatNumber(marketData.sp500_price)}</p>
                    <p style="margin: 4px 0 0 0; color: ${marketData.sp500_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 12px;">
                      ${formatChange(marketData.sp500_change)}
                    </p>
                  </td>
                  <td width="4"></td>
                  <td width="33%" style="padding: 12px; background-color: #0f172a; border-radius: 8px;">
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">DOW JONES</p>
                    <p style="margin: 4px 0 0 0; color: white; font-size: 18px; font-weight: bold;">$${formatNumber(marketData.dow_price)}</p>
                    <p style="margin: 4px 0 0 0; color: ${marketData.dow_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 12px;">
                      ${formatChange(marketData.dow_change)}
                    </p>
                  </td>
                  <td width="4"></td>
                  <td width="33%" style="padding: 12px; background-color: #0f172a; border-radius: 8px;">
                    <p style="margin: 0; color: #94a3b8; font-size: 11px;">NASDAQ</p>
                    <p style="margin: 4px 0 0 0; color: white; font-size: 18px; font-weight: bold;">$${formatNumber(marketData.nasdaq_price)}</p>
                    <p style="margin: 4px 0 0 0; color: ${marketData.nasdaq_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 12px;">
                      ${formatChange(marketData.nasdaq_change)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- TOP MOVERS -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                🔥 Top Movers
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="vertical-align: top;">
                    <p style="margin: 0 0 8px 0; color: #10b981; font-size: 12px; font-weight: bold;">WINNERS</p>
                    ${marketData.top_gainers.map(stock => `
                      <p style="margin: 4px 0; color: #e2e8f0; font-size: 14px;">
                        🟢 ${stock.symbol} <span style="color: #10b981;">+${stock.change.toFixed(1)}%</span>
                      </p>
                    `).join('')}
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align: top;">
                    <p style="margin: 0 0 8px 0; color: #ef4444; font-size: 12px; font-weight: bold;">LOSERS</p>
                    ${marketData.top_losers.map(stock => `
                      <p style="margin: 4px 0; color: #e2e8f0; font-size: 14px;">
                        🔴 ${stock.symbol} <span style="color: #ef4444;">${stock.change.toFixed(1)}%</span>
                      </p>
                    `).join('')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CRYPTO CORNER -->
          <tr>
            <td style="background-color: #1e293b; padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                ₿ Crypto Corner
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="padding: 12px; background-color: #0f172a; border-radius: 8px;">
                    <p style="margin: 0; color: #f7931a; font-size: 12px; font-weight: bold;">BITCOIN</p>
                    <p style="margin: 4px 0 0 0; color: white; font-size: 20px; font-weight: bold;">$${formatNumber(marketData.btc_price)}</p>
                    <p style="margin: 4px 0 0 0; color: ${marketData.btc_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 12px;">
                      ${formatChange(marketData.btc_change)}
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 12px; background-color: #0f172a; border-radius: 8px;">
                    <p style="margin: 0; color: #627eea; font-size: 12px; font-weight: bold;">ETHEREUM</p>
                    <p style="margin: 4px 0 0 0; color: white; font-size: 20px; font-weight: bold;">$${formatNumber(marketData.eth_price)}</p>
                    <p style="margin: 4px 0 0 0; color: ${marketData.eth_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 12px;">
                      ${formatChange(marketData.eth_change)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CURRENCY WATCH -->
          <tr>
            <td style="background-color: #1e293b; padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                💱 Currency Watch
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 8px; padding: 12px;">
                <tr>
                  <td style="padding: 12px;">
                    <span style="color: #94a3b8; font-size: 14px;">USD/INR</span>
                    <span style="color: white; font-size: 16px; font-weight: bold; margin-left: 8px;">₹${marketData.usd_inr.toFixed(2)}</span>
                    <span style="color: #94a3b8; margin: 0 16px;">|</span>
                    <span style="color: #94a3b8; font-size: 14px;">USD/EUR</span>
                    <span style="color: white; font-size: 16px; font-weight: bold; margin-left: 8px;">€${marketData.usd_eur.toFixed(4)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- FEAR & GREED -->
          <tr>
            <td style="background-color: #1e293b; padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                ${getSentimentEmoji(marketData.fear_greed_value)} Fear & Greed Index
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="background: linear-gradient(90deg, #ef4444 0%, #f59e0b 25%, #eab308 50%, #22c55e 75%, #10b981 100%); height: 12px; border-radius: 6px; position: relative;">
                          </div>
                          <p style="margin: 12px 0 0 0; text-align: center;">
                            <span style="color: white; font-size: 32px; font-weight: bold;">${marketData.fear_greed_value}</span>
                            <span style="color: #94a3b8; font-size: 16px;"> / 100</span>
                          </p>
                          <p style="margin: 4px 0 0 0; text-align: center; color: ${marketData.fear_greed_value > 50 ? '#10b981' : '#ef4444'}; font-size: 14px; font-weight: bold;">
                            ${marketData.fear_greed_label.toUpperCase()}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- ECONOMIC CALENDAR -->
          ${todayEvents.length > 0 || weekEvents.length > 0 ? `
          <tr>
            <td style="background-color: #1e293b; padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #10b981; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                📅 Economic Calendar
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; border-radius: 8px;">
                ${todayEvents.length > 0 ? `
                <tr>
                  <td style="padding: 16px; border-bottom: 1px solid #334155;">
                    <p style="margin: 0 0 8px 0; color: #10b981; font-size: 12px; font-weight: bold;">TODAY</p>
                    ${todayEvents.slice(0, 5).map(event => `
                      <p style="margin: 4px 0; color: #e2e8f0; font-size: 13px;">
                        <span style="color: #94a3b8;">${event.event_time}</span> - ${event.event_name}
                        ${event.related_symbol ? `<span style="color: #10b981;">(${event.related_symbol})</span>` : ''}
                        ${event.importance === 'high' ? '⭐' : ''}
                      </p>
                    `).join('')}
                  </td>
                </tr>
                ` : ''}
                ${weekEvents.length > 0 ? `
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px 0; color: #f59e0b; font-size: 12px; font-weight: bold;">COMING THIS WEEK</p>
                    ${weekEvents.slice(0, 5).map(event => `
                      <p style="margin: 4px 0; color: #e2e8f0; font-size: 13px;">
                        <span style="color: #94a3b8;">${event.event_time}</span> - ${event.event_name}
                        ${event.importance === 'high' ? '⭐' : ''}
                      </p>
                    `).join('')}
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- CTA -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; text-align: center;">
              <h3 style="margin: 0 0 8px 0; color: white; font-size: 18px;">Ready to accelerate your wealth?</h3>
              <p style="margin: 0 0 16px 0; color: rgba(255,255,255,0.8); font-size: 14px;">Book a free strategy call with our team</p>
              <a href="https://wealthclaude.com/book" style="display: inline-block; background-color: white; color: #059669; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Book Free Call →
              </a>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                📍 WealthClaude Inc · Made with ❤️ for investors
              </p>
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 11px;">
                ⚠️ This newsletter is for educational purposes only and does not constitute financial advice.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 11px;">
                <a href="https://wealthclaude.com" style="color: #10b981; text-decoration: none;">Website</a> · 
                <a href="https://twitter.com/wealthclaude" style="color: #10b981; text-decoration: none;">Twitter</a> · 
                <a href="%UNSUBSCRIBE_URL%" style="color: #94a3b8; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  // Verify cron secret (allow test mode via query param)
  const testMode = request.nextUrl.searchParams.get("test") === process.env.CRON_SECRET;
  if (!verifyCronSecret(request) && !testMode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = getTodayISO();
    console.log(`Sending newsletter for: ${today}`);

    // 1. Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("email, name")
      .eq("status", "active");

    if (subError || !subscribers || subscribers.length === 0) {
      console.error("No subscribers found:", subError);
      return NextResponse.json({ error: "No subscribers", details: subError }, { status: 400 });
    }

    console.log(`Found ${subscribers.length} subscribers`);

    // 2. Get market data (from cache or fetch fresh)
    let marketData: MarketData;

    const { data: cachedMarket } = await supabase
      .from("market_data_cache")
      .select("*")
      .eq("cache_date", today)
      .single();

    if (cachedMarket) {
      marketData = cachedMarket as MarketData;
    } else {
      // Fetch fresh if not cached
      console.log("No cached market data, fetching fresh...");
      // For now, return error - market data should be fetched by separate cron
      return NextResponse.json({ error: "Market data not cached. Run fetch-market first." }, { status: 400 });
    }

    // 3. Get today's calendar events
    const { data: todayEvents } = await supabase
      .from("economic_calendar")
      .select("*")
      .eq("event_date", today)
      .order("event_time", { ascending: true });

    // 4. Get this week's upcoming events
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { data: weekEvents } = await supabase
      .from("economic_calendar")
      .select("*")
      .gt("event_date", today)
      .lte("event_date", weekEnd.toISOString().split("T")[0])
      .eq("importance", "high")
      .order("event_date", { ascending: true })
      .limit(5);

    // 5. Create newsletter issue record
    const { data: issueData, error: issueError } = await supabase
      .rpc("get_next_issue_number");

    const issueNumber = issueData || 1;
    const subjectLine = generateSubjectLine(marketData, issueNumber);
    const previewText = generatePreviewText(marketData);

    const { data: newsletter, error: nlError } = await supabase
      .from("newsletter_issues")
      .insert({
        issue_number: issueNumber,
        issue_date: today,
        subject_line: subjectLine,
        preview_text: previewText,
        total_subscribers: subscribers.length,
        status: "sending",
      })
      .select()
      .single();

    if (nlError || !newsletter) {
      console.error("Failed to create newsletter issue:", nlError);
      return NextResponse.json({ error: "Failed to create issue", details: nlError }, { status: 500 });
    }

    // 6. Send emails to all subscribers
    let sentCount = 0;
    let failedCount = 0;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wealthclaude.com";

    for (const subscriber of subscribers) {
      try {
        const trackingPixelUrl = `${baseUrl}/api/newsletter/track/open?email=${encodeURIComponent(subscriber.email)}&issue=${newsletter.id}`;
        const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

        let emailHtml = buildEmailHTML(
          subscriber.name || "Investor",
          marketData,
          todayEvents || [],
          weekEvents || [],
          issueNumber,
          today,
          trackingPixelUrl
        );

        // Replace unsubscribe placeholder
        emailHtml = emailHtml.replace("%UNSUBSCRIBE_URL%", unsubscribeUrl);

        await resend.emails.send({
          from: "Krishna @ WealthClaude <newsletter@wealthclaude.com>",
          to: [subscriber.email],
          subject: subjectLine,
          html: emailHtml,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
          },
        });

        // Log analytics
        await supabase.from("newsletter_analytics").insert({
          newsletter_id: newsletter.id,
          subscriber_email: subscriber.email,
          sent_at: new Date().toISOString(),
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        failedCount++;
      }
    }

    // 7. Update newsletter issue status
    await supabase
      .from("newsletter_issues")
      .update({
        status: "sent",
        total_sent: sentCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", newsletter.id);

    return NextResponse.json({
      success: true,
      message: `Newsletter sent successfully`,
      issue: {
        id: newsletter.id,
        number: issueNumber,
        subject: subjectLine,
      },
      stats: {
        totalSubscribers: subscribers.length,
        sent: sentCount,
        failed: failedCount,
      },
    });

  } catch (error) {
    console.error("Newsletter send error:", error);
    return NextResponse.json({
      error: "Failed to send newsletter",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}