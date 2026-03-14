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

  if (!email) {
    return new NextResponse(renderUnsubscribePage(false, "No email provided"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    // Update subscriber status
    const { error } = await supabase
      .from("subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (error) {
      throw error;
    }

    return new NextResponse(renderUnsubscribePage(true, email), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });

  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse(renderUnsubscribePage(false, "Something went wrong"), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

// POST method for form submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", email);

    if (error) {
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function renderUnsubscribePage(success: boolean, message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? "Unsubscribed" : "Error"} - WealthClaude</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0f172a;
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      text-align: center;
      background: #1e293b;
      padding: 48px;
      border-radius: 16px;
      border: 1px solid #334155;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
      color: ${success ? "#10b981" : "#ef4444"};
    }
    p {
      color: #94a3b8;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .email {
      color: #10b981;
      font-weight: bold;
    }
    a {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      transition: background 0.2s;
    }
    a:hover {
      background: #059669;
    }
    .resubscribe {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #334155;
    }
    .resubscribe p {
      font-size: 14px;
    }
    .resubscribe a {
      background: transparent;
      border: 1px solid #10b981;
      color: #10b981;
    }
    .resubscribe a:hover {
      background: #10b981;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? "👋" : "⚠️"}</div>
    <h1>${success ? "You've been unsubscribed" : "Oops!"}</h1>
    ${success ? `
      <p>
        We've removed <span class="email">${message}</span> from our mailing list.
        You won't receive any more emails from us.
      </p>
      <p>
        We're sorry to see you go! If this was a mistake, you can always resubscribe.
      </p>
    ` : `
      <p>${message}. Please try again or contact support.</p>
    `}
    <a href="https://wealthclaude.com">Visit WealthClaude</a>
    
    ${success ? `
    <div class="resubscribe">
      <p>Changed your mind?</p>
      <a href="https://wealthclaude.com/#newsletter">Resubscribe</a>
    </div>
    ` : ""}
  </div>
</body>
</html>
  `.trim();
}