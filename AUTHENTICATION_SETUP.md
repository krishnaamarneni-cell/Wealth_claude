# TrackFolio Authentication Setup Guide

## Overview
TrackFolio uses Supabase for authentication. Users can sign up/log in with email and password. The authentication system includes:

- **Sign Up** - `/app/auth/sign-up/page.tsx` - Create new account with email
- **Sign In** - `/app/auth/login/page.tsx` - Login with email and password
- **Sign Out** - Server action in `/app/auth/actions.ts` - Logout and redirect to landing page
- **Protected Routes** - Middleware enforces authentication for `/dashboard`

## Completed Features

✅ **Email/Password Authentication**
- Sign up with email and password
- Sign in with email and password
- Secure password hashing with Supabase

✅ **Session Management**
- Middleware automatically handles session tokens
- Cookies are set securely (httpOnly)
- Sessions persist across browser sessions

✅ **Logout Functionality**
- Users can logout from dashboard profile dropdown
- Clears session and redirects to landing page
- Available in dashboard header component

✅ **Protected Routes**
- `/dashboard` requires authentication
- Middleware redirects unauthenticated users to login
- Session validation on every request

## Setup Steps Completed

1. ✅ Installed Supabase packages
2. ✅ Created Supabase client configuration (`lib/supabase/client.ts`)
3. ✅ Created Supabase server configuration (`lib/supabase/server.ts`)
4. ✅ Created session proxy for middleware (`lib/supabase/proxy.ts`)
5. ✅ Added middleware for route protection (`middleware.ts`)
6. ✅ Created auth actions for sign up/sign in/sign out (`app/auth/actions.ts`)
7. ✅ Created sign up page with form validation
8. ✅ Created sign in page with form validation
9. ✅ Created success and error pages
10. ✅ Updated dashboard header with sign out button

## Running Locally

1. **Set environment variables** in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

2. **Create database tables** in Supabase:
   - Run the SQL migration from `scripts/001_create_users_table.sql`
   - Or manually create the `public.users` table through Supabase dashboard

3. **Enable email confirmation** (optional):
   - In Supabase dashboard → Authentication → Email
   - Toggle email confirmation on/off as needed

4. **Configure allowed redirect URLs**:
   - In Supabase dashboard → Authentication → URL Configuration
   - Add `http://localhost:3000` for local development
   - Add your production domain when deploying

## User Flow

1. User clicks "Try for Free" or "Login" button on landing page
2. User is redirected to `/auth/login` or `/auth/sign-up`
3. User enters email and password, submits form
4. Server action (`signUp` or `signIn`) processes the request
5. Session is created and stored in secure HTTP-only cookie
6. User is redirected to dashboard or success page
7. User can logout from profile dropdown in dashboard header
8. Logout clears session and redirects to landing page

## File Structure

```
app/
  auth/
    actions.ts              # Server actions for sign up/in/out
    login/page.tsx          # Login page
    sign-up/page.tsx        # Sign up page
    sign-up-success/page.tsx # Success page after signup
    error/page.tsx          # Error page for auth failures
  dashboard/page.tsx        # Protected dashboard (requires auth)
  protected/page.tsx        # Protected example page
lib/
  supabase/
    client.ts              # Browser Supabase client
    server.ts              # Server Supabase client
    proxy.ts               # Session proxy for middleware
middleware.ts              # Route protection middleware
```

## OAuth Setup (For Later)

When you want to add Google OAuth:
1. Create OAuth credentials in Google Cloud Console
2. Add credentials to Supabase dashboard
3. Enable Google provider in Supabase Authentication
4. Update sign in/up pages to include Google button

## Troubleshooting

**User can't sign up**: Check if email confirmation is enabled. If enabled, user must verify email before accessing protected routes.

**Session not persisting**: Verify middleware.ts is properly configured and cookies are being set in the browser.

**Redirect loops**: Check that environment variables are correctly set and redirect URLs are whitelisted in Supabase.
