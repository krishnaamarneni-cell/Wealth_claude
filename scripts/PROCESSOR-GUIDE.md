# WealthClaude Processor Guide

## What It Does

The processor runs on your laptop and handles two pipelines:

| Pipeline | Flow |
|----------|------|
| **Instagram Reels** | Admin adds URL → Supabase → Download (yt-dlp) → AI Caption (Groq) → Upload (Cloudinary) → Post (Make.com → Instagram) |
| **YouTube Videos** | Admin adds URL → Supabase → Download → Transcribe → AI Title/Description (Groq) → Headline Overlay (FFmpeg) → Upload (YouTube API) |

---

## Files

```
scripts/
├── wealthclaude-processor.py    ← COMBINED (runs both pipelines)
├── start-all-background.vbs     ← Double-click to run in background
├── start-all.bat                ← Double-click to run with visible window
│
├── video-processor.py           ← Instagram reels ONLY (standalone)
├── start-background.vbs         ← Background launcher for reels only
├── start-video-processor.bat    ← Visible window for reels only
│
└── youtube-processor/           ← YouTube pipeline files
    ├── master_processor.py      ← YouTube ONLY (standalone)
    ├── start-background.vbs     ← Background launcher for YouTube only
    ├── processor.py             ← Main video studio processor
    ├── youtube_uploader.py      ← YouTube API upload
    ├── ai_generator.py          ← Groq AI for titles/descriptions
    ├── video_processor.py       ← FFmpeg headline overlay
    ├── video_downloader.py      ← yt-dlp downloader
    ├── reel_processor.py        ← Reel processing logic
    ├── requirements.txt         ← Python dependencies
    └── video-studio-schema.sql  ← Supabase table schema
```

---

## How to Start

### Option 1: Run BOTH pipelines (recommended)

**With visible window:**
```
Double-click: scripts/start-all.bat
```

**In background (survives closing terminal):**
```
Double-click: scripts/start-all-background.vbs
```

**From terminal:**
```bash
cd scripts
python wealthclaude-processor.py
```

### Option 2: Run only Instagram Reels

```
Double-click: scripts/start-background.vbs
```
Or from terminal:
```bash
python scripts/video-processor.py --loop
```

### Option 3: Run only YouTube Videos

```
Double-click: scripts/youtube-processor/start-background.vbs
```
Or from terminal:
```bash
cd scripts/youtube-processor
python master_processor.py
```

### Option 4: Run combined but only one pipeline

```bash
cd scripts
python wealthclaude-processor.py --reels-only
python wealthclaude-processor.py --youtube-only
```

---

## How to Stop / Pause

### If running with visible window (BAT file)
- Just **close the window** or press **Ctrl+C**

### If running in background (VBS file)
1. Open **Task Manager** (Ctrl+Shift+Esc)
2. Go to **Details** tab
3. Find **pythonw.exe**
4. Right-click → **End Task**

### Pause temporarily
There is no pause button. To pause:
1. Stop the processor (see above)
2. Start it again when ready

### The processor automatically sleeps outside operating hours
- Default: **7:00 AM - 11:00 PM**
- Change in `.env`: `OPERATING_START_HOUR=7` and `OPERATING_END_HOUR=23`

---

## Setup (First Time)

### 1. Install Python dependencies

```bash
pip install requests yt-dlp python-dotenv supabase

# For YouTube processor (extra deps):
cd scripts/youtube-processor
pip install -r requirements.txt
```

### 2. Install FFmpeg (for YouTube headline overlay)

Download from https://ffmpeg.org/download.html and add to PATH.

### 3. Create .env file

Create `scripts/.env` with:

```env
# Required
CRON_SECRET=your_cron_secret
GROQ_API_KEY=your_groq_key

# For Instagram pipeline
CLOUDINARY_URL=cloudinary://key:secret@cloud_name
MAKE_WEBHOOK_URL=https://hook.us2.make.com/your_webhook

# For YouTube pipeline
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional
WEALTHCLAUDE_API_URL=https://www.wealthclaude.com
POLL_INTERVAL_SECONDS=60
OPERATING_START_HOUR=7
OPERATING_END_HOUR=23
```

### 4. YouTube API setup (one-time)

```bash
cd scripts/youtube-processor
python youtube_uploader.py auth
```
This opens a browser for Google OAuth. After auth, a `youtube_token.pickle` file is saved.

---

## Logs

Logs are saved to `scripts/logs/`:
- `unified_YYYYMMDD.log` — combined processor logs
- Check these if something isn't working

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Missing CRON_SECRET" | Create `scripts/.env` with your keys |
| "yt-dlp not found" | Run `pip install yt-dlp` |
| "FFmpeg not found" | Install FFmpeg and add to PATH |
| "YouTube auth error" | Run `python youtube_uploader.py auth` again |
| Processor stops after closing laptop | Use VBS launcher — it runs even when minimized, but stops when laptop sleeps. Keep laptop awake or use Task Scheduler |
| Videos stuck in "approved" | Check logs. Make sure processor is running |
