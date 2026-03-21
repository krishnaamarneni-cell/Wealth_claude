# WealthClaude Feature Package

## What's Included

### 1. Quiz Fixes (v4)
- Fixed score calculation
- Proper answer validation  
- Single source of truth for chapters

### 2. /start Feature
- Email gate lead capture page
- Public portfolio sharing with Stripe paywall
- Book PDF download

### 3. 🔒 Secure Portfolio System
- Email verification (OTP)
- Device fingerprinting
- Session management
- Watermark protection
- Monthly subscription support

### 4. 🎯 Onboarding System (NEW)
- 9-step guided tour for new users
- Progress bar with Back/Skip/Next
- Welcome modal on first visit
- Tab spotlight highlighting

### 5. 📊 Demo Data System (NEW)
- Auto-seed sample portfolio for new signups
- $50k portfolio with ~120% returns
- 10 stocks + 3 dividends
- "Clear Demo Data" banner

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

---

## Part 3: 🔒 Secure Portfolio System

### Security Layers (7 Total)

| Layer | Protection | What It Does |
|-------|------------|--------------|
| 1️⃣ | **Email Verification (OTP)** | 6-digit code sent to email, expires in 10 min |
| 2️⃣ | **Session Management** | 24-hour sessions, stored in database |
| 3️⃣ | **Device Fingerprinting** | Session tied to specific browser/device |
| 4️⃣ | **Email Watermark** | User's email visible on all data (traceable) |
| 5️⃣ | **Blur on Tab Switch** | Data blurs when user switches away |
| 6️⃣ | **Keyboard Protection** | Blocks Print, Ctrl+S, Ctrl+P, right-click |
| 7️⃣ | **Real-time Subscription Check** | Verifies with Stripe on every visit |

### How Link Sharing Is Blocked

```
User A pays and gets access
        ↓
User A copies URL and sends to User B
        ↓
User B opens URL
        ↓
❌ User B has NO localStorage session
        ↓
User B must enter email
        ↓
User B enters User A's email (trying to cheat)
        ↓
❌ Verification code sent to User A's email (not B!)
        ↓
User B can't get the code
        ↓
User B has NO ACCESS ✅
```

### Pricing Plans

| Plan | Price | Features |
|------|-------|----------|
| **Snapshot** | $4.99 one-time | Current holdings (frozen at purchase date) |
| **Live Access** | $2.99/month | Live updates, buy/sell alerts, cancel anytime |

### New Secure API Routes

| File | Purpose |
|------|---------|
| `app/api/send-verification-code/route.ts` | Send OTP via email (Resend) |
| `app/api/verify-code/route.ts` | Verify OTP, create session |
| `app/api/check-subscription/route.ts` | Validate session + check Stripe subscription |
| `app/api/stripe-subscription/route.ts` | Create checkout (one-time or monthly) |
| `app/api/stripe-webhook/route.ts` | Handle all Stripe events |
| `app/api/verify-payment/route.ts` | Verify payment after redirect |

### User Flow

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Enter Email                                         │
│  ┌────────────────────────────────────┐                      │
│  │  🔒 Secure Portfolio Access        │                      │
│  │                                     │                      │
│  │  Email: [you@example.com      ]    │                      │
│  │                                     │                      │
│  │  [ Send Verification Code ]        │                      │
│  └────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Enter 6-Digit Code                                  │
│  ┌────────────────────────────────────┐                      │
│  │  We sent a code to y***@example.com│                      │
│  │                                     │                      │
│  │       [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]│                      │
│  │                                     │                      │
│  │  Code expires in 9:45              │                      │
│  └────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│  STEP 3a: Has Subscription → Show Portfolio (with watermark) │
│  ┌────────────────────────────────────────────────┐          │
│  │  AAPL    +25%    100 shares    $15,000         │          │
│  │  ─────────────────────────────────────────     │          │
│  │      Licensed to: you@example.com              │← Watermark│
│  └────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
                          OR
┌──────────────────────────────────────────────────────────────┐
│  STEP 3b: No Subscription → Show Pricing                     │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │   SNAPSHOT      │  │  LIVE ACCESS 🔥 │                    │
│  │   $4.99         │  │   $2.99/mo      │                    │
│  │   one-time      │  │   cancel anytime│                    │
│  │   [Buy Now]     │  │   [Subscribe]   │                    │
│  └─────────────────┘  └─────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 4: 🎯 Onboarding System

### Overview

A 9-step guided tour that walks new users through all dashboard features.

### Files

| File | Purpose |
|------|---------|
| `lib/onboarding-context.tsx` | State management, step tracking, localStorage persistence |
| `components/onboarding-bar.tsx` | Fixed bottom progress bar with navigation |
| `components/onboarding-welcome.tsx` | Welcome modal for first-time users |
| `components/onboarding-spotlight.tsx` | Tab highlighting with pulse animation |

