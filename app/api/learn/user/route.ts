import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CreateUserRequest, CreateUserResponse, CourseUser } from "@/types/learn";

// POST - Create a new course user or return existing
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    const { email, name } = body;

    // Validate input
    if (!email || !name) {
      return NextResponse.json<CreateUserResponse>(
        { success: false, error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<CreateUserResponse>(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("course_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      // Update last_active_at and return existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from("course_users")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating user:", updateError);
        return NextResponse.json<CreateUserResponse>(
          { success: false, error: "Failed to update user" },
          { status: 500 }
        );
      }

      return NextResponse.json<CreateUserResponse>({
        success: true,
        user: updatedUser as CourseUser,
      });
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from("course_users")
      .insert({
        email: email.toLowerCase(),
        name: name.trim(),
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        is_completed: false,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);

      // Handle unique constraint violation
      if (createError.code === "23505") {
        return NextResponse.json<CreateUserResponse>(
          { success: false, error: "This email is already registered" },
          { status: 409 }
        );
      }

      return NextResponse.json<CreateUserResponse>(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }

    return NextResponse.json<CreateUserResponse>({
      success: true,
      user: newUser as CourseUser,
    });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json<CreateUserResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get user by ID or email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: "User ID or email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase.from("course_users").select("*");

    if (userId) {
      query = query.eq("id", userId);
    } else if (email) {
      query = query.eq("email", email.toLowerCase());
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update last_active_at
    await supabase
      .from("course_users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      user: user as CourseUser,
    });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
