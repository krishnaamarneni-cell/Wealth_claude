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
  event_date: string;
  event_time: string;
  event_name: string;
  event_type: string;
  importance: string;
  related_symbol: string | null;
}

interface MarketNews {
  headline: string;
  summary: string;
  category: string;
}

// Finance quotes database
const FINANCE_QUOTES = [
  { quote: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { quote: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott" },
  { quote: "The individual investor should act consistently as an investor and not as a speculator.", author: "Ben Graham" },
  { quote: "Know what you own, and know why you own it.", author: "Peter Lynch" },
  { quote: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { quote: "The four most dangerous words in investing are: 'This time it's different.'", author: "Sir John Templeton" },
  { quote: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
  { quote: "It's not whether you're right or wrong that's important, but how much money you make when you're right.", author: "George Soros" },
  { quote: "The best investment you can make is in yourself.", author: "Warren Buffett" },
  { quote: "Time in the market beats timing the market.", author: "Ken Fisher" },
  { quote: "Compound interest is the eighth wonder of the world.", author: "Albert Einstein" },
  { quote: "Be fearful when others are greedy and greedy when others are fearful.", author: "Warren Buffett" },
  { quote: "The goal isn't more money. The goal is living life on your terms.", author: "Chris Brogan" },
  { quote: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.", author: "Dave Ramsey" },
  { quote: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
];

// Get random quote
function getRandomQuote() {
  return FINANCE_QUOTES[Math.floor(Math.random() * FINANCE_QUOTES.length)];
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

// Format price for display
function formatPrice(num: number): string {
  if (num >= 1000) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return formatNumber(num);
}

// Get market mood description
function getMarketMood(sp500Change: number, fearGreed: number): string {
  if (sp500Change > 1 && fearGreed > 60) {
    return "Bulls are charging! Markets are riding high with strong momentum.";
  } else if (sp500Change > 0.5) {
    return "A solid green day. Investors are feeling optimistic.";
  } else if (sp500Change > 0) {
    return "Markets edged higher. Cautious optimism in the air.";
  } else if (sp500Change > -0.5) {
    return "A slight pullback today. Nothing to panic about.";
  } else if (sp500Change > -1) {
    return "Red on the screens. Investors are taking some risk off the table.";
  } else if (fearGreed < 25) {
    return "Fear is gripping the market. But remember - this is often when opportunities emerge.";
  } else {
    return "Rough day on Wall Street. Stay focused on the long term.";
  }
}

// Get fear & greed context
function getFearGreedContext(value: number): string {
  if (value <= 20) return "Extreme fear often signals buying opportunities. Warren Buffett would be interested.";
  if (value <= 40) return "Fear is elevated. Smart money often starts accumulating here.";
  if (value <= 60) return "Markets are balanced. No extreme emotions driving prices.";
  if (value <= 80) return "Greed is building. Time to be more selective with new positions.";
  return "Extreme greed! Historically, this precedes corrections. Stay cautious.";
}

// Fetch market news from Perplexity
async function fetchMarketNews(): Promise<MarketNews[]> {
  try {
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
            content: "You are a financial news summarizer. Return ONLY valid JSON, no markdown or explanation."
          },
          {
            role: "user",
            content: `Give me the top 3 most important financial/market news headlines from today or yesterday. For each, provide a brief 1-2 sentence summary explaining why it matters to investors.

Return ONLY this JSON format:
[
  {"headline": "Short headline", "summary": "Why it matters in 1-2 sentences", "category": "stocks|crypto|economy|earnings|fed"},
  ...
]`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("Perplexity news fetch failed");
      return [];
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to fetch market news:", error);
    return [];
  }
}

// Get category emoji
function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    stocks: "📈",
    crypto: "₿",
    economy: "🏛️",
    earnings: "💰",
    fed: "🏦",
  };
  return emojis[category] || "📰";
}

// Generate subject line
function generateSubjectLine(marketData: MarketData, issueNumber: number): string {
  const sp500Change = marketData.sp500_change;
  const emoji = sp500Change >= 1 ? "🚀" : sp500Change >= 0 ? "📈" : sp500Change >= -1 ? "📉" : "🔴";
  const sign = sp500Change >= 0 ? "+" : "";

  return `${emoji} S&P ${sign}${sp500Change.toFixed(1)}% | Fear at ${marketData.fear_greed_value} | Issue #${issueNumber}`;
}

// Build enhanced HTML email
function buildEmailHTML(
  subscriberName: string,
  marketData: MarketData,
  todayEvents: CalendarEvent[],
  weekEvents: CalendarEvent[],
  marketNews: MarketNews[],
  issueNumber: number,
  issueDate: string,
  trackingPixelUrl: string
): string {
  const firstName = subscriberName?.split(" ")[0] || "Investor";
  const quote = getRandomQuote();
  const marketMood = getMarketMood(marketData.sp500_change, marketData.fear_greed_value);
  const fearGreedContext = getFearGreedContext(marketData.fear_greed_value);

  // Determine colors
  const isGreenDay = marketData.sp500_change >= 0;
  const dayOfWeek = new Date(issueDate).toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = new Date(issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WealthClaude Daily</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Tracking Pixel -->
  <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="padding: 24px 24px 16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold;">🌐 WealthClaude Daily</h1>
                    <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Issue #${issueNumber} · ${dayOfWeek}, ${formattedDate}</p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background-color: ${isGreenDay ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${isGreenDay ? '#10b981' : '#ef4444'}; border-radius: 20px; font-size: 12px; font-weight: 600;">
                      ${isGreenDay ? '🟢 Green Day' : '🔴 Red Day'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- GREETING & HOOK -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0 0 12px 0; color: #e2e8f0; font-size: 17px; line-height: 1.5;">
                Good morning, ${firstName}! ☕
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                ${marketMood}
              </p>
            </td>
          </tr>
          
          <!-- QUOTE OF THE DAY -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border-left: 3px solid #10b981; border-radius: 0 8px 8px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 14px; font-style: italic; line-height: 1.5;">
                      "${quote.quote}"
                    </p>
                    <p style="margin: 0; color: #10b981; font-size: 12px; font-weight: 600;">
                      — ${quote.author}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- MARKET SNAPSHOT HEADER -->
          <tr>
            <td style="padding: 0 24px 12px 24px;">
              <h2 style="margin: 0; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                📊 Market Snapshot
              </h2>
            </td>
          </tr>
          
          <!-- MARKET INDICES -->
          <tr>
            <td style="padding: 0 24px 8px 24px;">
              <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse: separate;">
                <tr>
                  <td width="33%" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">S&P 500</p>
                    <p style="margin: 0 0 4px 0; color: #f8fafc; font-size: 20px; font-weight: 700;">$${formatPrice(marketData.sp500_price)}</p>
                    <p style="margin: 0; color: ${marketData.sp500_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 13px; font-weight: 600;">
                      ${marketData.sp500_change >= 0 ? '↑' : '↓'} ${marketData.sp500_change >= 0 ? '+' : ''}${marketData.sp500_change.toFixed(2)}%
                    </p>
                  </td>
                  <td width="33%" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Dow Jones</p>
                    <p style="margin: 0 0 4px 0; color: #f8fafc; font-size: 20px; font-weight: 700;">$${formatPrice(marketData.dow_price)}</p>
                    <p style="margin: 0; color: ${marketData.dow_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 13px; font-weight: 600;">
                      ${marketData.dow_change >= 0 ? '↑' : '↓'} ${marketData.dow_change >= 0 ? '+' : ''}${marketData.dow_change.toFixed(2)}%
                    </p>
                  </td>
                  <td width="33%" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Nasdaq</p>
                    <p style="margin: 0 0 4px 0; color: #f8fafc; font-size: 20px; font-weight: 700;">$${formatPrice(marketData.nasdaq_price)}</p>
                    <p style="margin: 0; color: ${marketData.nasdaq_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 13px; font-weight: 600;">
                      ${marketData.nasdaq_change >= 0 ? '↑' : '↓'} ${marketData.nasdaq_change >= 0 ? '+' : ''}${marketData.nasdaq_change.toFixed(2)}%
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- MARKET NEWS SECTION -->
          ${marketNews.length > 0 ? `
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <h2 style="margin: 0; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                📰 What's Moving Markets
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;">
                ${marketNews.map((news, index) => `
                <tr>
                  <td style="padding: 16px 20px; ${index < marketNews.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.06);' : ''}">
                    <p style="margin: 0 0 6px 0; color: #f8fafc; font-size: 14px; font-weight: 600; line-height: 1.4;">
                      ${getCategoryEmoji(news.category)} ${news.headline}
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                      ${news.summary}
                    </p>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- TOP MOVERS -->
          <tr>
            <td style="padding: 0 24px 12px 24px;">
              <h2 style="margin: 0; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                🔥 Top Movers
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse: separate;">
                <tr>
                  <td width="48%" style="background-color: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 16px; vertical-align: top;">
                    <p style="margin: 0 0 12px 0; color: #10b981; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🟢 Winners</p>
                    ${marketData.top_gainers.slice(0, 3).map(stock => `
                      <p style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 14px;">
                        <strong>${stock.symbol}</strong> <span style="color: #10b981; font-weight: 600;">+${stock.change.toFixed(1)}%</span>
                      </p>
                    `).join('')}
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; vertical-align: top;">
                    <p style="margin: 0 0 12px 0; color: #ef4444; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🔴 Losers</p>
                    ${marketData.top_losers.slice(0, 3).map(stock => `
                      <p style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 14px;">
                        <strong>${stock.symbol}</strong> <span style="color: #ef4444; font-weight: 600;">${stock.change.toFixed(1)}%</span>
                      </p>
                    `).join('')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CRYPTO -->
          <tr>
            <td style="padding: 0 24px 12px 24px;">
              <h2 style="margin: 0; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                ₿ Crypto Corner
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="8" style="border-collapse: separate;">
                <tr>
                  <td width="48%" style="background-color: rgba(247, 147, 26, 0.08); border: 1px solid rgba(247, 147, 26, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #f7931a; font-size: 11px; font-weight: 700; text-transform: uppercase;">Bitcoin</p>
                    <p style="margin: 0 0 4px 0; color: #f8fafc; font-size: 22px; font-weight: 700;">$${formatPrice(marketData.btc_price)}</p>
                    <p style="margin: 0; color: ${marketData.btc_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 13px; font-weight: 600;">
                      ${marketData.btc_change >= 0 ? '↑' : '↓'} ${marketData.btc_change >= 0 ? '+' : ''}${marketData.btc_change.toFixed(2)}%
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: rgba(98, 126, 234, 0.08); border: 1px solid rgba(98, 126, 234, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #627eea; font-size: 11px; font-weight: 700; text-transform: uppercase;">Ethereum</p>
                    <p style="margin: 0 0 4px 0; color: #f8fafc; font-size: 22px; font-weight: 700;">$${formatPrice(marketData.eth_price)}</p>
                    <p style="margin: 0; color: ${marketData.eth_change >= 0 ? '#10b981' : '#ef4444'}; font-size: 13px; font-weight: 600;">
                      ${marketData.eth_change >= 0 ? '↑' : '↓'} ${marketData.eth_change >= 0 ? '+' : ''}${marketData.eth_change.toFixed(2)}%
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- FEAR & GREED -->
          <tr>
            <td style="padding: 0 24px 12px 24px;">
              <h2 style="margin: 0; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                🎭 Market Sentiment
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="30%" style="text-align: center; vertical-align: middle;">
                          <p style="margin: 0; color: #f8fafc; font-size: 48px; font-weight: 800; line-height: 1;">${marketData.fear_greed_value}</p>
                          <p style="margin: 4px 0 0 0; color: ${marketData.fear_greed_value > 50 ? '#10b981' : '#ef4444'}; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                            ${marketData.fear_greed_label}
                          </p>
                        </td>
                        <td width="70%" style="padding-left: 20px; vertical-align: middle;">
                          <!-- Gauge Bar -->
                          <div style="background: linear-gradient(90deg, #ef4444 0%, #f59e0b 25%, #eab308 50%, #22c55e 75%, #10b981 100%); height: 8px; border-radius: 4px; margin-bottom: 12px;"></div>
                          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            ${fearGreedContext}
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
          ${(todayEvents.length > 0 || weekEvents.length > 0) ? `
          <tr>
            <td style="padding: 0 24px 12px 24px;">
              <h2 style="margin: 0; color: #e2e8f0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                📅 On The Radar
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;">
                ${todayEvents.length > 0 ? `
                <tr>
                  <td style="padding: 16px 20px; ${weekEvents.length > 0 ? 'border-bottom: 1px solid rgba(255,255,255,0.06);' : ''}">
                    <p style="margin: 0 0 10px 0; color: #10b981; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">📌 Today</p>
                    ${todayEvents.slice(0, 3).map(event => `
                      <p style="margin: 0 0 6px 0; color: #e2e8f0; font-size: 13px; line-height: 1.4;">
                        <span style="color: #64748b;">${event.event_time}</span> — ${event.event_name} ${event.importance === 'high' ? '⭐' : ''}
                      </p>
                    `).join('')}
                  </td>
                </tr>
                ` : ''}
                ${weekEvents.length > 0 ? `
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 10px 0; color: #f59e0b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">👀 Coming Up</p>
                    ${weekEvents.slice(0, 3).map(event => `
                      <p style="margin: 0 0 6px 0; color: #e2e8f0; font-size: 13px; line-height: 1.4;">
                        <span style="color: #64748b;">${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span> — ${event.event_name} ${event.importance === 'high' ? '⭐' : ''}
                      </p>
                    `).join('')}
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- CURRENCY -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;">
                <tr>
                  <td style="padding: 12px 20px;">
                    <span style="color: #64748b; font-size: 12px;">💱 </span>
                    <span style="color: #94a3b8; font-size: 13px;">USD/INR </span>
                    <span style="color: #f8fafc; font-size: 13px; font-weight: 600;">₹${marketData.usd_inr.toFixed(2)}</span>
                    <span style="color: #334155; margin: 0 12px;">|</span>
                    <span style="color: #94a3b8; font-size: 13px;">USD/EUR </span>
                    <span style="color: #f8fafc; font-size: 13px; font-weight: 600;">€${marketData.usd_eur.toFixed(4)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- AD/SPONSOR PLACEHOLDER -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px dashed rgba(139, 92, 246, 0.3); border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #a78bfa; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Partner Spotlight</p>
                    <p style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 15px; font-weight: 600;">
                      🎯 Want to reach 10,000+ investors?
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                      <a href="mailto:advertise@wealthclaude.com" style="color: #a78bfa; text-decoration: none;">Advertise with us →</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 22px;">🔥</p>
                    <h3 style="margin: 0 0 8px 0; color: white; font-size: 20px; font-weight: 700;">How close are you to financial freedom?</h3>
                    <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.85); font-size: 14px;">Take the 2-minute FIRE Score test and find out</p>
                    <a href="https://wealthclaude.com/fire-score" style="display: inline-block; background-color: white; color: #059669; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
                      Test Your FIRE Score
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
              <p style="margin: 0 0 12px 0; color: #64748b; font-size: 12px;">
                Made with 💚 by WealthClaude
              </p>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 11px; line-height: 1.5;">
                ⚠️ This newsletter is for educational purposes only and does not constitute financial advice.<br>
                Always do your own research before making investment decisions.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 11px;">
                <a href="https://wealthclaude.com" style="color: #10b981; text-decoration: none;">Website</a>
                <span style="color: #334155; margin: 0 8px;">•</span>
                <a href="https://twitter.com/wealthclaude" style="color: #10b981; text-decoration: none;">Twitter</a>
                <span style="color: #334155; margin: 0 8px;">•</span>
                <a href="%UNSUBSCRIBE_URL%" style="color: #64748b; text-decoration: none;">Unsubscribe</a>
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

    // 2. Get market data (from cache)
    const { data: cachedMarket } = await supabase
      .from("market_data_cache")
      .select("*")
      .eq("cache_date", today)
      .single();

    if (!cachedMarket) {
      return NextResponse.json({ error: "Market data not cached. Run fetch-market first." }, { status: 400 });
    }

    const marketData = cachedMarket as MarketData;

    // 3. Fetch market news from Perplexity
    console.log("Fetching market news...");
    const marketNews = await fetchMarketNews();
    console.log(`Fetched ${marketNews.length} news items`);

    // 4. Get today's calendar events
    const { data: todayEvents } = await supabase
      .from("economic_calendar")
      .select("*")
      .eq("event_date", today)
      .order("event_time", { ascending: true });

    // 5. Get this week's upcoming events
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

    // 6. Create newsletter issue record
    const { data: issueData } = await supabase.rpc("get_next_issue_number");
    const issueNumber = issueData || 1;
    const subjectLine = generateSubjectLine(marketData, issueNumber);

    const { data: newsletter, error: nlError } = await supabase
      .from("newsletter_issues")
      .insert({
        issue_number: issueNumber,
        issue_date: today,
        subject_line: subjectLine,
        total_subscribers: subscribers.length,
        status: "sending",
      })
      .select()
      .single();

    if (nlError || !newsletter) {
      console.error("Failed to create newsletter issue:", nlError);
      return NextResponse.json({ error: "Failed to create issue", details: nlError }, { status: 500 });
    }

    // 7. Send emails to all subscribers
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
          marketNews,
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

    // 8. Update newsletter issue status
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
      newsItems: marketNews.length,
    });

  } catch (error) {
    console.error("Newsletter send error:", error);
    return NextResponse.json({
      error: "Failed to send newsletter",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}