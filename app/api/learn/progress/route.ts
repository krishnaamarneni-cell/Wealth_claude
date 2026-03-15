import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  SaveProgressRequest,
  GetProgressResponse,
  UserProgress,
  QuizAttempt,
} from "@/types/learn";

// Total chapters in the course
const TOTAL_CHAPTERS = 14;

// POST - Save user progress for a section
export async function POST(request: NextRequest) {
  try {
    const body: SaveProgressRequest = await request.json();
    const { user_id, chapter_id, section_id, time_spent_sec = 0 } = body;

    // Validate input
    if (!user_id || chapter_id === undefined || section_id === undefined) {
      return NextResponse.json(
        { success: false, error: "user_id, chapter_id, and section_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("course_users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Upsert progress (insert or update if exists)
    const { data: progress, error: progressError } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id,
          chapter_id,
          section_id,
          completed_at: new Date().toISOString(),
          time_spent_sec,
        },
        {
          onConflict: "user_id,chapter_id,section_id",
        }
      )
      .select()
      .single();

    if (progressError) {
      console.error("Error saving progress:", progressError);
      return NextResponse.json(
        { success: false, error: "Failed to save progress" },
        { status: 500 }
      );
    }

    // Update user's last_active_at
    await supabase
      .from("course_users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user_id);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get user's full progress
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("course_users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get all progress records
    const { data: progress, error: progressError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .order("chapter_id", { ascending: true })
      .order("section_id", { ascending: true });

    if (progressError) {
      console.error("Error fetching progress:", progressError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch progress" },
        { status: 500 }
      );
    }

    // Get all quiz attempts
    const { data: quizAttempts, error: quizError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("attempted_at", { ascending: false });

    if (quizError) {
      console.error("Error fetching quiz attempts:", quizError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch quiz attempts" },
        { status: 500 }
      );
    }

    // Calculate which chapters are unlocked and completed
    const chaptersUnlocked: number[] = [1]; // Chapter 1 is always unlocked
    const chaptersCompleted: number[] = [];

    // Find chapters that have been completed (final quiz passed)
    const passedFinalQuizzes = (quizAttempts || [])
      .filter((qa: QuizAttempt) => qa.quiz_type === "final" && qa.passed)
      .map((qa: QuizAttempt) => qa.chapter_id);

    // Unique completed chapters
    const uniqueCompleted = [...new Set(passedFinalQuizzes)];
    chaptersCompleted.push(...uniqueCompleted);

    // Unlock next chapter for each completed chapter
    for (const completedChapter of uniqueCompleted) {
      const nextChapter = completedChapter + 1;
      if (nextChapter <= TOTAL_CHAPTERS && !chaptersUnlocked.includes(nextChapter)) {
        chaptersUnlocked.push(nextChapter);
      }
    }

    // Sort the arrays
    chaptersUnlocked.sort((a, b) => a - b);
    chaptersCompleted.sort((a, b) => a - b);

    const response: GetProgressResponse = {
      user,
      progress: (progress || []) as UserProgress[],
      quiz_attempts: (quizAttempts || []) as QuizAttempt[],
      chapters_unlocked: chaptersUnlocked,
      chapters_completed: chaptersCompleted,
    };

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Reset user's progress (optional, for testing)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete all progress records
    await supabase.from("user_progress").delete().eq("user_id", userId);

    // Delete all quiz attempts
    await supabase.from("quiz_attempts").delete().eq("user_id", userId);

    // Reset user completion status
    await supabase
      .from("course_users")
      .update({ is_completed: false })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      message: "Progress reset successfully",
    });
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
