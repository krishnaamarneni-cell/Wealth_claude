"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type {
  CourseUser,
  CourseState,
  ChapterProgress,
  UserProgress,
  QuizAttempt,
} from "@/types/learn";

// ===========================================
// Constants
// ===========================================

const TOTAL_CHAPTERS = 14;
const LOCAL_STORAGE_KEY = "wealthclaude_course_user";
const LOCAL_PROGRESS_KEY = "wealthclaude_course_progress";

// Sections per chapter (will be updated with actual content)
const SECTIONS_PER_CHAPTER: Record<number, number> = {
  1: 6,
  2: 6,
  3: 7,
  4: 5,
  5: 6,
  6: 7,
  7: 6,
  8: 6,
  9: 7,
  10: 6,
  11: 6,
  12: 5,
  13: 6,
  14: 6,
};

// ===========================================
// Types
// ===========================================

interface CourseContextType {
  state: CourseState;
  isLoading: boolean;
  error: string | null;
  // Actions
  setUser: (user: CourseUser) => void;
  clearUser: () => void;
  markSectionComplete: (chapterId: number, sectionId: number) => void;
  markQuizPassed: (chapterId: number, quizType: "mini" | "final", score: number) => void;
  unlockChapter: (chapterId: number) => void;
  setCurrentPosition: (chapterId: number, sectionId: number) => void;
  syncWithServer: () => Promise<void>;
  resetProgress: () => void;
}

type CourseAction =
  | { type: "SET_USER"; payload: CourseUser }
  | { type: "CLEAR_USER" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "MARK_SECTION_COMPLETE"; payload: { chapterId: number; sectionId: number } }
  | { type: "MARK_QUIZ_PASSED"; payload: { chapterId: number; quizType: "mini" | "final"; score: number } }
  | { type: "UNLOCK_CHAPTER"; payload: number }
  | { type: "SET_CURRENT_POSITION"; payload: { chapterId: number; sectionId: number } }
  | { type: "SYNC_PROGRESS"; payload: { progress: UserProgress[]; quizAttempts: QuizAttempt[]; chaptersUnlocked: number[]; chaptersCompleted: number[] } }
  | { type: "RESET_PROGRESS" };

// ===========================================
// Initial State
// ===========================================

const initialState: CourseState = {
  user: null,
  current_chapter: 1,
  current_section: 1,
  chapters_unlocked: [1],
  chapters_completed: [],
  progress_by_chapter: {},
};

// ===========================================
// Reducer
// ===========================================

function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };

    case "CLEAR_USER":
      return { ...initialState };

    case "MARK_SECTION_COMPLETE": {
      const { chapterId, sectionId } = action.payload;
      const chapterProgress = state.progress_by_chapter[chapterId] || {
        chapter_id: chapterId,
        sections_completed: [],
        total_sections: SECTIONS_PER_CHAPTER[chapterId] || 6,
        percentage: 0,
        final_quiz_passed: false,
        best_quiz_score: 0,
      };

      // Add section if not already completed
      const sectionsCompleted = chapterProgress.sections_completed.includes(sectionId)
        ? chapterProgress.sections_completed
        : [...chapterProgress.sections_completed, sectionId];

      const percentage = Math.round(
        (sectionsCompleted.length / chapterProgress.total_sections) * 100
      );

      return {
        ...state,
        progress_by_chapter: {
          ...state.progress_by_chapter,
          [chapterId]: {
            ...chapterProgress,
            sections_completed: sectionsCompleted,
            percentage,
          },
        },
      };
    }

    case "MARK_QUIZ_PASSED": {
      const { chapterId, quizType, score } = action.payload;
      const chapterProgress = state.progress_by_chapter[chapterId] || {
        chapter_id: chapterId,
        sections_completed: [],
        total_sections: SECTIONS_PER_CHAPTER[chapterId] || 6,
        percentage: 0,
        final_quiz_passed: false,
        best_quiz_score: 0,
      };

      const updates: Partial<ChapterProgress> = {
        best_quiz_score: Math.max(chapterProgress.best_quiz_score, score),
      };

      if (quizType === "final") {
        updates.final_quiz_passed = true;
        updates.percentage = 100;
      }

      const newChaptersCompleted =
        quizType === "final" && !state.chapters_completed.includes(chapterId)
          ? [...state.chapters_completed, chapterId].sort((a, b) => a - b)
          : state.chapters_completed;

      return {
        ...state,
        chapters_completed: newChaptersCompleted,
        progress_by_chapter: {
          ...state.progress_by_chapter,
          [chapterId]: {
            ...chapterProgress,
            ...updates,
          },
        },
      };
    }

    case "UNLOCK_CHAPTER": {
      const chapterId = action.payload;
      if (state.chapters_unlocked.includes(chapterId) || chapterId > TOTAL_CHAPTERS) {
        return state;
      }

      return {
        ...state,
        chapters_unlocked: [...state.chapters_unlocked, chapterId].sort((a, b) => a - b),
      };
    }

    case "SET_CURRENT_POSITION":
      return {
        ...state,
        current_chapter: action.payload.chapterId,
        current_section: action.payload.sectionId,
      };

    case "SYNC_PROGRESS": {
      const { progress, quizAttempts, chaptersUnlocked, chaptersCompleted } = action.payload;

      // Build progress by chapter from server data
      const progressByChapter: Record<number, ChapterProgress> = {};

      for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
        const chapterProgress = progress.filter((p) => p.chapter_id === i);
        const sectionsCompleted = chapterProgress.map((p) => p.section_id);
        const totalSections = SECTIONS_PER_CHAPTER[i] || 6;

        const finalQuizAttempts = quizAttempts.filter(
          (q) => q.chapter_id === i && q.quiz_type === "final"
        );
        const bestScore = Math.max(0, ...finalQuizAttempts.map((q) => q.score));
        const passed = finalQuizAttempts.some((q) => q.passed);

        progressByChapter[i] = {
          chapter_id: i,
          sections_completed: sectionsCompleted,
          total_sections: totalSections,
          percentage: passed
            ? 100
            : Math.round((sectionsCompleted.length / totalSections) * 100),
          final_quiz_passed: passed,
          best_quiz_score: bestScore,
        };
      }

      return {
        ...state,
        chapters_unlocked: chaptersUnlocked,
        chapters_completed: chaptersCompleted,
        progress_by_chapter: progressByChapter,
      };
    }

    case "RESET_PROGRESS":
      return {
        ...state,
        current_chapter: 1,
        current_section: 1,
        chapters_unlocked: [1],
        chapters_completed: [],
        progress_by_chapter: {},
      };

    default:
      return state;
  }
}

