# Environment Setup Guide - Local Development

This guide explains how to set up API keys and environment variables for local development.

## File Location

**Create this file in the root directory of your project:**
```
project-root/
├── .env.local          ← Create this file here
├── app/
├── components/
├── lib/
├── package.json
└── ... (other files)
```

## File: `.env.local`

This file should be created in the **root directory** (same level as `package.json`).

### Complete Setup Steps

1. **Create the file** in the root directory named `.env.local`

2. **Add these environment variables:**
```bash
# Stock Market Data API Keys
FINNHUB_API_KEY=your_api_key_here
POLYGON_API_KEY=your_api_key_here
```

3. **Get your API keys:**
   - **Finnhub**: https://finnhub.io/register (free tier available)
   - **Polygon.io**: https://polygon.io/ (free tier available)

4. **Replace the placeholder values** with your actual API keys

## How Next.js Loads Environment Variables

- **`.env.local`** - Loaded automatically in all environments (dev, test, prod)
- **Private variables** - Prefix without `NEXT_PUBLIC_` (only available server-side)
- **Public variables** - Prefix with `NEXT_PUBLIC_` (available in browser)

This project uses **private API keys** (no `NEXT_PUBLIC_` prefix), which means:
- Keys are only accessible on the server (in API routes)
- Keys are NOT exposed to the browser
- They're safe from being leaked in client-side code

## Running Locally

1. Create `.env.local` file in root directory
2. Add your API keys
3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   # or
   bun dev
   ```
4. Open http://localhost:3000

## Important Security Notes

⚠️ **NEVER commit `.env.local` to git!**
- It's already in `.gitignore`
- If accidentally committed, regenerate your API keys immediately
- The file contains sensitive credentials

✅ **DO:**
- Keep `.env.local` private to your local machine
- Share API keys through secure channels if collaborating
- Rotate keys periodically

❌ **DON'T:**
- Push `.env.local` to GitHub
- Share API keys in chat, email, or public channels
- Commit files with API keys

## File Structure in Root Directory

```
my-portfolio-app/
├── .env.local              ← Your environment variables (never commit)
├── .gitignore              ← Ensures .env.local is ignored
├── .env.example            ← Optional: template for team members
├── app/
├── components/
├── lib/
├── package.json
├── next.config.mjs
└── ...
```

## Optional: `.env.example` (For Team Collaboration)

Create `.env.example` in the root to show team members what variables are needed:

```bash
# .env.example
FINNHUB_API_KEY=your_key_here
POLYGON_API_KEY=your_key_here
```

This file CAN be committed to git since it doesn't contain real keys.

## Troubleshooting

**Problem**: "API keys not configured" error
- Solution: Make sure `.env.local` exists in the root directory with valid keys

**Problem**: API calls failing after deployment
- Solution: Add the same environment variables in Vercel dashboard under Project Settings > Environment Variables

**Problem**: Changes not taking effect
- Solution: Restart your dev server (`npm run dev`) after changing `.env.local`

## For Production (Vercel)

When deploying to Vercel:
1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add your `FINNHUB_API_KEY` and `POLYGON_API_KEY`
4. Redeploy your project

The `.env.local` file is only for local development and should never be uploaded to Vercel.