### Onboarding Steps

| Step | Page | Tab | Description |
|------|------|-----|-------------|
| 1 | `/dashboard/profile` | - | Set up your profile |
| 2 | `/dashboard/transactions` | - | Import your transactions |
| 3 | `/dashboard/holdings` | holdings | View your holdings |
| 4 | `/dashboard/holdings` | dividends | Track dividends |
| 5 | `/dashboard` | portfolio | Portfolio overview |
| 6 | `/dashboard` | market | Market data |
| 7 | `/dashboard/goals` | goals | Set financial goals |
| 8 | `/dashboard/compare` | compare | Compare investments |
| 9 | `/dashboard/compare` | projection | Future projections |

### Installation

**1. Copy files to your project:**
```
lib/onboarding-context.tsx
components/onboarding-bar.tsx
components/onboarding-welcome.tsx
components/onboarding-spotlight.tsx
```

**2. Wrap your app in `app/layout.tsx`:**

```tsx
import { OnboardingProvider } from '@/lib/onboarding-context'
import { OnboardingBar } from '@/components/onboarding-bar'
import { OnboardingWelcome } from '@/components/onboarding-welcome'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OnboardingProvider>
          <div className="pb-20">{children}</div>
          <OnboardingWelcome />
          <OnboardingBar />
        </OnboardingProvider>
      </body>
    </html>
  )
}
```

**3. Replace tab buttons with `<OnboardingTab>`:**

```tsx
import { OnboardingTab } from '@/components/onboarding-spotlight'

// Before:
<button onClick={() => setTab('holdings')}>Holdings</button>

// After:
<OnboardingTab 
  stepId="holdings" 
  isSelected={activeTab === 'holdings'} 
  onClick={() => setTab('holdings')}
>
  Holdings
</OnboardingTab>
```

### Testing / Reset

```javascript
// Clear onboarding state
localStorage.removeItem('wealthclaude_onboarding')
localStorage.removeItem('wealthclaude_welcome_shown')
location.reload()
```

### User Flow

```
NEW USER SIGNS UP
       ↓
Redirected to /dashboard
       ↓
Welcome Modal appears:
┌─────────────────────────────────────┐
│  👋 Welcome to WealthClaude!        │
│                                      │
│  Let us show you around. We'll      │
│  guide you through the key features.│
│                                      │
│  [Skip Tour]  [Start Tour →]        │
└─────────────────────────────────────┘
       ↓
User clicks "Start Tour"
       ↓
Bottom progress bar appears:
┌─────────────────────────────────────┐
│ Step 1 of 9: Set up your profile    │
│ [Back] [Skip] [●○○○○○○○○] [Next]    │
└─────────────────────────────────────┘
       ↓
Tabs pulse with highlight animation
       ↓
User completes 9 steps
       ↓
"Finish" button → Onboarding complete!
```

---

## Part 5: 📊 Demo Data System

### Overview

Automatically seed new users with a sample portfolio so they see a populated dashboard instead of empty screens.

### Demo Portfolio (~$25k → ~$55k, ~120% return)

| Symbol | Shares | Buy Price | Date | Cost | Est. Return |
|--------|--------|-----------|------|------|-------------|
| NVDA | 50 | $22 | Jan 2023 | $1,100 | ~490% |
| META | 25 | $120 | Feb 2023 | $3,000 | ~358% |
| AAPL | 30 | $140 | Mar 2023 | $4,200 | ~57% |
| GOOGL | 20 | $95 | Apr 2023 | $1,900 | ~84% |
| MSFT | 15 | $260 | May 2023 | $3,900 | ~65% |
| AMZN | 20 | $105 | Jun 2023 | $2,100 | ~90% |
| TSLA | 10 | $175 | Jul 2023 | $1,750 | ~100% |
| COST | 5 | $520 | Aug 2023 | $2,600 | ~77% |
| V | 12 | $235 | Sep 2023 | $2,820 | ~32% |
| JPM | 15 | $145 | Oct 2023 | $2,175 | ~45% |

**+ 3 Dividends:** AAPL ($7.20), MSFT ($11.25), JPM ($15.00)

### Files

| File | Purpose |
|------|---------|
| `app/api/seed-demo-data/route.ts` | POST: seed demo data, DELETE: clear demo |
| `components/demo-data-banner.tsx` | "This is sample data" banner with actions |
| `components/demo-data-wrapper.tsx` | Wrapper to conditionally show banner |

### Installation

**1. Copy the API route:**
```
app/api/seed-demo-data/route.ts
```

**2. Copy the components:**
```
components/demo-data-banner.tsx
components/demo-data-wrapper.tsx
```

