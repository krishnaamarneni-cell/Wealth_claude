"""
Video Processor - Process videos with FFmpeg
Add logos, headlines, create clips, resize, etc.
"""

import os
import subprocess
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VideoProcessor:
    """Process videos using FFmpeg"""
    
    def __init__(self):
        # Check if FFmpeg is available
        self.ffmpeg_available = self._check_ffmpeg()
        if not self.ffmpeg_available:
            logger.warning("FFmpeg not found. Video processing will be limited.")
    
    def _check_ffmpeg(self) -> bool:
        """Check if FFmpeg is installed"""
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                capture_output=True,
                text=True
            )
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
    def add_headline_overlay(self, input_path: str, overlay_path: str, 
                              output_path: str, duration: float = 0) -> bool:
        """
        Add a headline overlay to the entire video (or first N seconds)
        
        Args:
            input_path: Path to input video
            overlay_path: Path to overlay PNG (transparent)
            output_path: Path for output video
            duration: How long to show overlay (0 = entire video)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.ffmpeg_available:
            logger.error("FFmpeg not available")
            return False
        
        if not os.path.exists(input_path):
            logger.error(f"Input video not found: {input_path}")
            return False
        
        if not os.path.exists(overlay_path):
            logger.error(f"Overlay not found: {overlay_path}")
            return False
        
        try:
            if duration > 0:
                # Show overlay only for first N seconds
                filter_complex = (
                    f"[0:v][1:v]overlay=0:0:enable='between(t,0,{duration})'"
                )
            else:
                # Show overlay for entire video
                filter_complex = "[0:v][1:v]overlay=0:0"
            
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-i', overlay_path,
                '-filter_complex', filter_complex,
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            logger.info(f"Adding headline overlay to video...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"Headline overlay added: {output_path}")
                return True
            else:
                logger.error(f"FFmpeg error: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error adding headline overlay: {e}")
            return False
    
    def add_logo(self, input_path: str, logo_path: str, output_path: str, 
                 position: str = 'bottom_right', opacity: float = 0.7,
                 scale: float = 0.15) -> bool:
        """
        Add a logo watermark to a video
        
        Args:
            input_path: Path to input video
            logo_path: Path to logo image (PNG with transparency recommended)
            output_path: Path for output video
            position: Where to place logo (top_left, top_right, bottom_left, bottom_right)
            opacity: Logo opacity (0.0 to 1.0)
            scale: Logo size relative to video width (0.1 = 10% of video width)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.ffmpeg_available:
            logger.error("FFmpeg not available")
            return False
        
        if not os.path.exists(input_path):
            logger.error(f"Input video not found: {input_path}")
            return False
        
        if not os.path.exists(logo_path):
            logger.error(f"Logo not found: {logo_path}")
            return False
        
        # Position mapping
        positions = {
            'top_left': '10:10',
            'top_right': 'W-w-10:10',
            'bottom_left': '10:H-h-10',
            'bottom_right': 'W-w-10:H-h-10',
            'center': '(W-w)/2:(H-h)/2'
        }
        
        pos = positions.get(position, positions['bottom_right'])
        
        try:
            # Build FFmpeg command
            filter_complex = (
                f"[1:v]scale=iw*{scale}:-1,format=rgba,"
                f"colorchannelmixer=aa={opacity}[logo];"
                f"[0:v][logo]overlay={pos}"
            )
            
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-i', logo_path,
                '-filter_complex', filter_complex,
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            logger.info(f"Adding logo to video...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"Logo added successfully: {output_path}")
                return True
            else:
                logger.error(f"FFmpeg error: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error adding logo: {e}")
            return False
    
    def add_text_headline(self, input_path: str, output_path: str, 
                          headline: str, brand_text: str = "WEALTH CLAUDE",
                          duration: float = 0) -> bool:
        """
        Add a text headline directly using FFmpeg drawtext (no overlay image needed)
        Windows-compatible version without fontconfig dependency
        
        Args:
            input_path: Path to input video
            output_path: Path for output video
            headline: The headline text
            brand_text: The brand name
            duration: How long to show (0 = entire video)
        
        Returns:
            True if successful
        """
        if not self.ffmpeg_available:
            logger.error("FFmpeg not available")
            return False
        
        try:
            # Get video height first to calculate positions
            info = self.get_video_info(input_path)
            video_height = info.get('height', 360)
            video_width = info.get('width', 640)
            
            # Calculate bar dimensions based on video size
            bar_height = max(60, int(video_height * 0.12))  # 12% of video height
            bar_y = video_height - bar_height - 10  # 10px from bottom
            brand_box_width = max(180, int(video_width * 0.25))  # 25% of width
            
            # Font sizes based on video height
            brand_font_size = max(16, int(bar_height * 0.35))
            headline_font_size = max(18, int(bar_height * 0.40))
            
            # Text Y positions (centered in bar)
            text_y = bar_y + int((bar_height - brand_font_size) / 2)
            
            # Clean and escape text for FFmpeg
            # Remove problematic characters
            headline_clean = headline.upper()
            headline_clean = headline_clean.replace("'", "")
            headline_clean = headline_clean.replace('"', "")
            headline_clean = headline_clean.replace(":", " -")
            headline_clean = headline_clean.replace("\\", "")
            
            brand_clean = brand_text.replace("'", "").replace('"', "")
            
            # Truncate headline if too long
            max_chars = int((video_width - brand_box_width - 40) / (headline_font_size * 0.5))
            if len(headline_clean) > max_chars:
                headline_clean = headline_clean[:max_chars-3] + "..."
            
            if duration > 0:
                enable = f":enable='between(t,0,{duration})'"
            else:
                enable = ""
            
            # Build filter with explicit pixel values (no expressions)
            # This avoids the 'ih-68' parsing issue on Windows
            filter_complex = (
                # Draw dark green brand box
                f"drawbox=x=0:y={bar_y}:w={brand_box_width}:h={bar_height}:color=0x006400@0.9:t=fill{enable},"
                # Draw forest green headline box
                f"drawbox=x={brand_box_width}:y={bar_y}:w={video_width - brand_box_width}:h={bar_height}:color=0x228B22@0.85:t=fill{enable},"
                # Draw lime accent line at top
                f"drawbox=x=0:y={bar_y}:w={video_width}:h=3:color=0x32CD32@1:t=fill{enable},"
                # Draw brand text (WEALTH CLAUDE) - no fontfile, use default
                f"drawtext=text='{brand_clean}':fontcolor=white:fontsize={brand_font_size}:"
                f"x=15:y={text_y}{enable},"
                # Draw headline text
                f"drawtext=text='{headline_clean}':fontcolor=white:fontsize={headline_font_size}:"
                f"x={brand_box_width + 15}:y={text_y}{enable}"
            )
            
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-vf', filter_complex,
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            logger.info(f"Adding text headline overlay...")
            logger.info(f"Video: {video_width}x{video_height}, Bar at y={bar_y}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"Text headline added: {output_path}")
                return True
            else:
                logger.error(f"FFmpeg error: {result.stderr}")
                # Log more details for debugging
                logger.error(f"Filter used: {filter_complex[:200]}...")
                return False
                
        except Exception as e:
            logger.error(f"Error adding text headline: {e}")
            return False
    
    def create_clip(self, input_path: str, output_path: str,
                   start_time: float, duration: float) -> bool:
        """
        Create a clip from a video
        """
        if not self.ffmpeg_available:
            logger.error("FFmpeg not available")
            return False
        
        try:
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-ss', str(start_time),
                '-t', str(duration),
                '-c', 'copy',
                '-y',
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0
            
        except Exception as e:
            logger.error(f"Error creating clip: {e}")
            return False
    
    def resize_for_shorts(self, input_path: str, output_path: str) -> bool:
        """
        Resize video to YouTube Shorts format (9:16, 1080x1920)
        """
        if not self.ffmpeg_available:
            logger.error("FFmpeg not available")
            return False
        
        try:
            filter_complex = (
                "scale=1080:1920:force_original_aspect_ratio=decrease,"
                "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black"
            )
            
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-vf', filter_complex,
                '-c:a', 'copy',
                '-y',
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0
            
        except Exception as e:
            logger.error(f"Error resizing video: {e}")
            return False
    
    def get_video_info(self, video_path: str) -> dict:
        """Get video dimensions and duration"""
        info = {'width': 1920, 'height': 1080, 'duration': 0}
        
        if not self.ffmpeg_available:
            return info
        
        try:
            # Get duration
            cmd = [
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                video_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                info['duration'] = float(result.stdout.strip())
            
            # Get dimensions
            cmd = [
                'ffprobe',
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height',
                '-of', 'csv=p=0',
                video_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                parts = result.stdout.strip().split(',')
                if len(parts) >= 2:
                    info['width'] = int(parts[0])
                    info['height'] = int(parts[1])
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting video info: {e}")
            return info
    
    def get_duration(self, video_path: str) -> Optional[float]:
        """Get video duration in seconds"""
        info = self.get_video_info(video_path)
        return info.get('duration')


# For testing
if __name__ == '__main__':
    processor = VideoProcessor()
    print(f"FFmpeg available: {processor.ffmpeg_available}")
    
    # Test text headline (no image needed)
    if processor.ffmpeg_available:
        print("\nTo test headline overlay, run:")
        print('processor.add_text_headline("input.mp4", "output.mp4", "NVIDIA STOCK SURGES 15%")')
