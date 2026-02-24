# Blog Admin Setup Guide

## Quick Setup

The blog admin feature requires the `blog_posts` table to be created in your Supabase database.

### Step 1: Open Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Create the Blog Table
1. Click **"New query"** or **"+"**
2. Copy all the SQL from the file: `/SETUP_BLOG_TABLE.sql`
3. Paste it into the SQL editor
4. Click **"Run"** (or press Ctrl+Enter)

The script will:
- Create the `blog_posts` table with all required columns
- Set up indexes for faster queries
- Enable Row-Level Security (RLS) with proper policies
- Allow users to only see/edit their own posts (unless published)

### Step 3: Test the Blog Admin
1. Navigate to `/admin/blog` in your app
2. Click **"New Post"** to create a blog post
3. Fill in the form and click **"Save Draft"** or **"Publish"**

## Features

- **AI-Powered Writing**: Use the AI Write sidebar to generate blog posts from topics
- **Full-Screen Editor**: Distraction-free writing experience
- **Real-time Updates**: See posts appear instantly in the list
- **Draft & Publish**: Save as draft or publish immediately
- **Perplexity AI Integration**: Generates title, content, excerpt, and tags

## Troubleshooting

**Error: "Could not find the 'author_id' column"**
- The `blog_posts` table hasn't been created yet
- Follow Step 2 above to create it

**Error: "Connection refused" or "Failed to save post"**
- Check that the table was created successfully in Supabase
- Verify your Supabase connection is working (check Auth)

**Blog posts not appearing in list**
- Refresh the page (F5)
- Check your Supabase RLS policies are enabled
- Verify you're logged in as the correct user

