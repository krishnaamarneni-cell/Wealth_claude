import type { QuizQuestion } from "@/types/learn";

// ===========================================
// Quiz Questions Data
// This file contains all quiz questions for the course
// ===========================================

// Placeholder quiz questions - will be populated with actual content
const quizData: Record<number, { mini: QuizQuestion[]; final: QuizQuestion[] }> = {
  1: {
    mini: [
      {
        id: "ch1_mini_1",
        type: "multiple_choice",
        question: "What does 'Pay Yourself First' mean?",
        options: [
          "Pay all your bills before spending on yourself",
          "Save/invest a portion of your income before paying expenses",
          "Buy whatever you want first, then pay bills",
          "Pay off debt before saving anything",
        ],
        correct_answer: 1,
        explanation:
          "Pay Yourself First means automatically saving or investing a portion of your income as soon as you get paid, before paying for expenses or discretionary spending.",
      },
      {
        id: "ch1_mini_2",
        type: "true_false",
        question: "The rich work for money, while the poor make money work for them.",
        options: ["True", "False"],
        correct_answer: 1,
        explanation:
          "False! It's the opposite. The wealthy focus on making their money work for them through investments and passive income, while many others trade time for money.",
      },
    ],
    final: [
      {
        id: "ch1_final_1",
        type: "multiple_choice",
        question: "According to the Cashflow Quadrant, which position offers the most potential for passive income?",
        options: ["Employee (E)", "Self-Employed (S)", "Business Owner (B)", "Investor (I)"],
        correct_answer: 3,
        explanation:
          "The Investor (I) quadrant offers the most potential for passive income, as your money works for you without requiring your direct time and effort.",
      },
      {
        id: "ch1_final_2",
        type: "multiple_choice",
        question: "What is the difference between an asset and a liability?",
        options: [
          "Assets are expensive, liabilities are cheap",
          "Assets put money in your pocket, liabilities take money out",
          "Assets are things you own, liabilities are things you owe",
          "There is no difference",
        ],
        correct_answer: 1,
        explanation:
          "In terms of building wealth, assets put money in your pocket (generate income or appreciate), while liabilities take money out (cost you money over time).",
      },
      {
        id: "ch1_final_3",
        type: "true_false",
        question: "Your primary residence is always considered an asset for wealth building.",
        options: ["True", "False"],
        correct_answer: 1,
        explanation:
          "False! While your home has value, it costs you money through mortgage payments, taxes, maintenance, and insurance. Unless it generates income, it functions more like a liability in terms of cash flow.",
      },
      {
        id: "ch1_final_4",
        type: "multiple_choice",
        question: "What is the most important factor in building long-term wealth?",
        options: [
          "Having a high income",
          "Living below your means and investing the difference",
          "Winning the lottery",
          "Getting a large inheritance",
        ],
        correct_answer: 1,
        explanation:
          "Living below your means and consistently investing the difference is the most reliable path to wealth. Many high earners never build wealth because they spend everything they make.",
      },
      {
        id: "ch1_final_5",
        type: "multiple_choice",
        question: "Why do the wealthy focus on buying assets first?",
        options: [
          "Because assets are cheaper",
          "Because assets generate income to buy more assets or luxuries",
          "Because banks require it",
          "Because it's a tax requirement",
        ],
        correct_answer: 1,
        explanation:
          "The wealthy buy assets first because those assets generate income, which can then be used to purchase more assets or luxuries without depleting their wealth.",
      },
    ],
  },
  // Add more chapters here...
  // Chapters 2-14 will follow the same structure
};

/**
 * Get quiz questions for a specific chapter and quiz type
 */
export function getQuizQuestions(
  chapterId: number,
  quizType: "mini" | "final"
): QuizQuestion[] {
  const chapterQuizzes = quizData[chapterId];
  
  if (!chapterQuizzes) {
    // Return empty array if chapter doesn't exist yet
    return [];
  }

  return chapterQuizzes[quizType] || [];
}

/**
 * Get all quiz data (for admin/debugging purposes)
 */
export function getAllQuizData() {
  return quizData;
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
