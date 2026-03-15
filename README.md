# WealthClaude FIRE Course

A comprehensive, interactive personal finance course built with Next.js, featuring story-driven content, quizzes, and certificate generation.

## Features

- 📚 **14 Chapters** covering personal finance from basics to FIRE
- 🎭 **Story-driven learning** following "Maya's" journey to financial independence
- ✅ **Interactive quizzes** with instant feedback and progress tracking
- 🏆 **Certificate generation** with social sharing and PDF download
- 📱 **Fully responsive** mobile-first design with slide-out navigation
- 💾 **Progress persistence** via Supabase database
- 🎨 **Beautiful UI** with Framer Motion animations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: shadcn/ui
- **PDF Generation**: jsPDF

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Add Required Dependencies

If not already installed:

```bash
npm install framer-motion lucide-react jspdf
npm install @supabase/supabase-js
```

### 3. Environment Variables

Create or update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Database Setup

Run the SQL migrations in your Supabase SQL Editor:

1. First, run `supabase/migrations/001_initial_schema.sql`
2. Then, run `supabase/migrations/002_certificates.sql`

### 5. Add Files to Your Project

Copy the following directories to your WealthClaude project:

```
├── app/
│   ├── api/learn/          → your-project/app/api/learn/
│   └── learn/              → your-project/app/learn/
├── components/learn/       → your-project/components/learn/
├── lib/learn/              → your-project/lib/learn/
└── types/learn.ts          → your-project/types/learn.ts
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/learn` to see the course.

## File Structure

```
app/
├── api/learn/
│   ├── user/route.ts           # User creation/lookup
│   ├── progress/route.ts       # Progress tracking
│   ├── quiz/route.ts           # Quiz submissions
│   └── certificate/route.ts    # Certificate generation
└── learn/
    ├── layout.tsx              # Course layout with sidebar
    ├── page.tsx                # Course overview
    ├── [chapterId]/
    │   ├── page.tsx            # Chapter content
    │   └── quiz/page.tsx       # Final quiz
    └── certificate/
        ├── page.tsx            # Certificate generation
        └── [certificateId]/    # Shareable certificate

components/learn/
├── index.ts                    # Barrel exports
├── Certificate.tsx             # Certificate canvas & download
├── ChapterComplete.tsx         # Completion celebration + confetti
├── ChapterContent.tsx          # Section content renderer
├── ComparisonTable.tsx         # Side-by-side comparisons
├── CourseSidebar.tsx           # Navigation + mobile drawer
├── EmailCaptureModal.tsx       # Email signup modal
├── FinalQuiz.tsx               # Chapter final quiz
├── LoadingStates.tsx           # Loading/error/empty states
├── MiniQuiz.tsx                # Inline section quizzes
├── ProgressBar.tsx             # Progress indicators
├── QuizQuestion.tsx            # Quiz question component
├── RichCallout.tsx             # Callout boxes (tip, warning, etc.)
├── SectionPagination.tsx       # Next/previous navigation
└── StoryBlock.tsx              # Maya's story segments

lib/learn/
├── index.ts                    # Barrel exports
├── CourseContext.tsx           # Global state management
├── chapters.ts                 # All course content (3,967 lines)
└── quizzes.ts                  # Quiz validation

types/
└── learn.ts                    # TypeScript interfaces

supabase/migrations/
├── 001_initial_schema.sql      # Core tables
└── 002_certificates.sql        # Certificates table
```

## Course Structure

### 5 Phases, 14 Chapters

| Phase | Chapters | Topics |
|-------|----------|--------|
| **Foundation** | 1-3 | Money mindset, Banking, Debt |
| **Protection** | 4 | Emergency fund, Insurance |
| **Investing** | 5-7 | Compound interest, Stocks, Accounts |
| **Optimization** | 8-10 | Taxes, Tax strategies, Income streams |
| **FIRE Path** | 11-14 | FIRE intro, FIRE number, Strategy, Execution |

### Content Blocks

Each chapter includes:
- **Story blocks**: Maya's narrative journey
- **Myth/Reality/Wealthy**: Three-perspective comparisons
- **Formulas**: Mathematical concepts
- **Callouts**: Tips, warnings, key insights, action items
- **Comparisons**: Side-by-side tables
- **Mini quizzes**: 2-3 questions per section
- **Final quiz**: 5 questions, 80% pass threshold

## Customization

### Theming

The course uses CSS variables for theming. Primary color is `#5FD383` (WealthClaude green).

Update in your Tailwind config or global CSS:

```css
:root {
  --primary: 95 211 131; /* #5FD383 in RGB */
}
```

### Adding YouTube Videos

In `lib/learn/chapters.ts`, add video content blocks:

```typescript
{
  type: "video",
  videoId: "dQw4w9WgXcQ",
  title: "Optional video title"
}
```

### Adding New Chapters

1. Create chapter object in `lib/learn/chapters.ts`
2. Add to the `chapters` array
3. Update `CourseSidebar.tsx` chapter list
4. Add final quiz questions

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/learn/user` | POST | Create/get user by email |
| `/api/learn/progress` | GET | Fetch user progress |
| `/api/learn/progress` | POST | Save chapter progress |
| `/api/learn/quiz` | POST | Submit quiz attempt |
| `/api/learn/certificate` | GET | Fetch certificate |
| `/api/learn/certificate` | POST | Generate certificate |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Lazy-loaded chapter content
- Optimistic UI updates
- Local storage fallback for guests
- Canvas-based certificate generation

## Accessibility

- Keyboard navigation throughout
- ARIA labels on interactive elements
- Focus indicators
- Screen reader support
- Reduced motion support

## License

MIT License - see LICENSE file for details.

## Credits

Built with ❤️ for WealthClaude by Krishna.
