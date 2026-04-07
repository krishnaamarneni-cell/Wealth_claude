"""
WealthClaude Video Processor
=============================
Local script that:
  1. Polls Supabase for approved videos
  2. Downloads the reel using yt-dlp
  3. Generates AI caption using Groq
  4. Uploads to Cloudinary
  5. Sends webhook to Make.com (which posts to Instagram)

Setup:
  pip install requests yt-dlp cloudinary

Environment variables needed:
  WEALTHCLAUDE_API_URL     — e.g. https://www.wealthclaude.com
  CRON_SECRET              — same secret as the server
  GROQ_API_KEY             — for AI caption generation
  CLOUDINARY_CLOUD_NAME    — Cloudinary cloud name
  CLOUDINARY_API_KEY       — Cloudinary API key
  CLOUDINARY_API_SECRET    — Cloudinary API secret
  MAKE_WEBHOOK_URL         — Make.com webhook URL

Run:
  python video-processor.py           # Process one video and exit
  python video-processor.py --loop    # Poll every 60 seconds
"""

import os
import sys
import time
import json
import hashlib
import requests
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

# ─── Config ──────────────────────────────────────────────────────────────────

API_URL = os.environ.get("WEALTHCLAUDE_API_URL", "https://www.wealthclaude.com")
CRON_SECRET = os.environ.get("CRON_SECRET", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
CLOUDINARY_CLOUD = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
MAKE_WEBHOOK_URL = os.environ.get("MAKE_WEBHOOK_URL", "")

HEADERS = {
    "Authorization": f"Bearer {CRON_SECRET}",
    "Content-Type": "application/json",
}

DOWNLOAD_DIR = Path(tempfile.gettempdir()) / "wealthclaude_videos"
DOWNLOAD_DIR.mkdir(exist_ok=True)


# ─── Step 1: Poll for approved video ────────────────────────────────────────

def poll_video():
    """Fetch next approved video from the server."""
    print(f"[{now()}] Polling for approved videos...")
    try:
        res = requests.get(f"{API_URL}/api/video/poll", headers=HEADERS, timeout=15)
        if res.status_code != 200:
            print(f"  Poll failed: {res.status_code} {res.text[:200]}")
            return None
        data = res.json()
        video = data.get("video")
        if not video:
            print("  No approved videos in queue.")
            return None
        print(f"  Found video: {video['id']} — {video.get('source_url', 'no URL')}")
        return video
    except Exception as e:
        print(f"  Poll error: {e}")
        return None


# ─── Step 2: Download reel ──────────────────────────────────────────────────

def download_reel(source_url: str, video_id: str) -> str | None:
    """Download Instagram reel using yt-dlp."""
    output_path = DOWNLOAD_DIR / f"{video_id}.mp4"

    if output_path.exists():
        print(f"  Already downloaded: {output_path}")
        return str(output_path)

    print(f"  Downloading reel: {source_url}")
    try:
        cmd = [
            "yt-dlp",
            "--no-warnings",
            "-f", "mp4",
            "-o", str(output_path),
            source_url,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            print(f"  yt-dlp error: {result.stderr[:300]}")
            return None
        if output_path.exists():
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"  Downloaded: {output_path} ({size_mb:.1f} MB)")
            return str(output_path)
        # yt-dlp may add extension
        for f in DOWNLOAD_DIR.glob(f"{video_id}.*"):
            print(f"  Downloaded: {f} ({f.stat().st_size / (1024*1024):.1f} MB)")
            return str(f)
        print("  Download failed: file not found after yt-dlp")
        return None
    except subprocess.TimeoutExpired:
        print("  Download timed out (120s)")
        return None
    except Exception as e:
        print(f"  Download error: {e}")
        return None


# ─── Step 3: Generate caption ───────────────────────────────────────────────

def generate_caption(source_url: str, existing_caption: str | None = None) -> str:
    """Generate Instagram caption using Groq AI."""
    if existing_caption and len(existing_caption.strip()) > 20:
        print("  Using existing caption.")
        return existing_caption.strip()

    if not GROQ_API_KEY:
        print("  No GROQ_API_KEY — using default caption.")
        return "Check this out! 🔥\n\n#finance #investing #wealthclaude #reels"

    print("  Generating AI caption...")
    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You write engaging Instagram reel captions for a finance/investing brand called WealthClaude. "
                            "Write 150-200 words. Start with a strong hook. Include 8-12 relevant hashtags. "
                            "Use line breaks. End with a CTA. Tone: confident, educational, slightly edgy."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Write a caption for this reel from: {source_url}",
                    },
                ],
                "max_tokens": 400,
                "temperature": 0.8,
            },
            timeout=30,
        )
        if res.status_code == 200:
            text = res.json()["choices"][0]["message"]["content"].strip()
            print(f"  Caption generated ({len(text)} chars)")
            return text
        else:
            print(f"  Groq error {res.status_code}: {res.text[:200]}")
    except Exception as e:
        print(f"  Caption generation error: {e}")

    return "Check this out! 🔥\n\nFollow @wealthclaude for more.\n\n#finance #investing #wealthclaude"


# ─── Step 4: Upload to Cloudinary ───────────────────────────────────────────