**3. Update your auth callback (`app/auth/callback/route.ts`):**

Add this after `exchangeCodeForSession` succeeds:

```typescript
if (!error && data.user) {
  // Check if NEW user (no transactions)
  const { data: existingTx } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', data.user.id)
    .limit(1)

  const isNewUser = !existingTx || existingTx.length === 0

  if (isNewUser) {
    // Seed demo data
    await fetch(`${origin}/api/seed-demo-data`, {
      method: 'POST',
      headers: {
        'Cookie': cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
      },
    })
    
    return NextResponse.redirect(`${origin}/dashboard?welcome=true`)
  }
}
```

**4. Add banner to dashboard layout:**

In `app/dashboard/layout.tsx`:

```tsx
import { DemoDataWrapper } from '@/components/demo-data-wrapper'

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="flex-1 p-6">
        <DemoDataWrapper>
          {children}
        </DemoDataWrapper>
      </main>
    </div>
  )
}
```

### API Endpoints

**POST /api/seed-demo-data**
- Creates 10 BUY + 3 DIVIDEND transactions
- All have `source: 'demo'`
- Only runs if user has 0 existing transactions

**DELETE /api/seed-demo-data**
- Removes all transactions where `source = 'demo'`

### User Flow

```
NEW USER SIGNS UP
       ↓
Confirms Email → /auth/callback
       ↓
Callback checks: Has transactions?
       ↓
NO → Call POST /api/seed-demo-data
       ↓
10 stocks + 3 dividends inserted (source: 'demo')
       ↓
Redirect to /dashboard?welcome=true
       ↓
User sees populated dashboard!
       ↓
Banner shows:
┌─────────────────────────────────────────────────────────────┐
│ ✨ This is sample data — showing you what WealthClaude can  │
│    do. [Import Your Data] [Clear Demo] [✕]                  │
└─────────────────────────────────────────────────────────────┘
       ↓
User clicks [Import Your Data] or [Clear Demo]
       ↓
Demo data deleted, user starts fresh
```

### Testing

```javascript
// Manually seed demo data (in browser console)
fetch('/api/seed-demo-data', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)

// Clear demo data
fetch('/api/seed-demo-data', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log)

// Check if user has demo data
fetch('/api/transactions')
  .then(r => r.json())
  .then(data => console.log('Has demo:', data.some(tx => tx.source === 'demo')))
```

---

## Database Migration

Run this in Supabase SQL Editor:

```sql
-- =============================================
-- PART 1: BASIC TABLES (from original feature)
-- =============================================

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
  plan_type TEXT DEFAULT 'one_time',
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.portfolio_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check own payment" ON public.portfolio_payments
  FOR SELECT USING (true);

-- =============================================
-- PART 2: SECURE PORTFOLIO TABLES
-- =============================================

-- 4. VERIFICATION CODES TABLE (for email OTP)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.verification_codes(expires_at);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on verification_codes" ON public.verification_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public selects on verification_codes" ON public.verification_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow public updates on verification_codes" ON public.verification_codes
  FOR UPDATE USING (true);

-- 5. PORTFOLIO ACCESS SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  portfolio_slug TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_fingerprint TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_sessions_token ON public.portfolio_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_portfolio_sessions_email ON public.portfolio_sessions(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_sessions_expires ON public.portfolio_sessions(expires_at);

ALTER TABLE public.portfolio_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on portfolio_sessions" ON public.portfolio_sessions
  FOR ALL USING (true);

-- 6. PORTFOLIO SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  portfolio_slug TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(email, portfolio_slug)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_subscriptions_email ON public.portfolio_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_subscriptions_stripe ON public.portfolio_subscriptions(stripe_subscription_id);

ALTER TABLE public.portfolio_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on portfolio_subscriptions" ON public.portfolio_subscriptions
  FOR ALL USING (true);

-- 7. ACCESS LOGS TABLE (for security monitoring)
CREATE TABLE IF NOT EXISTS public.portfolio_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  portfolio_slug TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_email ON public.portfolio_access_logs(email);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON public.portfolio_access_logs(created_at);

ALTER TABLE public.portfolio_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserts on access_logs" ON public.portfolio_access_logs
  FOR INSERT WITH CHECK (true);
```

---

## Environment Variables

Add to `.env.local` and Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=https://wealthclaude.com

