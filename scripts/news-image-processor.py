"""
News Image Processor — Local automation script.
Polls the WealthClaude API for queued news images,
screenshots them with Playwright, uploads to Cloudinary,
and sends to Make.com for Instagram posting.

Same pattern as youtube-processor but for news images.

Setup:
  pip install playwright python-dotenv requests cloudinary
  playwright install chromium

Usage:
  python news-image-processor.py          # Run once
  python news-image-processor.py --loop   # Poll continuously
"""

import os
import sys
import time
import json
import base64
import argparse
import requests
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Config
API_BASE = os.getenv('API_BASE_URL', 'https://www.wealthclaude.com')
CRON_SECRET = os.getenv('CRON_SECRET', '')
CLOUDINARY_URL = os.getenv('CLOUDINARY_URL', '')
OUTPUT_DIR = Path(os.getenv('NEWS_OUTPUT_DIR', './output/news-images'))
POLL_INTERVAL = int(os.getenv('NEWS_POLL_INTERVAL', '300'))  # 5 min default

# Parse Cloudinary URL
CLOUD_NAME = ''
CLOUD_KEY = ''
CLOUD_SECRET = ''
if CLOUDINARY_URL:
    import re
    m = re.match(r'cloudinary://(\d+):([^@]+)@(.+)', CLOUDINARY_URL)
    if m:
        CLOUD_KEY, CLOUD_SECRET, CLOUD_NAME = m.groups()

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def log(msg: str):
    ts = datetime.now().strftime('%H:%M:%S')
    print(f"[{ts}] {msg}")


def poll_queue() -> dict | None:
    """Fetch next queued news image from API."""
    try:
        res = requests.get(
            f"{API_BASE}/api/social/news-queue?secret={CRON_SECRET}",
            timeout=30,
        )
        if res.status_code != 200:
            log(f"Poll error: {res.status_code} {res.text[:200]}")
            return None
        data = res.json()
        return data if data.get('post') else None
    except Exception as e:
        log(f"Poll exception: {e}")
        return None


def screenshot_html(html: str, width: int, height: int, scale: float, output_path: Path) -> bool:
    """Use Playwright to screenshot HTML string to PNG."""
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(
                viewport={'width': width, 'height': height},
                device_scale_factor=scale,
            )

            # Load HTML content
            page.set_content(html, wait_until='networkidle')

            # Wait a bit for fonts to load
            page.wait_for_timeout(2000)

            # Screenshot
            page.screenshot(path=str(output_path), type='png')
            browser.close()

        log(f"Screenshot saved: {output_path.name} ({output_path.stat().st_size // 1024}KB)")
        return True

    except ImportError:
        log("ERROR: playwright not installed. Run: pip install playwright && playwright install chromium")
        return False
    except Exception as e:
        log(f"Screenshot error: {e}")
        return False


def upload_to_cloudinary(image_path: Path) -> str | None:
    """Upload image to Cloudinary, return secure URL."""
    if not CLOUD_NAME:
        log("WARNING: CLOUDINARY_URL not configured, skipping upload")
        return None

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=CLOUD_NAME,
            api_key=CLOUD_KEY,
            api_secret=CLOUD_SECRET,
        )

        result = cloudinary.uploader.upload(
            str(image_path),
            folder='wealthclaude/news',
            resource_type='image',
        )

        url = result.get('secure_url')
        log(f"Cloudinary upload: {url}")
        return url

    except ImportError:
        log("WARNING: cloudinary package not installed. Run: pip install cloudinary")
        return None
    except Exception as e:
        log(f"Cloudinary error: {e}")
        return None