def upload_to_cloudinary(file_path: str, video_id: str) -> str | None:
    """Upload video file to Cloudinary."""
    if not all([CLOUDINARY_CLOUD, CLOUDINARY_KEY, CLOUDINARY_SECRET]):
        print("  Missing Cloudinary credentials — skipping upload.")
        return None

    print(f"  Uploading to Cloudinary...")
    try:
        timestamp = str(int(time.time()))
        folder = "wealthclaude/reels"
        public_id = f"{folder}/{video_id}"

        # Generate signature
        params_to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{CLOUDINARY_SECRET}"
        signature = hashlib.sha1(params_to_sign.encode()).hexdigest()

        with open(file_path, "rb") as f:
            res = requests.post(
                f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD}/video/upload",
                data={
                    "api_key": CLOUDINARY_KEY,
                    "timestamp": timestamp,
                    "signature": signature,
                    "folder": folder,
                    "public_id": public_id,
                    "resource_type": "video",
                },
                files={"file": f},
                timeout=300,
            )

        if res.status_code == 200:
            url = res.json().get("secure_url")
            print(f"  Uploaded: {url}")
            return url
        else:
            print(f"  Cloudinary error {res.status_code}: {res.text[:300]}")
            return None
    except Exception as e:
        print(f"  Upload error: {e}")
        return None


# ─── Step 5: Send webhook to Make.com ───────────────────────────────────────

def send_to_make(video_id: str, cloudinary_url: str, caption: str, source_url: str):
    """Send webhook to Make.com to trigger Instagram posting."""
    if not MAKE_WEBHOOK_URL:
        print("  No MAKE_WEBHOOK_URL — skipping webhook.")
        return False

    print("  Sending to Make.com...")
    try:
        payload = {
            "video_id": video_id,
            "video_url": cloudinary_url,
            "caption": caption,
            "source_url": source_url,
            "platform": "instagram",
            "timestamp": datetime.utcnow().isoformat(),
        }
        res = requests.post(MAKE_WEBHOOK_URL, json=payload, timeout=30)
        if res.status_code == 200:
            print("  Make.com webhook sent successfully!")
            return True
        else:
            print(f"  Make.com error {res.status_code}: {res.text[:200]}")
            return False
    except Exception as e:
        print(f"  Webhook error: {e}")
        return False


# ─── Step 6: Report completion ──────────────────────────────────────────────

def report_complete(video_id: str, cloudinary_url: str, caption: str, success: bool):
    """Report completion back to WealthClaude server."""
    print("  Reporting completion...")
    try:
        payload = {
            "video_id": video_id,
            "cloudinary_url": cloudinary_url,
            "caption": caption,
            "status": "posted" if success else "error",
        }
        if not success:
            payload["error"] = "Processing failed"

        res = requests.post(
            f"{API_URL}/api/video/complete",
            headers=HEADERS,
            json=payload,
            timeout=15,
        )
        print(f"  Server response: {res.status_code}")
    except Exception as e:
        print(f"  Report error: {e}")


# ─── Cleanup ────────────────────────────────────────────────────────────────

def cleanup(file_path: str | None):
    """Delete downloaded file."""
    if file_path and Path(file_path).exists():
        try:
            Path(file_path).unlink()
            print(f"  Cleaned up: {file_path}")
        except Exception:
            pass


# ─── Process one video ──────────────────────────────────────────────────────

def process_one():
    """Process a single video from the queue."""
    video = poll_video()
    if not video:
        return False

    video_id = video["id"]
    source_url = video.get("source_url", "")
    existing_caption = video.get("text_content")

    if not source_url:
        print("  No source URL — skipping.")
        report_complete(video_id, "", "", False)
        return False

    # Download
    file_path = download_reel(source_url, video_id)
    if not file_path:
        report_complete(video_id, "", "", False)
        return False

    # Generate caption
    caption = generate_caption(source_url, existing_caption)

    # Upload to Cloudinary
    cloudinary_url = upload_to_cloudinary(file_path, video_id)
    if not cloudinary_url:
        cleanup(file_path)
        report_complete(video_id, "", caption, False)
        return False

    # Send to Make.com
    make_success = send_to_make(video_id, cloudinary_url, caption, source_url)

    # Report completion
    report_complete(video_id, cloudinary_url, caption, True)

    # Cleanup
    cleanup(file_path)

    print(f"[{now()}] ✓ Video {video_id} processed successfully!")
    return True


# ─── Helpers ────────────────────────────────────────────────────────────────

def now():
    return datetime.now().strftime("%H:%M:%S")


# ─── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("WealthClaude Video Processor")
    print("=" * 60)

    # Validate config
    missing = []
    if not CRON_SECRET:
        missing.append("CRON_SECRET")
    if missing:
        print(f"\nMissing required env vars: {', '.join(missing)}")
        print("Set them and try again.")
        sys.exit(1)

    if "--loop" in sys.argv:
        interval = 60
        print(f"\nRunning in loop mode (polling every {interval}s)")
        print(f"API: {API_URL}")
        print(f"Cloudinary: {'configured' if CLOUDINARY_CLOUD else 'NOT SET'}")
        print(f"Make.com: {'configured' if MAKE_WEBHOOK_URL else 'NOT SET'}")
        print(f"Groq: {'configured' if GROQ_API_KEY else 'NOT SET'}")
        print()

        while True:
            try:
                process_one()
            except Exception as e:
                print(f"[{now()}] Unexpected error: {e}")
            time.sleep(interval)
    else:
        print(f"\nProcessing one video...")
        print(f"API: {API_URL}")
        print()
        success = process_one()
        sys.exit(0 if success else 1)