// ===========================================
// Context
// ===========================================

const CourseContext = createContext<CourseContextType | undefined>(undefined);

// ===========================================
// Provider
// ===========================================

export function CourseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(courseReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
        const storedProgress = localStorage.getItem(LOCAL_PROGRESS_KEY);

        if (storedUser) {
          const user = JSON.parse(storedUser) as CourseUser;
          dispatch({ type: "SET_USER", payload: user });

          // Load local progress if available
          if (storedProgress) {
            const localProgress = JSON.parse(storedProgress);
            if (localProgress.chapters_unlocked) {
              dispatch({
                type: "SYNC_PROGRESS",
                payload: {
                  progress: [],
                  quizAttempts: [],
                  chaptersUnlocked: localProgress.chapters_unlocked,
                  chaptersCompleted: localProgress.chapters_completed || [],
                },
              });
            }
          }

          // Sync with server
          await syncWithServer(user.id);
        }
      } catch (err) {
        console.error("Error loading user:", err);
        setError("Failed to load your progress");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Sync with server
  const syncWithServer = useCallback(async (userId?: string) => {
    const id = userId || state.user?.id;
    if (!id) return;

    try {
      const response = await fetch(`/api/learn/progress?user_id=${id}`);
      const data = await response.json();

      if (data.success) {
        dispatch({
          type: "SYNC_PROGRESS",
          payload: {
            progress: data.progress,
            quizAttempts: data.quiz_attempts,
            chaptersUnlocked: data.chapters_unlocked,
            chaptersCompleted: data.chapters_completed,
          },
        });

        // Save to localStorage
        localStorage.setItem(
          LOCAL_PROGRESS_KEY,
          JSON.stringify({
            chapters_unlocked: data.chapters_unlocked,
            chapters_completed: data.chapters_completed,
          })
        );
      }
    } catch (err) {
      console.error("Error syncing with server:", err);
    }
  }, [state.user?.id]);

  // Set user
  const setUser = useCallback((user: CourseUser) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  // Clear user
  const clearUser = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_PROGRESS_KEY);
    dispatch({ type: "CLEAR_USER" });
  }, []);

  // Mark section complete
  const markSectionComplete = useCallback(
    async (chapterId: number, sectionId: number) => {
      dispatch({
        type: "MARK_SECTION_COMPLETE",
        payload: { chapterId, sectionId },
      });

      // Save to server if user exists
      if (state.user) {
        try {
          await fetch("/api/learn/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: state.user.id,
              chapter_id: chapterId,
              section_id: sectionId,
            }),
          });
        } catch (err) {
          console.error("Error saving progress:", err);
        }
      }
    },
    [state.user]
  );

  // Mark quiz passed
  const markQuizPassed = useCallback(
    (chapterId: number, quizType: "mini" | "final", score: number) => {
      dispatch({
        type: "MARK_QUIZ_PASSED",
        payload: { chapterId, quizType, score },
      });

      // Unlock next chapter if final quiz passed
      if (quizType === "final" && score >= 80) {
        const nextChapter = chapterId + 1;
        if (nextChapter <= TOTAL_CHAPTERS) {
          dispatch({ type: "UNLOCK_CHAPTER", payload: nextChapter });
        }
      }
    },
    []
  );

  // Unlock chapter
  const unlockChapter = useCallback((chapterId: number) => {
    dispatch({ type: "UNLOCK_CHAPTER", payload: chapterId });
  }, []);

  // Set current position
  const setCurrentPosition = useCallback(
    (chapterId: number, sectionId: number) => {
      dispatch({
        type: "SET_CURRENT_POSITION",
        payload: { chapterId, sectionId },
      });
    },
    []
  );

  // Reset progress
  const resetProgress = useCallback(async () => {
    if (state.user) {
      try {
        await fetch(`/api/learn/progress?user_id=${state.user.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Error resetting progress:", err);
      }
    }

    localStorage.removeItem(LOCAL_PROGRESS_KEY);
    dispatch({ type: "RESET_PROGRESS" });
  }, [state.user]);

  const value: CourseContextType = {
    state,
    isLoading,
    error,
    setUser,
    clearUser,
    markSectionComplete,
    markQuizPassed,
    unlockChapter,
    setCurrentPosition,
    syncWithServer: () => syncWithServer(),
    resetProgress,
  };

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

// ===========================================
// Hook
// ===========================================

export function useCourse() {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error("useCourse must be used within a CourseProvider");
  }
  return context;
}

// Need to import useState
import { useState } from "react";