def complete_post(post_id: str, cloudinary_url: str | None, error: str | None = None):
    """Report completion back to API (which sends to Make.com)."""
    try:
        payload = {'post_id': post_id}
        if error:
            payload['status'] = 'error'
            payload['error'] = error
        elif cloudinary_url:
            payload['cloudinary_url'] = cloudinary_url
        else:
            payload['status'] = 'error'
            payload['error'] = 'No Cloudinary URL'

        res = requests.post(
            f"{API_BASE}/api/social/news-queue?secret={CRON_SECRET}",
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=30,
        )
        log(f"Complete: {res.status_code} — {res.json().get('success', False)}")
    except Exception as e:
        log(f"Complete error: {e}")


def process_one() -> bool:
    """Process one queued news image. Returns True if something was processed."""
    data = poll_queue()
    if not data:
        return False

    post = data['post']
    html = data['html']
    ss = data['screenshot']
    post_id = post['id']
    headline = post.get('headline', 'unknown')[:50]

    log(f"Processing: {headline}...")

    # 1. Screenshot
    safe_name = ''.join(c if c.isalnum() or c in '-_' else '_' for c in headline)
    output_path = OUTPUT_DIR / f"{safe_name}_{post['template_type']}.png"

    success = screenshot_html(
        html=html,
        width=ss['width'],
        height=ss['height'],
        scale=ss['scale'],
        output_path=output_path,
    )

    if not success:
        complete_post(post_id, None, error='Screenshot failed')
        return True

    # 2. Upload to Cloudinary
    cloudinary_url = upload_to_cloudinary(output_path)

    # 3. Report completion (API sends to Make.com → Instagram)
    complete_post(post_id, cloudinary_url)

    log(f"Done: {headline}")
    return True


def trigger_auto_news(count: int = 3):
    """Trigger the auto-news endpoint to fetch fresh CNBC articles."""
    log(f"Triggering auto-news (count={count})...")
    try:
        res = requests.post(
            f"{API_BASE}/api/social/auto-news?count={count}&secret={CRON_SECRET}",
            timeout=120,
        )
        if res.status_code == 200:
            data = res.json()
            log(f"Auto-news: {data.get('processed', 0)} articles queued")
            for article in data.get('articles', []):
                log(f"  → {article['headline'][:60]} (template {article['template']})")
        else:
            log(f"Auto-news error: {res.status_code} {res.text[:200]}")
    except Exception as e:
        log(f"Auto-news exception: {e}")


def main():
    parser = argparse.ArgumentParser(description='WealthClaude News Image Processor')
    parser.add_argument('--loop', action='store_true', help='Poll continuously')
    parser.add_argument('--fetch', action='store_true', help='Fetch fresh CNBC articles first')
    parser.add_argument('--count', type=int, default=3, help='Number of articles to fetch (default: 3)')
    args = parser.parse_args()

    print("=" * 55)
    print("  WEALTHCLAUDE NEWS IMAGE PROCESSOR")
    print("=" * 55)
    print(f"  API:        {API_BASE}")
    print(f"  Cloudinary: {'Configured' if CLOUD_NAME else 'NOT configured'}")
    print(f"  Output:     {OUTPUT_DIR.absolute()}")
    print(f"  Mode:       {'Loop' if args.loop else 'Single run'}")
    print("=" * 55)

    if not CRON_SECRET:
        log("ERROR: CRON_SECRET not set in .env")
        sys.exit(1)

    if args.fetch:
        trigger_auto_news(args.count)
        time.sleep(3)  # Wait for queue to populate

    if args.loop:
        log(f"Starting loop (poll every {POLL_INTERVAL}s)...")
        while True:
            try:
                processed = process_one()
                if not processed:
                    time.sleep(POLL_INTERVAL)
                else:
                    time.sleep(5)  # Short delay between items
            except KeyboardInterrupt:
                log("Stopped by user")
                break
            except Exception as e:
                log(f"Loop error: {e}")
                time.sleep(60)
    else:
        # Single run: process all queued items
        count = 0
        while process_one():
            count += 1
            time.sleep(2)
        if count == 0:
            log("No queued news images found")
        else:
            log(f"Processed {count} images")


if __name__ == '__main__':
    main()
