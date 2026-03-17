# WealthClaude Feature Package

## What's Included

### 1. Quiz Fixes (v4)
- Fixed score calculation
- Proper answer validation  
- Single source of truth for chapters

### 2. /start Feature (NEW)
- Email gate lead capture page
- Public portfolio sharing with Stripe paywall
- Book PDF download

---

## Part 1: Quiz Fixes

### What's Fixed

1. **FinalQuiz.tsx** - Correctly calculates score, passes answers to onComplete
2. **quiz-page.tsx** - Passes answers to API, null-safe checks
3. **quizzes.ts** - Uses chapters.ts as single source of truth
4. **CourseContext.tsx** - Never trusts localStorage for `chapters_completed` (always fetches from DB)

### Quiz Files to Replace

| This File | Your Project Path |
|-----------|-------------------|
| `FinalQuiz.tsx` | `/components/learn/FinalQuiz.tsx` |
| `quiz-page.tsx` | `/app/learn/[chapterId]/quiz/page.tsx` (rename to `page.tsx`) |
| `quizzes.ts` | `/lib/learn/quizzes.ts` |
| `CourseContext.tsx` | `/lib/learn/CourseContext.tsx` |

### IMPORTANT: Clear Old Data

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

### Test Quiz Fixes

1. Enter email to start course
2. Go to Chapter 1 → Take Quiz
3. Answer ALL questions WRONG → Should show "You need 80% to pass"
4. Answer ALL questions RIGHT → Should show "Congratulations! You passed!"
5. Check Supabase `quiz_attempts` table → Should show correct score and passed status

---

## Part 2: /start Feature

### New Pages & APIs

| File | Purpose |
|------|---------|
| `app/start/page.tsx` | Email gate → Free content dashboard |
| `app/u/[slug]/portfolio/page.tsx` | Public portfolio page (free + paid) |
| `app/api/leads/route.ts` | Capture leads to Supabase |
| `app/api/portfolio-share/route.ts` | Create/manage shared portfolios |
| `app/api/portfolio-share/public/route.ts` | Get public portfolio data |
| `app/api/stripe-checkout/route.ts` | Create Stripe checkout session |
| `app/api/stripe-webhook/route.ts` | Handle payment confirmation |
| `components/share-portfolio-modal.tsx` | Share portfolio from /holdings |
| `public/drive-to-freedom.pdf` | Book 1 PDF download |

### Database Migration

Run this in Supabase SQL Editor (`supabase/migration.sql`):

```sql
-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  interested_in_book2 BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'start_page',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- 2. PUBLIC PORTFOLIOS TABLE
CREATE TABLE IF NOT EXISTS public.public_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  holdings JSONB,
  total_value NUMERIC,
  total_gain_percent NUMERIC,
  total_cost NUMERIC,
  today_gain_percent NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.public_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active portfolios" ON public.public_portfolios
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert own portfolio" ON public.public_portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio" ON public.public_portfolios
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. PORTFOLIO PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  portfolio_id UUID REFERENCES public.public_portfolios(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_paid INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.portfolio_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check own payment" ON public.portfolio_payments
  FOR SELECT USING (true);
```

### Environment Variables

Add to `.env.local`:

```env
# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=https://wealthclaude.com
```

### Add Share Button to Holdings Page

In your `/holdings` page, add:

```tsx
import { useState } from "react"
import { Share2 } from "lucide-react"
import SharePortfolioModal from "@/components/share-portfolio-modal"

// In component:
const [showShareModal, setShowShareModal] = useState(false)

// In header (next to Refresh button):
<Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>
  <Share2 className="h-4 w-4 mr-2" />
  Share Portfolio
</Button>

// At end of component:
<SharePortfolioModal open={showShareModal} onClose={() => setShowShareModal(false)} />
```

### Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://wealthclaude.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## User Flows

### /start Page Flow
```
wealthclaude.com/start (email gate)
        ↓
   User enters email + name
        ↓
   Stored in Supabase `leads` table
        ↓
   FREE ACCESS:
   ├── FIRE Course → /learn
   ├── FIRE Score → /fire-score
   ├── Book 1 PDF → download
   └── Book 2 Waitlist
        ↓
   PREMIUM ($29):
   └── Krishna's Portfolio → /u/krishna-amarneni/portfolio
```

### Portfolio Sharing Flow
```
/holdings (your dashboard)
        ↓
   Click "Share Portfolio"
        ↓
   Enter "Krishna Amarneni"
        ↓
   Generates: /u/krishna-amarneni/portfolio
        ↓
   Snapshot saved to Supabase
```

### Public Portfolio Access
```
/u/krishna-amarneni/portfolio

FREE (anyone):
├── All ticker symbols
├── Return % per stock
├── Total return %
└── Sector info

PAID ($29 one-time):
├── Everything above +
├── Share quantities
├── Dollar amounts
├── Allocations
└── Cost basis
```

---

## Installation Checklist

### Quiz Fixes
- [ ] Replace 4 quiz files
- [ ] Clear localStorage in browser
- [ ] Test quiz pass/fail behavior

### /start Feature
- [ ] Run database migration in Supabase
- [ ] Add Stripe env variables
- [ ] Copy all files to project
- [ ] Add Share button to /holdings
- [ ] Copy `drive-to-freedom.pdf` to `/public`
- [ ] Set up Stripe webhook
- [ ] Test /start email capture
- [ ] Test portfolio sharing
- [ ] Test Stripe payment (use test card `4242 4242 4242 4242`)

### Deploy
- [ ] Delete `.next` folder
- [ ] Run `npm run dev` locally
- [ ] Test all flows
- [ ] Deploy to Vercel
- [ ] Add production Stripe webhook

---

## Files Overview

```
wealthclaude-start-feature/
├── supabase/
│   └── migration.sql           # New database tables
├── app/
│   ├── api/
│   │   ├── leads/route.ts
│   │   ├── portfolio-share/
│   │   │   ├── route.ts
│   │   │   └── public/route.ts
│   │   ├── stripe-checkout/route.ts
│   │   └── stripe-webhook/route.ts
│   ├── start/page.tsx          # Email gate page
│   └── u/[slug]/portfolio/page.tsx
├── components/
│   └── share-portfolio-modal.tsx
├── public/
│   └── drive-to-freedom.pdf    # Book 1 PDF
├── .env.example
└── README.md
```

---

## Need Help?

1. Check browser console for errors
2. Check Supabase logs (Database → Logs)
3. Check Stripe webhook logs (Developers → Webhooks → Select endpoint)
4. Verify all env vars are set in Vercel
