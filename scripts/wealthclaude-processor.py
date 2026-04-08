#!/usr/bin/env python3
"""
WealthClaude Unified Processor
================================
Runs BOTH processors in one script:
  1. Instagram Reel Processor — polls Supabase → download → caption → Cloudinary → Make.com
  2. YouTube Video Processor  — polls Supabase → download → transcribe → AI content → YouTube upload

Usage:
    python wealthclaude-processor.py              # Run both processors
    python wealthclaude-processor.py --reels-only  # Only Instagram reels
    python wealthclaude-processor.py --youtube-only # Only YouTube videos

Background (Windows):
    Double-click start-all-background.vbs
"""

import os
import sys
import time
import threading
import logging
from datetime import datetime, timedelta
from pathlib import Path

# ─── Load .env ──────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
ENV_FILE = SCRIPT_DIR / ".env"

if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

# Also check youtube-processor .env
YT_ENV = SCRIPT_DIR / "youtube-processor" / ".env"
if YT_ENV.exists():
    for line in YT_ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

# Parse Cloudinary URL
import re
cloudinary_url = os.environ.get("CLOUDINARY_URL", "")
if cloudinary_url and cloudinary_url.startswith("cloudinary://"):
    m = re.match(r"cloudinary://(\d+):([^@]+)@(.+)", cloudinary_url)
    if m:
        os.environ.setdefault("CLOUDINARY_API_KEY", m.group(1))
        os.environ.setdefault("CLOUDINARY_API_SECRET", m.group(2))
        os.environ.setdefault("CLOUDINARY_CLOUD_NAME", m.group(3))

# ─── Configuration ──────────────────────────────────────────────────────────

REEL_POLL_INTERVAL = int(os.environ.get("REEL_POLL_INTERVAL", "60"))      # 1 min
YOUTUBE_POLL_INTERVAL = int(os.environ.get("YOUTUBE_POLL_INTERVAL", "60"))  # 1 min
OPERATING_START_HOUR = int(os.environ.get("OPERATING_START_HOUR", "7"))
OPERATING_END_HOUR = int(os.environ.get("OPERATING_END_HOUR", "23"))

# ─── Logging ────────────────────────────────────────────────────────────────

LOG_DIR = SCRIPT_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / f"unified_{datetime.now().strftime('%Y%m%d')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("WealthClaude")

# ─── Operating Hours ────────────────────────────────────────────────────────

def is_within_operating_hours():
    hour = datetime.now().hour
    return OPERATING_START_HOUR <= hour < OPERATING_END_HOUR

def seconds_until_operating():
    now = datetime.now()
    if now.hour >= OPERATING_END_HOUR:
        next_run = (now + timedelta(days=1)).replace(hour=OPERATING_START_HOUR, minute=0, second=0)
    elif now.hour < OPERATING_START_HOUR:
        next_run = now.replace(hour=OPERATING_START_HOUR, minute=0, second=0)
    else:
        return 0
    return max((next_run - now).total_seconds(), 60)


# ─── Instagram Reel Worker ──────────────────────────────────────────────────