# Email (Resend) - for sending verification codes
RESEND_API_KEY=re_xxx
EMAIL_FROM=WealthClaude <noreply@wealthclaude.com>
```

---

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://wealthclaude.com/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Install Required Components

```bash
# For OTP input (secure portfolio)
npx shadcn-ui@latest add input-otp
```

---

## Files Overview

```
wealthclaude-features/
├── supabase/
│   └── migration.sql                    # All database tables
├── app/
│   ├── api/
│   │   ├── leads/route.ts
│   │   ├── portfolio-share/
│   │   │   ├── route.ts
│   │   │   └── public/route.ts
│   │   ├── send-verification-code/route.ts
│   │   ├── verify-code/route.ts
│   │   ├── check-subscription/route.ts
│   │   ├── stripe-subscription/route.ts
│   │   ├── stripe-webhook/route.ts
│   │   ├── verify-payment/route.ts
│   │   └── seed-demo-data/route.ts      # NEW
│   ├── auth/
│   │   └── callback/route.ts            # UPDATED
│   ├── start/page.tsx
│   └── u/[slug]/portfolio/page.tsx
├── components/
│   ├── share-portfolio-modal.tsx
│   ├── demo-data-banner.tsx             # NEW
│   ├── demo-data-wrapper.tsx            # NEW
│   ├── onboarding-bar.tsx               # NEW
│   ├── onboarding-welcome.tsx           # NEW
│   └── onboarding-spotlight.tsx         # NEW
├── lib/
│   └── onboarding-context.tsx           # NEW
├── public/
│   └── drive-to-freedom.pdf
├── .env.example
└── README.md
```

---

## Security Limitations (Honest)

| Can We Block? | Method |
|---------------|--------|
| ✅ Yes | Link sharing (session + device required) |
| ✅ Yes | Email guessing (OTP verification required) |
| ✅ Yes | Session hijacking (device fingerprint check) |
| ⚠️ Partial | Screenshots (blur + watermark discourages) |
| ❌ No | Phone camera pointing at screen |
| ❌ No | Writing it down manually |

**Best protection = Make data time-sensitive!** A screenshot of today's portfolio is worthless next month with Live Access + buy/sell alerts.

---

## Monitoring & Logs

### View Access Logs
```sql
SELECT * FROM portfolio_access_logs
WHERE portfolio_slug = 'krishna-amarneni'
ORDER BY created_at DESC
LIMIT 100;
```

### View Active Subscriptions
```sql
SELECT * FROM portfolio_subscriptions
WHERE status = 'active'
ORDER BY created_at DESC;
```

### View Failed Verification Attempts
```sql
SELECT * FROM portfolio_access_logs
WHERE action = 'verify_failed'
ORDER BY created_at DESC;
```

### Clear User Session (if needed)
```sql
DELETE FROM portfolio_sessions WHERE email = 'user@example.com';
```

---

## Installation Checklist

### Quiz Fixes
- [ ] Replace 4 quiz files
- [ ] Clear localStorage in browser
- [ ] Test quiz pass/fail behavior

### /start Feature
- [ ] Run database migration in Supabase
- [ ] Add all environment variables
- [ ] Copy all files to project
- [ ] Add Share button to /holdings
- [ ] Copy `drive-to-freedom.pdf` to `/public`

### Secure Portfolio System
- [ ] Install `input-otp` component
- [ ] Set up Resend account for email
- [ ] Configure Stripe webhook with all events
- [ ] Test email verification flow
- [ ] Test one-time payment ($4.99)
- [ ] Test monthly subscription ($2.99)

### Onboarding System
- [ ] Copy 4 onboarding files
- [ ] Wrap app with `OnboardingProvider`
- [ ] Add `OnboardingBar` and `OnboardingWelcome` to layout
- [ ] Replace tab buttons with `OnboardingTab`
- [ ] Test 9-step tour

### Demo Data System
- [ ] Copy `seed-demo-data` API route
- [ ] Copy banner components
- [ ] Update auth callback to seed new users
- [ ] Add `DemoDataWrapper` to dashboard layout
- [ ] Test demo data seeding and clearing

### Testing
- [ ] Test /start email capture
- [ ] Test portfolio sharing from /holdings
- [ ] Test OTP verification (check console if no Resend key)
- [ ] Test Stripe payment (use card `4242 4242 4242 4242`)
- [ ] Test link sharing protection (try in incognito)
- [ ] Test tab switch blur
- [ ] Test onboarding flow (new user tour)
- [ ] Test demo data (seed and clear)

### Deploy
- [ ] Delete `.next` folder
- [ ] Run `npm run dev` locally
- [ ] Test all flows
- [ ] Deploy to Vercel
- [ ] Add production environment variables
- [ ] Set up production Stripe webhook
- [ ] Switch to live Stripe keys

---

## Test Cards (Stripe)

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Decline |
| Any future date | Expiry |
| Any 3 digits | CVC |

---

## Need Help?

1. Check browser console for errors
2. Check Supabase logs (Database → Logs)
3. Check Stripe webhook logs (Developers → Webhooks)
4. Check Resend dashboard for email delivery
5. Verify all env vars are set in Vercel

---

Made with 🚀 for WealthClaude
