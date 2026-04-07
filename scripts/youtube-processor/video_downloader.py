"""
Video Downloader - Downloads videos from YouTube and other sources
Uses yt-dlp for downloading
"""

import os
import re
import json
import logging
from typing import Optional, Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import yt_dlp
except ImportError:
    logger.warning("yt-dlp not installed. Install with: pip install yt-dlp")
    yt_dlp = None


class VideoDownloader:
    """Downloads videos from YouTube and other sources"""
    
    def __init__(self, output_dir: str = "./temp"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def download(self, url: str, output_dir: str = None) -> Optional[str]:
        """
        Download a video from URL
        
        Args:
            url: Video URL (YouTube, etc.)
            output_dir: Directory to save the video (optional)
            
        Returns:
            Path to downloaded video file, or None if failed
        """
        if yt_dlp is None:
            logger.error("yt-dlp not installed")
            return None
            
        save_dir = output_dir or self.output_dir
        os.makedirs(save_dir, exist_ok=True)
        
        # Generate output filename
        output_template = os.path.join(save_dir, '%(id)s.%(ext)s')
        
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                # Extract info first
                info = ydl.extract_info(url, download=True)
                
                if info is None:
                    logger.error(f"Failed to extract info from {url}")
                    return None
                
                # Get the downloaded filename
                video_id = info.get('id', 'video')
                ext = info.get('ext', 'mp4')
                video_path = os.path.join(save_dir, f"{video_id}.{ext}")
                
                if os.path.exists(video_path):
                    logger.info(f"Downloaded: {video_path}")
                    return video_path
                else:
                    # Try to find the file
                    for f in os.listdir(save_dir):
                        if f.startswith(video_id):
                            video_path = os.path.join(save_dir, f)
                            logger.info(f"Downloaded: {video_path}")
                            return video_path
                    
                    logger.error(f"Downloaded file not found for {url}")
                    return None
                    
        except Exception as e:
            logger.error(f"Download failed for {url}: {e}")
            return None
    
    def get_info(self, url: str) -> Dict[str, Any]:
        """
        Get video information without downloading
        
        Args:
            url: Video URL
            
        Returns:
            Dictionary with video metadata
        """
        if yt_dlp is None:
            return {'error': 'yt-dlp not installed'}
            
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if info is None:
                    return {}
                
                return {
                    'id': info.get('id'),
                    'title': info.get('title', 'Untitled'),
                    'description': info.get('description', ''),
                    'duration': info.get('duration', 0),
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                    'channel': info.get('channel', info.get('uploader', '')),
                    'channel_id': info.get('channel_id', ''),
                    'upload_date': info.get('upload_date', ''),
                    'thumbnail': info.get('thumbnail', ''),
                    'categories': info.get('categories', []),
                    'tags': info.get('tags', []),
                }
                
        except Exception as e:
            logger.error(f"Failed to get info for {url}: {e}")
            return {'error': str(e)}
    
    def get_transcript(self, url: str, output_dir: str = None) -> Optional[str]:
        """
        Get video transcript/captions if available
        
        Args:
            url: Video URL
            output_dir: Directory to save transcript
            
        Returns:
            Transcript text or None
        """
        if yt_dlp is None:
            return None
            
        save_dir = output_dir or self.output_dir
        
        ydl_opts = {
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'skip_download': True,
            'quiet': True,
            'outtmpl': os.path.join(save_dir, '%(id)s'),
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                
                if info is None:
                    return None
                
                video_id = info.get('id', 'video')
                
                # Look for subtitle files
                for ext in ['.en.vtt', '.en.srt', '.vtt', '.srt']:
                    sub_path = os.path.join(save_dir, f"{video_id}{ext}")
                    if os.path.exists(sub_path):
                        with open(sub_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        # Clean up subtitle formatting
                        transcript = self._clean_subtitle(content)
                        return transcript
                
                return None
                
        except Exception as e:
            logger.error(f"Failed to get transcript for {url}: {e}")
            return None
    
    def _clean_subtitle(self, content: str) -> str:
        """Clean subtitle file content to plain text"""
        lines = content.split('\n')
        text_lines = []
        
        for line in lines:
            line = line.strip()
            # Skip timing lines, numbers, and empty lines
            if not line:
                continue
            if re.match(r'^\d+$', line):
                continue
            if re.match(r'^\d{2}:\d{2}', line):
                continue
            if line.startswith('WEBVTT'):
                continue
            if '-->' in line:
                continue
            
            # Remove HTML tags
            line = re.sub(r'<[^>]+>', '', line)
            
            if line:
                text_lines.append(line)
        
        return ' '.join(text_lines)


# For testing
if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python video_downloader.py <youtube_url>")
        print("Example: python video_downloader.py https://youtu.be/RYeJoFM5oH4")
        sys.exit(1)
    
    url = sys.argv[1]
    downloader = VideoDownloader('./temp')
    
    print(f"Getting info for: {url}")
    info = downloader.get_info(url)
    print(f"Title: {info.get('title')}")
    print(f"Duration: {info.get('duration')}s")
    
    print(f"\nDownloading...")
    path = downloader.download(url)
    if path:
        print(f"Downloaded to: {path}")
    else:
        print("Download failed")
