import type { QuizQuestion } from "@/types/learn";
import { getChapterById } from "./chapters";

// ===========================================
// Quiz Questions Helper
// Gets quiz data from chapters.ts (single source of truth)
// ===========================================

/**
 * Get quiz questions for a specific chapter and quiz type
 */
export function getQuizQuestions(
  chapterId: number,
  quizType: "mini" | "final"
): QuizQuestion[] {
  const chapter = getChapterById(chapterId);
  
  if (!chapter) {
    return [];
  }

  if (quizType === "final") {
    return chapter.final_quiz || [];
  }

  // For mini quizzes, collect from all sections
  if (quizType === "mini") {
    const miniQuestions: QuizQuestion[] = [];
    
    for (const section of chapter.sections) {
      if (section.mini_quiz?.questions) {
        miniQuestions.push(...section.mini_quiz.questions);
      }
    }
    
    return miniQuestions;
  }

  return [];
}

/**
 * Get all quiz data for a chapter
 */
export function getChapterQuizData(chapterId: number) {
  const chapter = getChapterById(chapterId);
  
  if (!chapter) {
    return null;
  }

  const miniQuestions: QuizQuestion[] = [];
  for (const section of chapter.sections) {
    if (section.mini_quiz?.questions) {
      miniQuestions.push(...section.mini_quiz.questions);
    }
  }

  return {
    chapterId,
    chapterTitle: chapter.title,
    mini: miniQuestions,
    final: chapter.final_quiz || [],
  };
}

/**
 * Validate quiz answers and return results
 */
export function validateQuizAnswers(
  chapterId: number,
  quizType: "mini" | "final",
  userAnswers: Record<string, number>
): {
  score: number;
  passed: boolean;
  results: Array<{
    questionId: string;
    correct: boolean;
    correctAnswer: number;
    userAnswer: number;
    explanation: string;
  }>;
} {
  const questions = getQuizQuestions(chapterId, quizType);
  const passThreshold = 80;

  if (questions.length === 0) {
    return { score: 0, passed: false, results: [] };
  }

  const results = questions.map((q) => {
    const userAnswer = userAnswers[q.id];
    const correct = userAnswer === q.correct_answer;

    return {
      questionId: q.id,
      correct,
      correctAnswer: q.correct_answer,
      userAnswer: userAnswer ?? -1,
      explanation: q.explanation,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= passThreshold;

  return { score, passed, results };
}
