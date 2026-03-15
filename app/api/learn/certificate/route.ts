import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/learn/certificate - Get user's certificate
// GET /api/learn/certificate?id=WC-XXXXXXXX - Get certificate by ID (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get("id");
    const userId = searchParams.get("userId");

    // If certificate ID provided, fetch public certificate data
    if (certificateId) {
      const { data: certificate, error } = await supabase
        .from("certificates")
        .select(`
          id,
          certificate_id,
          completed_at,
          course_users (
            name
          )
        `)
        .eq("certificate_id", certificateId)
        .single();

      if (error || !certificate) {
        return NextResponse.json(
          { error: "Certificate not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: certificate.certificate_id,
        name: certificate.course_users?.name || "Course Graduate",
        completedAt: certificate.completed_at,
        valid: true,
      });
    }

    // If user ID provided, fetch user's certificate
    if (userId) {
      const { data: certificate, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !certificate) {
        return NextResponse.json({ certificate: null });
      }

      return NextResponse.json({ certificate });
    }

    return NextResponse.json(
      { error: "Missing id or userId parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json(
      { error: "Failed to fetch certificate" },
      { status: 500 }
    );
  }
}

// POST /api/learn/certificate - Generate new certificate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("course_users")
      .select("id, name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has completed all chapters
    const { data: progress, error: progressError } = await supabase
      .from("user_progress")
      .select("chapter_id, completed")
      .eq("user_id", userId)
      .eq("completed", true);

    if (progressError) {
      return NextResponse.json(
        { error: "Failed to verify progress" },
        { status: 500 }
      );
    }

    // Verify all 14 chapters are complete
    const completedChapters = new Set(progress?.map((p) => p.chapter_id) || []);
    const allChaptersComplete = Array.from({ length: 14 }, (_, i) => i + 1).every(
      (ch) => completedChapters.has(ch)
    );

    if (!allChaptersComplete) {
      return NextResponse.json(
        { error: "Course not complete" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("certificate_id")
      .eq("user_id", userId)
      .single();

    if (existingCert) {
      return NextResponse.json({
        certificateId: existingCert.certificate_id,
        message: "Certificate already exists",
      });
    }

    // Generate new certificate ID
    const certificateId = generateCertificateId();

    // Create certificate record
    const { data: newCert, error: createError } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        certificate_id: certificateId,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating certificate:", createError);
      return NextResponse.json(
        { error: "Failed to create certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      certificateId: newCert.certificate_id,
      message: "Certificate generated successfully",
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}

// Helper function to generate certificate ID
function generateCertificateId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "WC-";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
