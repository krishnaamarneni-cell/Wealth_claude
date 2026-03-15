# Quiz Fixes v3

## What's Fixed

1. **FinalQuiz.tsx** - Correctly calculates score, passes answers to onComplete
2. **quiz-page.tsx** - Passes answers to API, null-safe checks
3. **quizzes.ts** - Uses chapters.ts as single source of truth
4. **CourseContext.tsx** - Never trusts localStorage for `chapters_completed` (always fetches from DB)

## Files to Replace

| This File | Your Project Path |
|-----------|-------------------|
| `FinalQuiz.tsx` | `/components/learn/FinalQuiz.tsx` |
| `quiz-page.tsx` | `/app/learn/[chapterId]/quiz/page.tsx` (rename to `page.tsx`) |
| `quizzes.ts` | `/lib/learn/quizzes.ts` |
| `CourseContext.tsx` | `/lib/learn/CourseContext.tsx` |

## IMPORTANT: Clear Old Data

Before testing, clear the polluted localStorage data. Run in browser console (F12):

```javascript
localStorage.removeItem('wealthclaude_course_progress');
localStorage.removeItem('wealthclaude_user');
location.reload();
```

Or for all users, you can clear the quiz_attempts table in Supabase:
```sql
DELETE FROM quiz_attempts;
DELETE FROM user_progress;
UPDATE course_users SET is_completed = false;
```

## Installation

1. Replace all 4 files
2. Delete `.next` folder
3. Run `npm run dev`
4. Clear localStorage in browser
5. Redeploy to Vercel

## Test

1. Enter email to start course
2. Go to Chapter 1 → Take Quiz
3. Answer ALL questions WRONG → Should show "You need 80% to pass"
4. Answer ALL questions RIGHT → Should show "Congratulations! You passed!"
5. Check Supabase `quiz_attempts` table → Should show correct score and passed status
