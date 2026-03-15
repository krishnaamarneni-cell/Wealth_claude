// ===========================================
// FIRE Course - Type Definitions
// ===========================================

// User who has entered email to save progress
export interface CourseUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_active_at: string;
  is_completed: boolean;
}

// Progress record for a specific section
export interface UserProgress {
  id: string;
  user_id: string;
  chapter_id: number;
  section_id: number;
  completed_at: string;
  time_spent_sec: number;
}

// Quiz attempt record
export interface QuizAttempt {
  id: string;
  user_id: string;
  chapter_id: number;
  quiz_type: 'mini' | 'final';
  score: number;
  passed: boolean;
  attempted_at: string;
}

// Certificate issued on course completion
export interface Certificate {
  id: string;
  user_id: string;
  certificate_id: string;
  issued_at: string;
  name_on_cert: string;
  share_url: string;
}

// ===========================================
// Content Types
// ===========================================

// Single quiz question
export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options: string[];
  correct_answer: number; // Index of correct option
  explanation: string;
}

// Mini quiz within a section
export interface MiniQuiz {
  id: string;
  questions: QuizQuestion[];
}

// Section within a chapter
export interface ChapterSection {
  id: number;
  title: string;
  content: SectionContent[];
  mini_quiz?: MiniQuiz;
}

// Content block types within a section
export type SectionContent =
  | { type: 'story'; title: string; content: string }
  | { type: 'text'; content: string }
  | { type: 'heading'; content: string }
  | { type: 'myth_reality'; myth: string; reality: string; wealthy: string }
  | { type: 'comparison'; left: ComparisonSide; right: ComparisonSide }
  | { type: 'callout'; title: string; content: string; variant: 'info' | 'warning' | 'tip' }
  | { type: 'diagram'; component: string; props?: Record<string, unknown> }
  | { type: 'video'; youtube_id: string; title: string; optional: boolean }
  | { type: 'formula'; title: string; formula: string; example?: string }
  | { type: 'list'; title?: string; items: string[]; ordered?: boolean };

// Comparison table side
export interface ComparisonSide {
  title: string;
  subtitle?: string;
  items: string[];
  highlight?: 'positive' | 'negative' | 'neutral';
}

// Full chapter structure
export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  phase: string;
  phase_number: number;
  estimated_time: string; // e.g., "15 min"
  sections: ChapterSection[];
  final_quiz: QuizQuestion[];
  videos?: { youtube_id: string; title: string }[];
}

// ===========================================
// UI State Types
// ===========================================

// User's overall course state
export interface CourseState {
  user: CourseUser | null;
  current_chapter: number;
  current_section: number;
  chapters_unlocked: number[];
  chapters_completed: number[];
  progress_by_chapter: Record<number, ChapterProgress>;
}

// Progress for a single chapter
export interface ChapterProgress {
  chapter_id: number;
  sections_completed: number[];
  total_sections: number;
  percentage: number;
  final_quiz_passed: boolean;
  best_quiz_score: number;
}

// Email capture modal state
export interface EmailCaptureState {
  isOpen: boolean;
  name: string;
  email: string;
  isLoading: boolean;
  error: string | null;
}

// Quiz state during taking
export interface QuizState {
  questions: QuizQuestion[];
  current_index: number;
  answers: Record<string, number>; // question_id -> selected_option_index
  submitted: boolean;
  score: number | null;
  passed: boolean | null;
}

// ===========================================
// API Types
// ===========================================

// Create user request
export interface CreateUserRequest {
  email: string;
  name: string;
}

// Create user response
export interface CreateUserResponse {
  success: boolean;
  user?: CourseUser;
  error?: string;
}

// Save progress request
export interface SaveProgressRequest {
  user_id: string;
  chapter_id: number;
  section_id: number;
  time_spent_sec?: number;
}

// Submit quiz request
export interface SubmitQuizRequest {
  user_id: string;
  chapter_id: number;
  quiz_type: 'mini' | 'final';
  answers: Record<string, number>;
}

// Submit quiz response
export interface SubmitQuizResponse {
  success: boolean;
  score: number;
  passed: boolean;
  correct_answers: Record<string, number>;
  explanations: Record<string, string>;
  chapter_unlocked?: number;
}

// Get progress response
export interface GetProgressResponse {
  user: CourseUser;
  progress: UserProgress[];
  quiz_attempts: QuizAttempt[];
  chapters_unlocked: number[];
  chapters_completed: number[];
}

// Generate certificate request
export interface GenerateCertificateRequest {
  user_id: string;
}

// Generate certificate response
export interface GenerateCertificateResponse {
  success: boolean;
  certificate?: Certificate;
  download_url?: string;
  share_url?: string;
  error?: string;
}
