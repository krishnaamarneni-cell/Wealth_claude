import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, preferredTime, service, message } = body;

    // Validate required fields
    if (!name || !email || !phone || !service) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to Supabase
    const { data: bookingData, error: dbError } = await supabase
      .from("booking_requests")
      .insert({
        name,
        email,
        phone,
        preferred_time: preferredTime || null,
        service,
        message: message || null,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save booking request" },
        { status: 500 }
      );
    }

    // Send email notification to admin
    try {
      await resend.emails.send({
        from: "WealthClaude <notifications@wealthclaude.com>",
        to: ["admin@wealthclaude.com"], // Change to your email
        subject: `🗓️ New Strategy Call Request from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Strategy Call Request</h1>
            </div>
            
            <div style="background: #0f172a; padding: 30px; border-radius: 0 0 16px 16px;">
              <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">Contact Details</h2>
                <table style="width: 100%; color: #e2e8f0;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">Name:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">Email:</td>
                    <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #10b981;">${email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">Phone:</td>
                    <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #10b981;">${phone}</a></td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">Request Details</h2>
                <table style="width: 100%; color: #e2e8f0;">
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">Service:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #94a3b8;">Preferred Time:</td>
                    <td style="padding: 8px 0;">${preferredTime || "Not specified"}</td>
                  </tr>
                </table>
              </div>
              
              ${message ? `
              <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">Message</h2>
                <p style="color: #e2e8f0; margin: 0; line-height: 1.6;">${message}</p>
              </div>
              ` : ""}
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="mailto:${email}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 10px;">
                  Reply to Email
                </a>
                <a href="tel:${phone}" style="display: inline-block; background: #1e293b; color: #10b981; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px solid #10b981;">
                  Call Now
                </a>
              </div>
            </div>
            
            <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
              This is an automated notification from WealthClaude.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the request if email fails - data is saved
    }

    // Send confirmation email to user
    try {
      await resend.emails.send({
        from: "WealthClaude <hello@wealthclaude.com>",
        to: [email],
        subject: "Your Strategy Call Request Received ✅",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Request Received! 🎉</h1>
            </div>
            
            <div style="background: #0f172a; padding: 30px; border-radius: 0 0 16px 16px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi ${name.split(" ")[0]},
              </p>
              
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in our <strong style="color: #10b981;">${service}</strong> service!
              </p>
              
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Our team will contact you within <strong style="color: #10b981;">24 hours</strong> to schedule your free 30-minute strategy call.
              </p>
              
              <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="color: #10b981; margin: 0 0 15px 0;">What to Expect:</h3>
                <ul style="color: #e2e8f0; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>A personalized review of your financial situation</li>
                  <li>Actionable strategies tailored to your goals</li>
                  <li>Clear roadmap to accelerate your wealth building</li>
                  <li>No obligation - just valuable insights</li>
                </ul>
              </div>
              
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                In the meantime, check out our resources at <a href="https://wealthclaude.com" style="color: #10b981;">wealthclaude.com</a>
              </p>
              
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin-top: 20px;">
                Looking forward to speaking with you!
              </p>
              
              <p style="color: #e2e8f0; font-size: 16px; margin-bottom: 0;">
                The WealthClaude Team
              </p>
            </div>
            
            <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
              © 2026 WealthClaude · <a href="https://wealthclaude.com" style="color: #64748b;">wealthclaude.com</a>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("User email error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Booking request submitted successfully",
      booking: bookingData,
    });

  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}









