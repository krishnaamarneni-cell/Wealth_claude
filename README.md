# Quiz Fixes v2

## Files to Replace

| This File | Replace With | Your Project Path |
|-----------|--------------|-------------------|
| `FinalQuiz.tsx` | Your FinalQuiz | `/components/learn/FinalQuiz.tsx` |
| `quiz-page.tsx` | Quiz page | `/app/learn/[chapterId]/quiz/page.tsx` |
| `quizzes.ts` | Quiz helper | `/lib/learn/quizzes.ts` |

## What Was Fixed

1. **FinalQuiz.tsx**
   - Added safety check for undefined `questions` prop
   - Default `questions` to empty array
   - Pass `answers` to `onComplete` callback

2. **quiz-page.tsx** (rename to page.tsx)
   - Fixed null check: `!chapter.final_quiz` before `.length`
   - Pass actual answers to API
   - Save quiz attempt on pass AND fail

3. **quizzes.ts**
   - Now uses `chapters.ts` as single source of truth
   - Gets quiz questions from chapter data

## Installation Steps

1. **Delete the Cursor-created FinalQuiz** and replace with ours
2. **Replace quiz page** (rename `quiz-page.tsx` to `page.tsx`)
3. **Replace quizzes.ts**
4. **Delete `.next` folder**
5. **Restart dev server**: `npm run dev`
6. **Redeploy**

## Test After Fix

1. Go to Chapter 1 quiz
2. Answer ALL questions WRONG → Should FAIL
3. Answer ALL questions RIGHT → Should PASS
4. Check Supabase `quiz_attempts` table → Should have rows
