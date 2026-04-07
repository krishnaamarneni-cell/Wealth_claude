"""
WealthClaude Video Studio - Main Pipeline
Orchestrates the complete video automation workflow
"""

import os
import json
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from enum import Enum

# Import our modules
from video_downloader import VideoDownloader
from video_processor import VideoProcessor
from ai_generator import AIGenerator, ThumbnailGenerator
from youtube_uploader import YouTubeUploader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PostingMode(Enum):
    REVIEW = "review"
    AUTO = "auto"


@dataclass
class VideoJob:
    """Represents a video processing job"""
    id: str
    source_url: str
    source_name: str
    status: str
    title: str = ""
    description: str = ""
    download_path: str = ""
    processed_path: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()


class VideoPipeline:
    """Main orchestrator for video automation"""
    
    def __init__(
        self,
        work_dir: str = "./video_studio",
        logo_path: Optional[str] = None,
        groq_api_key: Optional[str] = None,
        posting_mode: PostingMode = PostingMode.REVIEW,
        max_shorts_per_day: int = 10
    ):
        """
        Initialize the video pipeline
        
        Args:
            work_dir: Working directory for downloads and processing
            logo_path: Path to logo PNG file
            groq_api_key: Groq API key for AI generation
            posting_mode: REVIEW (manual approval) or AUTO (auto-post)
            max_shorts_per_day: Maximum Shorts to post per day
        """
        self.work_dir = Path(work_dir)
        self.work_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        self.downloads_dir = self.work_dir / "downloads"
        self.processed_dir = self.work_dir / "processed"
        self.thumbnails_dir = self.work_dir / "thumbnails"
        self.queue_dir = self.work_dir / "queue"
        
        for dir in [self.downloads_dir, self.processed_dir, self.thumbnails_dir, self.queue_dir]:
            dir.mkdir(exist_ok=True)
        
        # Initialize modules
        self.downloader = VideoDownloader(str(self.downloads_dir))
        self.processor = VideoProcessor(str(self.processed_dir), logo_path)
        self.ai = AIGenerator(groq_api_key)
        self.thumbnail_gen = ThumbnailGenerator()
        self.uploader = YouTubeUploader()
        
        # Settings
        self.posting_mode = posting_mode
        self.max_shorts_per_day = max_shorts_per_day
        self.logo_path = logo_path
        
        # Queue (in production, this would be in Supabase)
        self.queue: List[Dict] = []
        self._load_queue()
    
    def _load_queue(self):
        """Load queue from disk"""
        queue_file = self.queue_dir / "queue.json"
        if queue_file.exists():
            with open(queue_file, 'r') as f:
                self.queue = json.load(f)
    
    def _save_queue(self):
        """Save queue to disk"""
        queue_file = self.queue_dir / "queue.json"
        with open(queue_file, 'w') as f:
            json.dump(self.queue, f, indent=2, default=str)
    
    def process_url(
        self,
        url: str,
        source_name: str = "Manual",
        create_shorts: bool = True,
        create_long: bool = True
    ) -> Dict[str, Any]:
        """
        Process a video URL through the full pipeline
        
        Args:
            url: Video URL to process
            source_name: Name of the source
            create_shorts: Whether to create Shorts from this video
            create_long: Whether to create a long-form video
            
        Returns:
            Dict with processing results
        """
        logger.info(f"🎬 Processing: {url}")
        
        results = {
            "url": url,
            "source": source_name,
            "shorts": [],
            "long_video": None,
            "status": "processing"
        }
        
        # Step 1: Download
        logger.info("📥 Downloading video...")
        download_result = self.downloader.download_video(url)
        
        if not download_result["success"]:
            results["status"] = "failed"
            results["error"] = download_result.get("error", "Download failed")
            return results
        
        video_path = download_result["file_path"]
        original_title = download_result.get("title", "Untitled")
        
        logger.info(f"✅ Downloaded: {original_title}")
        
        # Step 2: Get transcript for analysis
        logger.info("📝 Getting transcript...")
        transcript = self.downloader.get_transcript(url)
        
        # Step 3: AI Analysis (if we have transcript)
        suggested_clips = []
        if transcript:
            logger.info("🤖 Analyzing content...")
            analysis = self.ai.analyze_transcript(
                transcript,
                original_title,
                source_name
            )
            
            if analysis.get("success"):
                suggested_clips = analysis.get("suggested_shorts", [])
                results["analysis"] = {
                    "newsworthiness": analysis.get("newsworthiness_score"),
                    "summary": analysis.get("summary"),
                    "topics": analysis.get("topics", []),
                    "sentiment": analysis.get("sentiment")
                }
        
        # Step 4: Create Shorts
        if create_shorts:
            results["shorts"] = self._create_shorts(
                video_path,
                original_title,
                source_name,
                url,
                suggested_clips
            )
        
        # Step 5: Create branded long-form video
        if create_long:
            results["long_video"] = self._create_long_video(
                video_path,
                original_title,
                source_name,
                url
            )
        
        results["status"] = "completed"
        self._save_queue()
        
        return results
    
    def _create_shorts(
        self,
        video_path: str,
        original_title: str,
        source_name: str,
        source_url: str,
        suggested_clips: List[Dict]
    ) -> List[Dict]:
        """Create Shorts from video"""
        shorts = []
        
        # If no AI suggestions, create clips at regular intervals
        if not suggested_clips:
            duration = self.processor.get_duration(video_path)
            if duration and duration > 60:
                # Create 3 clips from different parts of the video
                suggested_clips = [
                    {"start_estimate": "0:00", "end_estimate": "0:45", "hook": "WATCH THIS"},
                    {"start_estimate": f"{int(duration/3)//60}:{int(duration/3)%60:02d}", 
                     "end_estimate": f"{(int(duration/3)+45)//60}:{(int(duration/3)+45)%60:02d}",
                     "hook": "KEY MOMENT"},
                    {"start_estimate": f"{int(duration*2/3)//60}:{int(duration*2/3)%60:02d}",
                     "end_estimate": f"{(int(duration*2/3)+45)//60}:{(int(duration*2/3)+45)%60:02d}",
                     "hook": "DON'T MISS THIS"}
                ]
        
        for i, clip in enumerate(suggested_clips[:5]):  # Max 5 Shorts per video
            try:
                # Parse time strings
                start = self._parse_time(clip.get("start_estimate", "0:00"))
                end = self._parse_time(clip.get("end_estimate", "0:45"))
                
                # Ensure Short is under 60 seconds
                if end - start > 60:
                    end = start + 55
                
                hook_text = clip.get("hook", "")
                
                logger.info(f"✂️ Creating Short {i+1}: {start}s - {end}s")
                
                # Create the Short
                short_result = self.processor.create_short(
                    video_path,
                    start,
                    end,
                    text_overlay=hook_text,
                    logo_path=self.logo_path
                )
                
                if not short_result["success"]:
                    continue
                
                # Generate title
                title_result = self.ai.generate_title(
                    original_title,
                    clip.get("why", hook_text),
                    source_name,
                    content_type="short"
                )
                
                generated_title = (
                    title_result.get("recommended") 
                    if title_result.get("success") 
                    else f"{source_name}: {original_title[:40]}..."
                )
                
                # Generate description
                desc_result = self.ai.generate_description(
                    generated_title,
                    original_title,
                    source_name,
                    source_url
                )
                
                # Generate tags
                tags_result = self.ai.generate_tags(
                    generated_title,
                    desc_result.get("description", ""),
                    topics=["finance", "markets", "news"]
                )
                
                short_data = {
                    "type": "short",
                    "id": f"short_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{i}",
                    "video_path": short_result["output_path"],
                    "title": generated_title,
                    "description": desc_result.get("description", ""),
                    "tags": tags_result.get("tags", []),
                    "source_url": source_url,
                    "source_name": source_name,
                    "clip_start": start,
                    "clip_end": end,
                    "hook_text": hook_text,
                    "status": "queued",
                    "created_at": datetime.utcnow().isoformat()
                }
                
                shorts.append(short_data)
                self.queue.append(short_data)
                
            except Exception as e:
                logger.error(f"Failed to create Short {i+1}: {e}")
        
        return shorts
    
    def _create_long_video(
        self,
        video_path: str,
        original_title: str,
        source_name: str,
        source_url: str
    ) -> Optional[Dict]:
        """Create branded long-form video"""
        try:
            logger.info("🎥 Creating branded long video...")
            
            # Add logo
            branded_result = self.processor.add_logo(
                video_path,
                self.logo_path,
                position="top_right"
            )
            
            if not branded_result["success"]:
                return None
            
            # Generate title
            title_result = self.ai.generate_title(
                original_title,
                "",
                source_name,
                content_type="long"
            )
            
            generated_title = (
                title_result.get("recommended")
                if title_result.get("success")
                else f"{source_name}: {original_title}"
            )
            
            # Generate description
            desc_result = self.ai.generate_description(
                generated_title,
                original_title,
                source_name,
                source_url
            )
            
            # Generate tags
            tags_result = self.ai.generate_tags(
                generated_title,
                desc_result.get("description", "")
            )
            
            # Create thumbnail from first frame
            thumbnail_path = str(self.thumbnails_dir / f"thumb_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.jpg")
            self.processor.extract_frame(video_path, 5, thumbnail_path)
            
            # Create better thumbnail with text
            if os.path.exists(thumbnail_path):
                self.thumbnail_gen.create_thumbnail(
                    thumbnail_path,
                    generated_title[:50],
                    thumbnail_path.replace('.jpg', '_final.jpg')
                )
            
            video_data = {
                "type": "long_video",
                "id": f"long_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "video_path": branded_result["output_path"],
                "title": generated_title,
                "description": desc_result.get("description", ""),
                "tags": tags_result.get("tags", []),
                "thumbnail_path": thumbnail_path,
                "source_url": source_url,
                "source_name": source_name,
                "status": "queued",
                "created_at": datetime.utcnow().isoformat()
            }
            
            self.queue.append(video_data)
            
            return video_data
            
        except Exception as e:
            logger.error(f"Failed to create long video: {e}")
            return None
    
    def _parse_time(self, time_str: str) -> int:
        """Parse time string (MM:SS or SS) to seconds"""
        try:
            parts = time_str.split(":")
            if len(parts) == 2:
                return int(parts[0]) * 60 + int(parts[1])
            return int(parts[0])
        except:
            return 0
    
    def get_queue(self, status: str = None) -> List[Dict]:
        """Get items in queue, optionally filtered by status"""
        if status:
            return [item for item in self.queue if item.get("status") == status]
        return self.queue
    
    def approve_item(self, item_id: str) -> bool:
        """Approve a queued item for posting"""
        for item in self.queue:
            if item.get("id") == item_id:
                item["status"] = "approved"
                self._save_queue()
                return True
        return False
    
    def skip_item(self, item_id: str) -> bool:
        """Skip/reject a queued item"""
        for item in self.queue:
            if item.get("id") == item_id:
                item["status"] = "skipped"
                self._save_queue()
                return True
        return False
    
    def post_item(self, item_id: str) -> Dict[str, Any]:
        """Post an approved item to YouTube"""
        item = next((i for i in self.queue if i.get("id") == item_id), None)
        
        if not item:
            return {"success": False, "error": "Item not found"}
        
        if not self.uploader.is_authenticated():
            return {"success": False, "error": "YouTube not authenticated"}
        
        # Check daily limit
        if item["type"] == "short":
            today_count = self.uploader.get_today_upload_count()
            if today_count >= self.max_shorts_per_day:
                return {"success": False, "error": f"Daily limit reached ({self.max_shorts_per_day})"}
        
        # Upload
        result = self.uploader.upload_video(
            video_path=item["video_path"],
            title=item["title"],
            description=item["description"],
            tags=item.get("tags", []),
            thumbnail_path=item.get("thumbnail_path"),
            is_short=(item["type"] == "short")
        )
        
        if result["success"]:
            item["status"] = "posted"
            item["youtube_video_id"] = result["video_id"]
            item["youtube_url"] = result["video_url"]
            item["posted_at"] = datetime.utcnow().isoformat()
            self._save_queue()
        
        return result
    
    def post_all_approved(self) -> List[Dict]:
        """Post all approved items"""
        results = []
        approved = self.get_queue(status="approved")
        
        for item in approved:
            result = self.post_item(item["id"])
            results.append({
                "id": item["id"],
                "title": item["title"],
                **result
            })
            
            # Small delay between uploads
            import time
            time.sleep(2)
        
        return results
    
    def run_auto_mode(self):
        """Run in auto mode - post queued items automatically"""
        if self.posting_mode != PostingMode.AUTO:
            logger.warning("Not in AUTO mode")
            return
        
        queued = self.get_queue(status="queued")
        posted_today = 0
        
        for item in queued:
            if item["type"] == "short" and posted_today >= self.max_shorts_per_day:
                logger.info(f"Daily Short limit reached ({self.max_shorts_per_day})")
                break
            
            # Auto-approve and post
            self.approve_item(item["id"])
            result = self.post_item(item["id"])
            
            if result.get("success"):
                posted_today += 1
                logger.info(f"✅ Posted: {item['title']}")
            else:
                logger.error(f"❌ Failed: {result.get('error')}")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="WealthClaude Video Studio")
    parser.add_argument("action", choices=["process", "queue", "approve", "post", "auto"],
                        help="Action to perform")
    parser.add_argument("--url", help="Video URL to process")
    parser.add_argument("--source", default="Manual", help="Source name")
    parser.add_argument("--id", help="Item ID for approve/post actions")
    parser.add_argument("--logo", help="Path to logo PNG")
    parser.add_argument("--mode", choices=["review", "auto"], default="review",
                        help="Posting mode")
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = VideoPipeline(
        logo_path=args.logo,
        posting_mode=PostingMode.AUTO if args.mode == "auto" else PostingMode.REVIEW
    )
    
    if args.action == "process":
        if not args.url:
            print("❌ --url required for process action")
            return
        
        result = pipeline.process_url(args.url, args.source)
        print(json.dumps(result, indent=2, default=str))
    
    elif args.action == "queue":
        queue = pipeline.get_queue()
        print(f"\n📋 Queue ({len(queue)} items):\n")
        for item in queue:
            status_emoji = {
                "queued": "⏳",
                "approved": "✅",
                "posted": "🎉",
                "skipped": "⏭️",
                "failed": "❌"
            }.get(item["status"], "❓")
            
            print(f"{status_emoji} [{item['type']}] {item['id']}")
            print(f"   Title: {item['title'][:60]}...")
            print(f"   Status: {item['status']}")
            print()
    
    elif args.action == "approve":
        if not args.id:
            print("❌ --id required for approve action")
            return
        
        if pipeline.approve_item(args.id):
            print(f"✅ Approved: {args.id}")
        else:
            print(f"❌ Item not found: {args.id}")
    
    elif args.action == "post":
        if args.id:
            result = pipeline.post_item(args.id)
        else:
            results = pipeline.post_all_approved()
            result = {"posted": len([r for r in results if r.get("success")])}
        
        print(json.dumps(result, indent=2, default=str))
    
    elif args.action == "auto":
        pipeline.run_auto_mode()


if __name__ == "__main__":
    main()
