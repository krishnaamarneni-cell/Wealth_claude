"""
Video Studio Processor
Main script that runs on your laptop/GitHub Actions
Polls Supabase for approved YouTube videos and uploads them
"""

import os
import sys
import time
import json
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from supabase import create_client, Client

# Import our modules
from video_downloader import VideoDownloader
from youtube_uploader import YouTubeUploader

# Load environment variables
load_dotenv()


class VideoStudioProcessor:
    """Main processor that coordinates YouTube video processing"""

    def __init__(self):
        # Initialize Supabase
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

        if not supabase_url or not supabase_key:
            raise Exception("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Initialize modules
        self.downloader = VideoDownloader()
        self.youtube = YouTubeUploader()

        # Settings
        self.poll_interval = int(os.getenv('POLL_INTERVAL_SECONDS', 30))
        self.max_posts_per_day = int(os.getenv('MAX_POSTS_PER_DAY', 10))
        self.output_dir = os.getenv('OUTPUT_DIR', './output')
        self.temp_dir = os.getenv('TEMP_DIR', './temp')

        # Create directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

        print("=" * 50)
        print("VIDEO STUDIO PROCESSOR")
        print("=" * 50)
        print(f"Supabase: {supabase_url[:40]}...")
        print(f"Poll interval: {self.poll_interval}s")
        print(f"Max posts/day: {self.max_posts_per_day}")
        print(f"YouTube: {'Connected' if self.youtube.is_authenticated() else 'Not connected'}")
        print("=" * 50)

    def get_approved_items(self) -> List[Dict[str, Any]]:
        """Get YouTube items that are approved and ready to process"""
        try:
            result = self.supabase.table('video_queue')\
                .select('*')\
                .eq('status', 'approved')\
                .eq('content_type', 'youtube')\
                .order('created_at')\
                .limit(5)\
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting approved items: {e}")
            return []

    def update_item(self, item_id: str, updates: Dict[str, Any]):
        """Update a queue item"""
        try:
            updates['updated_at'] = datetime.now().isoformat()
            self.supabase.table('video_queue')\
                .update(updates)\
                .eq('id', item_id)\
                .execute()
        except Exception as e:
            print(f"Error updating item {item_id}: {e}")

    def log_activity(self, title: str, status: str, platform: str = 'youtube', video_id: str = None, url: str = None):
        """Log to video_activity_log"""
        try:
            entry = {
                'title': title[:80],
                'status': status,
                'platform': platform,
            }
            if video_id:
                entry['video_id'] = video_id
            if url:
                entry['url'] = url
            self.supabase.table('video_activity_log').insert(entry).execute()
        except Exception as e:
            print(f"Error logging activity: {e}")

    def process_and_upload(self, item: Dict[str, Any]) -> bool:
        """Download a video and upload it to YouTube"""
        item_id = item['id']
        url = item['source_url']
        title = item.get('title') or 'Untitled'

        print(f"\n-> Processing: {title[:60]}")
        print(f"   URL: {url}")

        try:
            # Mark as processing
            self.update_item(item_id, {'status': 'ready'})

            # Check YouTube auth
            if not self.youtube.is_authenticated():
                raise Exception("YouTube not authenticated. Run: python youtube_uploader.py auth")

            # Download video
            print("  Downloading...")
            video_path = self.downloader.download(url, self.temp_dir)
            if not video_path:
                raise Exception("Download failed")
            print(f"  [OK] Downloaded: {video_path}")

            # Get video info for metadata
            print("  Getting video info...")
            info = self.downloader.get_info(url)
            original_title = info.get('title', title)
            duration = info.get('duration', 0)
            description_text = info.get('description', '')
            tags = info.get('tags', [])

            # Use the title from the queue, or fall back to original
            upload_title = title if title != 'Untitled' else original_title

            # Build description
            if not description_text:
                description_text = f"{upload_title}\n\n#finance #investing #wealthclaude"

            # Determine if it's a Short
            is_short = duration > 0 and duration < 61

            # Add Shorts tag if applicable
            if is_short and '#Shorts' not in upload_title:
                upload_title = f"{upload_title} #Shorts"

            # Upload to YouTube
            print(f"  Uploading to YouTube (Short={is_short})...")
            result = self.youtube.upload_video(
                video_path=video_path,
                title=upload_title[:100],
                description=description_text[:5000],
                tags=tags[:30] if tags else ['finance', 'investing', 'wealthclaude'],
                category_id='22',
                privacy_status='public',
                is_short=is_short
            )

            if not result.get('success'):
                raise Exception(f"Upload failed: {result.get('error', 'Unknown error')}")

            video_id = result.get('video_id')
            video_url = result.get('video_url', '')

            print(f"  [OK] Uploaded! {video_url}")

            # Update queue item as posted
            self.update_item(item_id, {
                'status': 'posted',
                'url': video_url,
                'posted_at': datetime.now().isoformat()
            })

            # Log success
            self.log_activity(
                title=f"Uploaded: {upload_title[:60]}",
                status='posted',
                platform='youtube',
                url=video_url
            )

            # Cleanup temp file
            try:
                os.remove(video_path)
                print(f"  [OK] Cleaned up temp file")
            except:
                pass

            print(f"  [OK] Done! Video live at: {video_url}")
            return True

        except Exception as e:
            print(f"  [FAIL] Error: {e}")
            self.update_item(item_id, {'status': 'approved'})  # Reset to approved so it can retry
            self.log_activity(
                title=f"Failed: {title[:60]}",
                status='error',
                platform='youtube'
            )
            return False

    def run(self):
        """Main processing loop"""
        print("\nStarting processor loop...")

        while True:
            try:
                # Check for approved YouTube videos
                approved = self.get_approved_items()
                if approved:
                    print(f"\nFound {len(approved)} approved YouTube videos")
                    for item in approved:
                        self.process_and_upload(item)

            except KeyboardInterrupt:
                print("\n\nStopping processor...")
                break
            except Exception as e:
                print(f"\nError in main loop: {e}")

            print(f"Waiting {self.poll_interval}s...")
            time.sleep(self.poll_interval)


if __name__ == '__main__':
    processor = VideoStudioProcessor()
    processor.run()
