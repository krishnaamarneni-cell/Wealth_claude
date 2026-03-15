// ===========================================
// Learn Components - Barrel Export
// ===========================================

// Phase 1 Components
export { EmailCaptureModal, useEmailCapture } from "./EmailCaptureModal";
export { ProgressToast, ProgressSavedIndicator } from "./ProgressToast";
export {
  CourseSidebar,
  MobileDrawer,
  MobileMenuButton,
  SidebarContent,
  useMobileNav
} from "./CourseSidebar";
export { ProgressBar, SectionProgress, ChapterProgressCard } from "./ProgressBar";

// Phase 2 Components
export { ChapterContent, SectionContentRenderer, VideoEmbed } from "./ChapterContent";
export { SectionPagination, ChapterNavHeader, MobileSectionSelector } from "./SectionPagination";
export { StoryBlock, Dialogue, Conversation } from "./StoryBlock";
export { RichCallout, MythRealityBlock, QuoteBlock, FormulaBlock } from "./RichCallout";
export { ComparisonTable, PersonComparison, DataTable, NumberComparison } from "./ComparisonTable";

// Phase 3 Components
export { QuizQuestion, CompactQuestion } from "./QuizQuestion";
export { MiniQuiz, MiniQuizTrigger } from "./MiniQuiz";
export { FinalQuiz } from "./FinalQuiz";
export { ChapterComplete, useConfetti, SuccessMessage } from "./ChapterComplete";

// Phase 5 Components
export { Certificate, CertificatePreview, generateCertificateId } from "./Certificate";

// Phase 6 Components
export {
  PageLoading,
  Spinner,
  Skeleton,
  ChapterSkeleton,
  QuizSkeleton,
  LoadingButton,
  ErrorState,
  EmptyState
} from "./LoadingStates";
