"""
Video Studio Processor
Main script that runs on your laptop/GitHub Actions
Polls Supabase for new videos and processes them
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
from video_processor import VideoProcessor
from ai_generator import AIGenerator, ThumbnailGenerator
from youtube_uploader import YouTubeUploader
from twitter_poster import TwitterPoster

# Load environment variables
load_dotenv()


class VideoStudioProcessor:
    """Main processor that coordinates all video processing"""
    
    def __init__(self):
        # Initialize Supabase
        self.supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_KEY')
        )
        
        # Initialize modules
        self.downloader = VideoDownloader()
        self.processor = VideoProcessor()
        self.ai = AIGenerator()
        self.thumbnail_gen = ThumbnailGenerator()
        
        # Initialize uploaders
        self.youtube = YouTubeUploader()
        self.twitter = TwitterPoster()
        
        # Settings
        self.poll_interval = int(os.getenv('POLL_INTERVAL_SECONDS', 30))
        self.max_posts_per_day = int(os.getenv('MAX_POSTS_PER_DAY', 10))
        self.max_shorts_per_video = int(os.getenv('MAX_SHORTS_PER_VIDEO', 5))
        self.logo_path = os.getenv('LOGO_PATH', './logo.png')
        self.output_dir = os.getenv('OUTPUT_DIR', './output')
        self.temp_dir = os.getenv('TEMP_DIR', './temp')
        
        # Create directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)
        
        print("=" * 50)
        print("VIDEO STUDIO PROCESSOR")
        print("=" * 50)
        print(f"Poll interval: {self.poll_interval}s")
        print(f"Max posts/day: {self.max_posts_per_day}")
        print(f"YouTube: {'✓ Connected' if self.youtube.is_authenticated() else '✗ Not connected'}")
        print(f"Twitter: {'✓ Connected' if self.twitter.is_connected() else '✗ Not connected'}")
        print("=" * 50)
    
    def get_settings(self) -> Dict[str, Any]:
        """Get settings from Supabase"""
        try:
            result = self.supabase.table('settings').select('*').limit(1).execute()
            if result.data:
                return result.data[0]
            return {}
        except Exception as e:
            print(f"Error getting settings: {e}")
            return {}
    
    def get_pending_items(self) -> List[Dict[str, Any]]:
        """Get items that need processing"""
        try:
            result = self.supabase.table('video_queue')\
                .select('*')\
                .eq('status', 'pending')\
                .order('created_at')\
                .limit(5)\
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting pending items: {e}")
            return []
    
    def get_approved_items(self) -> List[Dict[str, Any]]:
        """Get items ready to post"""
        try:
            result = self.supabase.table('video_queue')\
                .select('*')\
                .eq('status', 'approved')\
                .order('approved_at')\
                .limit(10)\
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting approved items: {e}")
            return []
    
    def get_today_post_count(self) -> int:
        """Get number of posts made today"""
        try:
            today = date.today().isoformat()
            result = self.supabase.table('posting_history')\
                .select('id', count='exact')\
                .gte('posted_at', today)\
                .execute()
            return result.count or 0
        except Exception as e:
            print(f"Error getting post count: {e}")
            return 0
    
    def update_item(self, item_id: str, updates: Dict[str, Any]):
        """Update a queue item"""
        try:
            self.supabase.table('video_queue')\
                .update(updates)\
                .eq('id', item_id)\
                .execute()
        except Exception as e:
            print(f"Error updating item {item_id}: {e}")
    
    def log_activity(self, action: str, description: str, status: str, video_id: str = None):
        """Log an activity"""
        try:
            self.supabase.table('activity_log').insert({
                'action': action,
                'description': description,
                'status': status,
                'video_id': video_id
            }).execute()
        except Exception as e:
            print(f"Error logging activity: {e}")
    
    def add_posting_history(
        self,
        video_id: str,
        platform: str,
        platform_post_id: str,
        platform_url: str,
        title: str
    ):
        """Add entry to posting history"""
        try:
            self.supabase.table('posting_history').insert({
                'video_id': video_id,
                'platform': platform,
                'platform_post_id': platform_post_id,
                'platform_url': platform_url,
                'title': title,
                'status': 'posted'
            }).execute()
        except Exception as e:
            print(f"Error adding posting history: {e}")
    
    def process_video(self, item: Dict[str, Any]) -> bool:
        """Process a single video (download, analyze, create clips)"""
        item_id = item['id']
        url = item['source_url']
        
        print(f"\n→ Processing: {url}")
        
        try:
            # Update status
            self.update_item(item_id, {'status': 'processing'})
            
            # Download video
            print("  Downloading...")
            video_path = self.downloader.download(url, self.temp_dir)
            if not video_path:
                raise Exception("Download failed")
            
            # Get video info
            info = self.downloader.get_info(url)
            title = info.get('title', 'Untitled')
            duration = info.get('duration', 0)
            
            # Get transcript if available
            print("  Getting transcript...")
            transcript = self.downloader.get_transcript(url, self.temp_dir)
            
            # Analyze with AI
            print("  Analyzing with AI...")
            analysis = {}
            if transcript:
                try:
                    analysis = self.ai.analyze_transcript(transcript, title)
                except TypeError:
                    try:
                        analysis = self.ai.analyze_transcript(transcript)
                    except:
                        analysis = {}
                except Exception as e:
                    print(f"  Warning: AI analysis failed: {e}")
                    analysis = {}
            
            # Generate AI metadata
            print("  Generating AI title and description...")
            try:
                ai_title = self.ai.generate_title(title, 'short' if duration < 60 else 'long')
            except:
                ai_title = [title]
            
            try:
                ai_tags = self.ai.generate_tags(title)
            except:
                ai_tags = ['video', 'content']
            
            try:
                original_desc = info.get('description', '')
                ai_description = self.ai.generate_description(
                    title, 
                    item.get('source_type', 'youtube'),
                    original_description=original_desc,
                    tags=ai_tags
                )
            except:
                ai_description = f"""📺 {title}

