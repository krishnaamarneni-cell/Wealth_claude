import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubmitQuizRequest, SubmitQuizResponse, QuizQuestion } from "@/types/learn";
import { getQuizQuestions } from "@/lib/learn/quizzes";

// Pass threshold percentage
const PASS_THRESHOLD = 80;

// POST - Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const body: SubmitQuizRequest = await request.json();
    const { user_id, chapter_id, quiz_type, answers } = body;

    // Validate input
    if (!user_id || chapter_id === undefined || !quiz_type || !answers) {
      return NextResponse.json(
        { success: false, error: "user_id, chapter_id, quiz_type, and answers are required" },
        { status: 400 }
      );
    }

    if (quiz_type !== "mini" && quiz_type !== "final") {
      return NextResponse.json(
        { success: false, error: "quiz_type must be 'mini' or 'final'" },
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

    // Get the quiz questions for this chapter
    const questions = getQuizQuestions(chapter_id, quiz_type);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const correctAnswers: Record<string, number> = {};
    const explanations: Record<string, string> = {};

    for (const question of questions) {
      correctAnswers[question.id] = question.correct_answer;
      explanations[question.id] = question.explanation;

      const userAnswer = answers[question.id];
      if (userAnswer === question.correct_answer) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= PASS_THRESHOLD;

    // Save quiz attempt
    const { error: attemptError } = await supabase.from("quiz_attempts").insert({
      user_id,
      chapter_id,
      quiz_type,
      score,
      passed,
      attempted_at: new Date().toISOString(),
    });

    if (attemptError) {
      console.error("Error saving quiz attempt:", attemptError);
      return NextResponse.json(
        { success: false, error: "Failed to save quiz attempt" },
        { status: 500 }
      );
    }

    // If this is a final quiz and they passed, unlock next chapter
    let chapterUnlocked: number | undefined;
    if (quiz_type === "final" && passed) {
      const nextChapter = chapter_id + 1;
      if (nextChapter <= 14) {
        chapterUnlocked = nextChapter;
      }

      // Check if user has completed all chapters
      if (chapter_id === 14) {
        await supabase
          .from("course_users")
          .update({ is_completed: true })
          .eq("id", user_id);
      }
    }

    // Update last_active_at
    await supabase
      .from("course_users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user_id);

    const response: SubmitQuizResponse = {
      success: true,
      score,
      passed,
      correct_answers: correctAnswers,
      explanations,
      chapter_unlocked: chapterUnlocked,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Quiz API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get quiz questions for a chapter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chapterId = searchParams.get("chapter_id");
    const quizType = searchParams.get("quiz_type");

    if (!chapterId || !quizType) {
      return NextResponse.json(
        { success: false, error: "chapter_id and quiz_type are required" },
        { status: 400 }
      );
    }

    const chapterNum = parseInt(chapterId, 10);
    if (isNaN(chapterNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid chapter_id" },
        { status: 400 }
      );
    }

    if (quizType !== "mini" && quizType !== "final") {
      return NextResponse.json(
        { success: false, error: "quiz_type must be 'mini' or 'final'" },
        { status: 400 }
      );
    }

    const questions = getQuizQuestions(chapterNum, quizType as "mini" | "final");

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    // Return questions without correct answers (for client-side quiz taking)
    const sanitizedQuestions = questions.map((q: QuizQuestion) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({
      success: true,
      questions: sanitizedQuestions,
      total_questions: sanitizedQuestions.length,
      pass_threshold: PASS_THRESHOLD,
    });
  } catch (error) {
    console.error("Quiz API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
