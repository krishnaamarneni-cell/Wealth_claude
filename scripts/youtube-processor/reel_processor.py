#!/usr/bin/env python3
"""
Instagram Reel Processor for WealthClaude
Downloads reels using yt-dlp and posts via Make.com

Same pattern as your YouTube processor!

Requirements:
    pip install yt-dlp requests python-dotenv supabase

Usage:
    # Process a single reel
    python reel_processor.py download "https://www.instagram.com/reel/ABC123/"
    
    # Process and post immediately
    python reel_processor.py post "https://www.instagram.com/reel/ABC123/"
    
    # Run as service (polls Supabase for pending reels)
    python reel_processor.py
"""

import os
import sys
import json
import time
import subprocess
import requests
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MAKE_WEBHOOK_URL = os.getenv("MAKE_WEBHOOK_URL", "https://hook.us2.make.com/0kaubvw2hfot76jkqa5nstppp5q7q953")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "60"))

# Directories
TEMP_DIR = Path("./temp/reels")
OUTPUT_DIR = Path("./output/reels")

# Create directories
TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def download_reel(url: str, output_dir: Path = TEMP_DIR) -> dict:
    """
    Download Instagram reel using yt-dlp
    
    Args:
        url: Instagram reel URL
        output_dir: Directory to save the video
    
    Returns:
        dict with video_path, thumbnail_path, metadata
    """
    print(f"📥 Downloading reel: {url}")
    
    # Extract shortcode from URL for filename
    shortcode = "reel"
    if "/reel/" in url:
        shortcode = url.split("/reel/")[1].split("/")[0].split("?")[0]
    elif "/p/" in url:
        shortcode = url.split("/p/")[1].split("/")[0].split("?")[0]
    
    output_template = str(output_dir / f"{shortcode}.%(ext)s")
    thumbnail_path = str(output_dir / f"{shortcode}_thumb.jpg")
    info_path = str(output_dir / f"{shortcode}_info.json")
    
    try:
        # Download video with yt-dlp
        cmd = [
            "yt-dlp",
            "--no-warnings",
            "-f", "best[ext=mp4]/best",  # Prefer mp4
            "-o", output_template,
            "--write-thumbnail",
            "--write-info-json",
            "--no-playlist",
            url
        ]
        
        print(f"   Running: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            print(f"   ❌ yt-dlp error: {result.stderr}")
            return None
        
        # Find the downloaded video file
        video_path = None
        for ext in [".mp4", ".webm", ".mkv"]:
            potential_path = output_dir / f"{shortcode}{ext}"
            if potential_path.exists():
                video_path = str(potential_path)
                break
        
        if not video_path:
            # Try to find any video file with the shortcode
            for f in output_dir.glob(f"{shortcode}*"):
                if f.suffix in [".mp4", ".webm", ".mkv"]:
                    video_path = str(f)
                    break
        
        if not video_path:
            print(f"   ❌ Video file not found after download")
            return None
        
        print(f"   ✅ Downloaded: {video_path}")
        
        # Find thumbnail
        thumb_path = None
        for f in output_dir.glob(f"{shortcode}*.jpg"):
            thumb_path = str(f)
            break
        for f in output_dir.glob(f"{shortcode}*.webp"):
            if not thumb_path:
                thumb_path = str(f)
            break
        
        # Load metadata from info json
        metadata = {}
        info_file = output_dir / f"{shortcode}.info.json"
        if info_file.exists():
            with open(info_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        
        return {
            "success": True,
            "video_path": video_path,
            "thumbnail_path": thumb_path,
            "shortcode": shortcode,
            "metadata": {
                "title": metadata.get("title", ""),
                "description": metadata.get("description", ""),
                "uploader": metadata.get("uploader", ""),
                "duration": metadata.get("duration", 0),
                "view_count": metadata.get("view_count", 0),
                "like_count": metadata.get("like_count", 0),
            }
        }
        
    except subprocess.TimeoutExpired:
        print(f"   ❌ Download timed out")
        return None
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None


def upload_to_hosting(video_path: str) -> str:
    """
    Upload video to a hosting service and return public URL
    
    For now, we'll use file.io (temporary hosting) or you can configure Cloudinary
    
    You can replace this with:
    - Cloudinary (recommended)
    - AWS S3
    - Your own server
    """
    print(f"   📤 Uploading to hosting service...")
    
    # Option 1: file.io (temporary, free, expires after download)
    try:
        with open(video_path, 'rb') as f:
            response = requests.post(
                'https://file.io',
                files={'file': f},
                data={'expires': '1d'}  # Expires in 1 day
            )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                url = data.get('link')
                print(f"   ✅ Uploaded: {url}")
                return url
    except Exception as e:
        print(f"   ⚠️ file.io upload failed: {e}")
    
    # Option 2: Cloudinary (if configured)
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if cloudinary_url:
        try:
            import cloudinary
            import cloudinary.uploader
            
            cloudinary.config(cloudinary_url=cloudinary_url)
            
            result = cloudinary.uploader.upload(
                video_path,
                resource_type="video",
                folder="wealthclaude/reels"
            )
            
            url = result.get('secure_url')
            print(f"   ✅ Uploaded to Cloudinary: {url}")
            return url
        except Exception as e:
            print(f"   ⚠️ Cloudinary upload failed: {e}")
    
    # Fallback: Return local path (won't work with Make.com)
    print(f"   ⚠️ No hosting configured. Video is local only.")
    return None


def generate_caption(original_caption: str = "", topic: str = "") -> str:
    """Generate an engaging caption using Groq AI"""
    
    if not GROQ_API_KEY:
        print("   ⚠️ No Groq API key, using original caption")
        return original_caption
    
    print("   🤖 Generating caption with AI...")
    
    context = original_caption or topic or "finance and investing"
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": """You are a social media expert for WealthClaude, a financial education platform.
Create engaging captions for Instagram Reels about finance and investing.

Rules:
- Start with a hook (question or bold statement)
- Keep it concise (under 200 characters before hashtags)
- Include a call-to-action (follow, save, share)
- Add relevant emojis
- Include 5-8 relevant hashtags at the end
- Make it engaging and shareable
- Focus on value and education"""
                    },
                    {
                        "role": "user",
                        "content": f"Create an engaging Instagram Reel caption. Context: {context}"
                    }
                ],
                "max_tokens": 300,
                "temperature": 0.8
            }
        )
        
        if response.status_code == 200:
            caption = response.json()["choices"][0]["message"]["content"]
            print(f"   ✅ Caption generated")
            return caption
        else:
            print(f"   ⚠️ Groq error: {response.status_code}")
            return original_caption
    except Exception as e:
        print(f"   ⚠️ Caption generation error: {e}")
        return original_caption


def post_to_make(platform: str, text: str, video_url: str, content_type: str = "reel") -> dict:
    """
    Send post to Make.com webhook
    """
    payload = {
        "platform": platform,
        "text": text,
        "video_url": video_url,
        "content_type": content_type,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        response = requests.post(
            MAKE_WEBHOOK_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200 or response.text == "Accepted":
            print(f"   ✅ Sent to Make.com for {platform}")
            return {"success": True, "response": response.text}
        else:
            print(f"   ❌ Make.com error: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return {"success": False, "error": str(e)}


def process_reel(url: str, platforms: list = None, generate_new_caption: bool = True) -> dict:
    """
    Full pipeline: Download → Upload → Generate Caption → Post
    """
    if platforms is None:
        platforms = ["instagram", "linkedin"]
    
    print(f"\n{'='*60}")
    print(f"🎬 Processing Reel: {url}")
    print(f"{'='*60}")
    
    # Step 1: Download
    download_result = download_reel(url)
    if not download_result or not download_result.get("success"):
        return {"success": False, "error": "Download failed"}
    
    video_path = download_result["video_path"]
    metadata = download_result.get("metadata", {})
    original_caption = metadata.get("description", "")
    
    # Step 2: Upload to hosting
    video_url = upload_to_hosting(video_path)
    if not video_url:
        return {"success": False, "error": "Upload failed - no hosting configured"}
    
    # Step 3: Generate caption
    if generate_new_caption:
        caption = generate_caption(original_caption)
    else:
        caption = original_caption
    
    print(f"\n📝 Caption:\n{caption[:200]}...")
    
    # Step 4: Post to platforms
    results = {}
    for platform in platforms:
        print(f"\n📤 Posting to {platform}...")
        result = post_to_make(platform, caption, video_url, "reel")
        results[platform] = result
        time.sleep(2)  # Small delay between platforms
    
    # Step 5: Save to Supabase
    try:
        supabase.table("social_posts").insert({
            "text_content": caption,
            "media_url": video_url,
            "platforms": platforms,
            "content_type": "reel",
            "status": "posted" if all(r.get("success") for r in results.values()) else "failed",
            "posted_at": datetime.utcnow().isoformat(),
            "post_results": json.dumps(results),
            "source_url": url
        }).execute()
    except Exception as e:
        print(f"   ⚠️ Could not save to Supabase: {e}")
    
    # Cleanup
    try:
        Path(video_path).unlink(missing_ok=True)
    except:
        pass
    
    all_success = all(r.get("success") for r in results.values())
    print(f"\n{'✅' if all_success else '❌'} Done! Results: {results}")
    
    return {
        "success": all_success,
        "video_url": video_url,
        "caption": caption,
        "results": results
    }


def process_pending_reels():
    """Process pending reel posts from Supabase"""
    try:
        # Get pending reel posts
        result = supabase.table("social_posts")\
            .select("*")\
            .eq("content_type", "reel")\
            .eq("status", "pending_approval")\
            .order("created_at", desc=False)\
            .limit(5)\
            .execute()
        
        posts = result.data
        
        if not posts:
            print("📭 No pending reels")
            return
        
        print(f"📬 Found {len(posts)} pending reel(s)")
        
        for post in posts:
            post_id = post["id"]
            source_url = post.get("source_url")
            platforms = post.get("platforms", ["instagram", "linkedin"])
            
            if not source_url:
                print(f"   ⚠️ No source URL for post {post_id[:8]}")
                continue
            
            # Update status to processing
            supabase.table("social_posts").update({
                "status": "posting"
            }).eq("id", post_id).execute()
            
            # Process the reel
            result = process_reel(source_url, platforms)
            
            # Update final status
            supabase.table("social_posts").update({
                "status": "posted" if result.get("success") else "failed",
                "media_url": result.get("video_url"),
                "text_content": result.get("caption"),
                "posted_at": datetime.utcnow().isoformat() if result.get("success") else None,
                "post_results": json.dumps(result.get("results", {}))
            }).eq("id", post_id).execute()
    
    except Exception as e:
        print(f"❌ Error processing pending reels: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main entry point"""
    print("=" * 60)
    print("🎬 WealthClaude Instagram Reel Processor")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "download" and len(sys.argv) > 2:
            # Just download, don't post
            url = sys.argv[2]
            result = download_reel(url)
            if result:
                print(f"\n✅ Downloaded to: {result['video_path']}")
                print(f"   Thumbnail: {result.get('thumbnail_path')}")
                print(f"   Metadata: {json.dumps(result.get('metadata', {}), indent=2)}")
            else:
                print("\n❌ Download failed")
        
        elif command == "post" and len(sys.argv) > 2:
            # Download and post
            url = sys.argv[2]
            platforms = sys.argv[3].split(",") if len(sys.argv) > 3 else ["instagram", "linkedin"]
            result = process_reel(url, platforms)
            print(f"\nResult: {json.dumps(result, indent=2)}")
        
        elif command == "caption" and len(sys.argv) > 2:
            # Just generate caption
            topic = " ".join(sys.argv[2:])
            caption = generate_caption(topic=topic)
            print(f"\n📝 Generated Caption:\n{caption}")
        
        else:
            print("""
Usage:
    python reel_processor.py download <instagram_url>   # Download only
    python reel_processor.py post <instagram_url>       # Download and post
    python reel_processor.py caption <topic>            # Generate caption
    python reel_processor.py                            # Run as service
            """)
    else:
        # Run as service - poll for pending reels
        print(f"Poll interval: {POLL_INTERVAL} seconds")
        print(f"Platforms: Instagram, LinkedIn")
        print("=" * 60)
        
        while True:
            try:
                process_pending_reels()
            except KeyboardInterrupt:
                print("\n👋 Stopping...")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
            
            print(f"\n⏳ Waiting {POLL_INTERVAL}s...")
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