Watch this video to learn more!

👍 Like this video if you found it helpful!
🔔 Subscribe for more content like this!
💬 Share your thoughts in the comments!

#video #content #youtube"""
            
            # Get settings for branding options
            settings = self.get_settings()
            add_headline = settings.get('add_headline_overlay', True)  # Default: ON
            add_logo = settings.get('add_logo_to_videos', False)
            
            # Get the headline text (use AI title if available)
            headline_text = ai_title[0] if ai_title else title
            
            # Add HEADLINE OVERLAY (like Hook Global)
            if add_headline:
                print("  Adding headline overlay (WEALTH CLAUDE style)...")
                try:
                    headline_path = video_path.replace('.mp4', '_headline.mp4')
                    success = self.processor.add_text_headline(
                        input_path=video_path,
                        output_path=headline_path,
                        headline=headline_text,
                        brand_text="WEALTH CLAUDE",
                        duration=0  # Show for entire video (use e.g. 10 for first 10 seconds only)
                    )
                    if success:
                        video_path = headline_path
                        print("  ✓ Headline overlay added!")
                    else:
                        print("  Warning: Could not add headline overlay, using original video")
                except Exception as e:
                    print(f"  Warning: Could not add headline: {e}")
            
            # Add logo watermark (in corner) if enabled AND logo exists
            elif add_logo and os.path.exists(self.logo_path):
                print("  Adding logo watermark...")
                try:
                    processed_path = video_path.replace('.mp4', '_logo.mp4')
                    self.processor.add_logo(video_path, self.logo_path, processed_path)
                    video_path = processed_path
                except Exception as e:
                    print(f"  Warning: Could not add logo: {e}")
            
            # Determine video type
            video_type = 'short' if duration < 60 else 'long'
            
            # Check if auto-post is enabled
            auto_approve = settings.get('auto_post_enabled', False)
            new_status = 'approved' if auto_approve else 'ready'
            
            # Update item with processed info
            update_data = {
                'status': new_status,
                'source_title': title,
                'duration_seconds': duration,
                'video_type': video_type,
                'processed_video_url': video_path,
                'ai_title': ai_title[0] if ai_title else title,
                'ai_description': ai_description,
                'ai_tags': ai_tags,
                'processed_at': datetime.now().isoformat()
            }
            
            if auto_approve:
                update_data['approved_at'] = datetime.now().isoformat()
            
            self.update_item(item_id, update_data)
            
            self.log_activity(
                'video_processed',
                f'Video processed: {title[:50]}',
                'Auto-approved' if auto_approve else 'Ready',
                item_id
            )
            
            print(f"  ✓ Processed successfully")
            print(f"    Title: {headline_text[:60]}...")
            print(f"    Duration: {duration}s ({video_type})")
            if add_headline:
                print(f"    Headline: WEALTH CLAUDE | {headline_text[:40]}...")
            if auto_approve:
                print(f"    Status: Auto-approved (will post automatically)")
            return True
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            self.update_item(item_id, {
                'status': 'failed',
                'error_message': str(e)
            })
            return False
    
    def post_video(self, item: Dict[str, Any], settings: Dict[str, Any]) -> bool:
        """Post a video to all configured platforms"""
        item_id = item['id']
        title = item.get('ai_title') or item.get('source_title') or 'Untitled'
        description = item.get('ai_description') or ''
        video_path = item.get('processed_video_url')
        platforms = item.get('platforms', ['youtube'])
        
        print(f"\n→ Posting: {title[:50]}...")
        
        posted_to = []
        
        try:
            # Post to YouTube
            if 'youtube' in platforms and settings.get('youtube_connected'):
                print("  Posting to YouTube...")
                if self.youtube.is_authenticated():
                    result = self.youtube.upload_video(
                        video_path=video_path,
                        title=title[:100],
                        description=description,
                        tags=item.get('ai_tags', []),
                        category_id='25',  # News & Politics
                        privacy_status='public'
                    )
                    
                    # Extract video_id from result
                    video_id = None
                    if isinstance(result, dict):
                        video_id = result.get('id') or result.get('video_id')
                    elif isinstance(result, str):
                        video_id = result
                    
                    if video_id:
                        video_url = f"https://youtube.com/watch?v={video_id}"
                        print(f"  ✓ YouTube: {video_url}")
                        posted_to.append('youtube')
                        
                        self.add_posting_history(
                            item_id, 'youtube', video_id, video_url, title
                        )
                    else:
                        print(f"  ✓ YouTube: Posted (ID extraction pending)")
                        posted_to.append('youtube')
                else:
                    print("  ✗ YouTube: Not authenticated")
            
            # Post to Twitter
            if 'twitter' in platforms and settings.get('twitter_connected'):
                print("  Posting to Twitter...")
                if self.twitter.is_connected():
                    result = self.twitter.post_video(
                        video_path=video_path,
                        text=f"{title[:200]}\n\n#Finance #Stocks #News"
                    )
                    if result:
                        tweet_id = result.get('id') or result
                        print(f"  ✓ Twitter: Posted!")
                        posted_to.append('twitter')
                        
                        self.add_posting_history(
                            item_id, 'twitter', str(tweet_id), 
                            f"https://twitter.com/i/status/{tweet_id}", title
                        )
                else:
                    print("  ✗ Twitter: Not connected")
            
            # Update status to posted
            self.update_item(item_id, {
                'status': 'posted',
                'posted_at': datetime.now().isoformat()
            })
            
            self.log_activity(
                'video_posted',
                f'Posted to {", ".join(posted_to)}: {title[:50]}',
                'success',
                item_id
            )
            
            return len(posted_to) > 0
            
        except Exception as e:
            print(f"  ✗ Posting error: {e}")
            self.update_item(item_id, {
                'status': 'failed',
                'error_message': f"Posting failed: {str(e)}"
            })
            return False
    
    def run(self):
        """Main processing loop"""
        print("\n🚀 Starting processor loop...")
        
        while True:
            try:
                # Get current settings
                settings = self.get_settings()
                max_posts = settings.get('max_posts_per_day', self.max_posts_per_day)
                today_count = self.get_today_post_count()
                
                # Check for pending videos to process
                pending = self.get_pending_items()
                if pending:
                    print(f"\nFound {len(pending)} pending videos")
                    for item in pending:
                        self.process_video(item)
                
                # Check for approved videos to post (if under daily limit)
                if today_count < max_posts:
                    approved = self.get_approved_items()
                    if approved:
                        remaining = max_posts - today_count
                        print(f"\nFound {len(approved)} approved videos (limit: {remaining} remaining)")
                        for item in approved[:remaining]:
                            self.post_video(item, settings)
                            today_count += 1
                else:
                    print(f"\n⏸ Daily limit reached ({today_count}/{max_posts})")
                
            except KeyboardInterrupt:
                print("\n\n👋 Stopping processor...")
                break
            except Exception as e:
                print(f"\n❌ Error in main loop: {e}")
            
            print(f"⏳ Waiting {self.poll_interval}s...")
            time.sleep(self.poll_interval)


if __name__ == '__main__':
    processor = VideoStudioProcessor()
    processor.run()