def reel_worker():
    """Process Instagram reels via WealthClaude API → Cloudinary → Make.com"""
    reel_logger = logging.getLogger("Reels")

    # Import the reel processor
    try:
        # Add script dir to path for imports
        sys.path.insert(0, str(SCRIPT_DIR))
        from importlib import import_module

        # We'll use the existing video-processor.py logic inline
        import requests
        import hashlib
        import subprocess
        import tempfile
    except ImportError as e:
        reel_logger.error(f"Missing dependency: {e}. Run: pip install requests yt-dlp")
        return

    API_URL = os.environ.get("WEALTHCLAUDE_API_URL", "https://www.wealthclaude.com")
    CRON_SECRET = os.environ.get("CRON_SECRET", "")
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    CLOUDINARY_CLOUD = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
    MAKE_WEBHOOK_URL = os.environ.get("MAKE_WEBHOOK_URL", "")

    HEADERS = {"Authorization": f"Bearer {CRON_SECRET}", "Content-Type": "application/json"}
    DOWNLOAD_DIR = Path(tempfile.gettempdir()) / "wealthclaude_videos"
    DOWNLOAD_DIR.mkdir(exist_ok=True)

    if not CRON_SECRET:
        reel_logger.error("CRON_SECRET not set — reel processor disabled")
        return

    reel_logger.info(f"Reel processor started (poll every {REEL_POLL_INTERVAL}s)")
    reel_logger.info(f"API: {API_URL} | Cloudinary: {CLOUDINARY_CLOUD or 'NOT SET'} | Make: {'OK' if MAKE_WEBHOOK_URL else 'NOT SET'}")

    while True:
        try:
            if not is_within_operating_hours():
                wait = seconds_until_operating()
                reel_logger.info(f"Outside hours. Sleeping {wait/3600:.1f}h")
                time.sleep(wait)
                continue

            # Poll
            res = requests.get(f"{API_URL}/api/video/poll", headers=HEADERS, timeout=15)
            if res.status_code != 200:
                time.sleep(REEL_POLL_INTERVAL)
                continue
            video = res.json().get("video")
            if not video:
                time.sleep(REEL_POLL_INTERVAL)
                continue

            vid_id = video["id"]
            source_url = video.get("source_url", "")
            reel_logger.info(f"Processing reel: {vid_id} — {source_url}")

            # Download
            output_path = DOWNLOAD_DIR / f"{vid_id}.mp4"
            cmd = ["yt-dlp", "--no-warnings", "-f", "mp4", "-o", str(output_path), source_url]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            file_path = str(output_path) if output_path.exists() else None

            if not file_path:
                for f in DOWNLOAD_DIR.glob(f"{vid_id}.*"):
                    file_path = str(f)
                    break

            if not file_path:
                reel_logger.error(f"Download failed for {vid_id}")
                requests.post(f"{API_URL}/api/video/complete", headers=HEADERS, json={"video_id": vid_id, "status": "error", "error": "Download failed"}, timeout=15)
                continue

            # Caption
            caption = video.get("text_content", "")
            if not caption or len(caption.strip()) < 20:
                if GROQ_API_KEY:
                    try:
                        cap_res = requests.post("https://api.groq.com/openai/v1/chat/completions",
                            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                            json={"model": "llama-3.3-70b-versatile", "messages": [
                                {"role": "system", "content": "You write engaging Instagram reel captions for WealthClaude (finance brand). 150-200 words, strong hook, 8-12 hashtags, CTA."},
                                {"role": "user", "content": f"Write a caption for this reel: {source_url}"}
                            ], "max_tokens": 400, "temperature": 0.8}, timeout=30)
                        if cap_res.status_code == 200:
                            caption = cap_res.json()["choices"][0]["message"]["content"].strip()
                    except Exception as e:
                        reel_logger.warning(f"Caption gen failed: {e}")
                if not caption:
                    caption = "Check this out! 🔥\n\n#finance #investing #wealthclaude"

            # Upload to Cloudinary
            cloud_url = None
            if all([CLOUDINARY_CLOUD, CLOUDINARY_KEY, CLOUDINARY_SECRET]):
                ts = str(int(time.time()))
                folder = "wealthclaude/reels"
                pub_id = f"{folder}/{vid_id}"
                sig_str = f"folder={folder}&public_id={pub_id}&timestamp={ts}{CLOUDINARY_SECRET}"
                sig = hashlib.sha1(sig_str.encode()).hexdigest()
                with open(file_path, "rb") as f:
                    up_res = requests.post(f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD}/video/upload",
                        data={"api_key": CLOUDINARY_KEY, "timestamp": ts, "signature": sig, "folder": folder, "public_id": pub_id},
                        files={"file": f}, timeout=300)
                if up_res.status_code == 200:
                    cloud_url = up_res.json().get("secure_url")
                    reel_logger.info(f"Uploaded: {cloud_url}")

            # Make.com webhook
            if cloud_url and MAKE_WEBHOOK_URL:
                requests.post(MAKE_WEBHOOK_URL, json={"video_id": vid_id, "video_url": cloud_url, "text": caption, "caption": caption, "source_url": source_url, "platform": "instagram", "content_type": "reel", "timestamp": datetime.now().isoformat()}, timeout=30)

            # Report
            requests.post(f"{API_URL}/api/video/complete", headers=HEADERS, json={"video_id": vid_id, "cloudinary_url": cloud_url or "", "caption": caption, "status": "posted" if cloud_url else "error"}, timeout=15)

            # Cleanup
            try:
                Path(file_path).unlink(missing_ok=True)
            except:
                pass

            reel_logger.info(f"Done: {vid_id}")

        except Exception as e:
            reel_logger.error(f"Error: {e}")

        time.sleep(REEL_POLL_INTERVAL)


# ─── YouTube Worker ─────────────────────────────────────────────────────────

def youtube_worker():
    """Process YouTube videos via Supabase → download → transcribe → AI → upload"""
    yt_logger = logging.getLogger("YouTube")

    # Add youtube-processor to path
    yt_dir = SCRIPT_DIR / "youtube-processor"
    sys.path.insert(0, str(yt_dir))

    try:
        from processor import VideoStudioProcessor
        yt_logger.info("YouTube processor loaded")
    except ImportError as e:
        yt_logger.error(f"Cannot load YouTube processor: {e}")
        yt_logger.error("Install deps: cd scripts/youtube-processor && pip install -r requirements.txt")
        return

    try:
        processor = VideoStudioProcessor()
        processor.run()  # This has its own loop
    except Exception as e:
        yt_logger.error(f"YouTube processor crashed: {e}")
        import traceback
        traceback.print_exc()


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    run_reels = True
    run_youtube = True

    if "--reels-only" in sys.argv:
        run_youtube = False
    if "--youtube-only" in sys.argv:
        run_reels = False

    print()
    print("=" * 60)
    print("  WEALTHCLAUDE UNIFIED PROCESSOR")
    print("=" * 60)
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Operating hours: {OPERATING_START_HOUR}:00 - {OPERATING_END_HOUR}:00")
    print(f"  Instagram Reels: {'ON' if run_reels else 'OFF'}")
    print(f"  YouTube Videos:  {'ON' if run_youtube else 'OFF'}")
    print(f"  Logs: {LOG_DIR}")
    print("=" * 60)
    print("  Press Ctrl+C to stop")
    print("=" * 60)
    print()

    threads = []

    if run_reels:
        t = threading.Thread(target=reel_worker, daemon=True, name="ReelProcessor")
        threads.append(t)

    if run_youtube:
        t = threading.Thread(target=youtube_worker, daemon=True, name="YouTubeProcessor")
        threads.append(t)

    for t in threads:
        t.start()
        logger.info(f"Started: {t.name}")

    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        print("\nAll processors stopped.")


if __name__ == "__main__":
    main()
