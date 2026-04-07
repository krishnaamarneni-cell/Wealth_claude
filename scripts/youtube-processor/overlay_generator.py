"""
WealthClaude Overlay Generator
Creates dynamic headline overlays for videos
"""

import os
from PIL import Image, ImageDraw, ImageFont
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OverlayGenerator:
    """Generate branded overlays with dynamic headlines"""
    
    def __init__(self):
        # WealthClaude brand colors
        self.primary_color = (34, 139, 34)  # Forest Green
        self.secondary_color = (0, 100, 0)   # Dark Green
        self.text_color = (255, 255, 255)    # White
        self.accent_color = (50, 205, 50)    # Lime Green
        
        # Default video dimensions (1920x1080 for landscape, will scale)
        self.video_width = 1920
        self.video_height = 1080
        
        # Bar dimensions
        self.bar_height = 120
        self.brand_box_width = 300
        
    def create_headline_overlay(self, headline: str, output_path: str, 
                                 video_width: int = 1920, video_height: int = 1080) -> bool:
        """
        Create a headline overlay PNG with transparent background
        
        Args:
            headline: The headline text to display
            output_path: Where to save the PNG
            video_width: Width of the target video
            video_height: Height of the target video
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.video_width = video_width
            self.video_height = video_height
            
            # Scale bar height based on video size
            scale = video_height / 1080
            bar_height = int(self.bar_height * scale)
            brand_box_width = int(self.brand_box_width * scale)
            
            # Create transparent image (full video size)
            img = Image.new('RGBA', (video_width, video_height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Calculate positions (bottom of video)
            bar_top = video_height - bar_height - int(20 * scale)  # 20px from bottom
            
            # Draw the brand box (left side) - Dark green
            brand_box = [
                (0, bar_top),
                (brand_box_width, bar_top + bar_height)
            ]
            draw.rectangle(brand_box, fill=self.secondary_color + (240,))  # Slightly transparent
            
            # Draw the headline box (right of brand box) - Forest green with transparency
            headline_box = [
                (brand_box_width, bar_top),
                (video_width, bar_top + bar_height)
            ]
            draw.rectangle(headline_box, fill=self.primary_color + (220,))
            
            # Add accent line (thin lime green line at top of bar)
            accent_line = [
                (0, bar_top),
                (video_width, bar_top + int(4 * scale))
            ]
            draw.rectangle(accent_line, fill=self.accent_color + (255,))
            
            # Load fonts (use default if custom fonts not available)
            try:
                # Try to load a bold font for brand name
                brand_font_size = int(32 * scale)
                headline_font_size = int(36 * scale)
                
                # Try common font paths
                font_paths = [
                    "C:/Windows/Fonts/arialbd.ttf",  # Windows
                    "C:/Windows/Fonts/Arial Bold.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Linux
                    "/System/Library/Fonts/Helvetica.ttc",  # Mac
                ]
                
                brand_font = None
                headline_font = None
                
                for font_path in font_paths:
                    if os.path.exists(font_path):
                        brand_font = ImageFont.truetype(font_path, brand_font_size)
                        headline_font = ImageFont.truetype(font_path, headline_font_size)
                        break
                
                if not brand_font:
                    # Fallback to default
                    brand_font = ImageFont.load_default()
                    headline_font = ImageFont.load_default()
                    logger.warning("Using default font - text may appear small")
                    
            except Exception as e:
                logger.warning(f"Font loading error: {e}, using default")
                brand_font = ImageFont.load_default()
                headline_font = ImageFont.load_default()
            
            # Draw brand name "WEALTH CLAUDE"
            brand_text = "WEALTH CLAUDE"
            
            # Center the brand text in the brand box
            brand_bbox = draw.textbbox((0, 0), brand_text, font=brand_font)
            brand_text_width = brand_bbox[2] - brand_bbox[0]
            brand_text_height = brand_bbox[3] - brand_bbox[1]
            
            brand_x = (brand_box_width - brand_text_width) // 2
            brand_y = bar_top + (bar_height - brand_text_height) // 2
            
            draw.text((brand_x, brand_y), brand_text, fill=self.text_color, font=brand_font)
            
            # Draw headline text
            # Truncate if too long
            max_headline_width = video_width - brand_box_width - int(40 * scale)
            
            # Measure and truncate headline if needed
            headline_upper = headline.upper()
            headline_bbox = draw.textbbox((0, 0), headline_upper, font=headline_font)
            headline_text_width = headline_bbox[2] - headline_bbox[0]
            
            if headline_text_width > max_headline_width:
                # Truncate with ellipsis
                while headline_text_width > max_headline_width and len(headline_upper) > 10:
                    headline_upper = headline_upper[:-4] + "..."
                    headline_bbox = draw.textbbox((0, 0), headline_upper, font=headline_font)
                    headline_text_width = headline_bbox[2] - headline_bbox[0]
            
            headline_text_height = headline_bbox[3] - headline_bbox[1]
            headline_x = brand_box_width + int(20 * scale)
            headline_y = bar_top + (bar_height - headline_text_height) // 2
            
            draw.text((headline_x, headline_y), headline_upper, fill=self.text_color, font=headline_font)
            
            # Add small icon/emoji indicator (dollar sign for finance)
            # Draw a small circle with $ sign before brand name
            icon_size = int(24 * scale)
            icon_x = brand_x - icon_size - int(10 * scale)
            icon_y = brand_y + (brand_text_height - icon_size) // 2
            
            if icon_x > int(10 * scale):
                # Draw circle background
                circle_bbox = [
                    (icon_x, icon_y),
                    (icon_x + icon_size, icon_y + icon_size)
                ]
                draw.ellipse(circle_bbox, fill=self.accent_color + (255,))
                
                # Draw $ symbol
                try:
                    icon_font_size = int(16 * scale)
                    for font_path in font_paths:
                        if os.path.exists(font_path):
                            icon_font = ImageFont.truetype(font_path, icon_font_size)
                            break
                    else:
                        icon_font = ImageFont.load_default()
                    
                    dollar_bbox = draw.textbbox((0, 0), "$", font=icon_font)
                    dollar_width = dollar_bbox[2] - dollar_bbox[0]
                    dollar_height = dollar_bbox[3] - dollar_bbox[1]
                    dollar_x = icon_x + (icon_size - dollar_width) // 2
                    dollar_y = icon_y + (icon_size - dollar_height) // 2 - int(2 * scale)
                    draw.text((dollar_x, dollar_y), "$", fill=self.secondary_color, font=icon_font)
                except:
                    pass
            
            # Save the overlay
            img.save(output_path, 'PNG')
            logger.info(f"Created overlay: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating overlay: {e}")
            return False
    
    def create_simple_brand_watermark(self, output_path: str, size: int = 200) -> bool:
        """
        Create a simple brand watermark (just the logo/text for corner placement)
        
        Args:
            output_path: Where to save the PNG
            size: Size of the watermark
            
        Returns:
            True if successful
        """
        try:
            # Create transparent square image
            img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            # Draw rounded rectangle background
            padding = 10
            draw.rounded_rectangle(
                [(padding, padding), (size - padding, size - padding)],
                radius=15,
                fill=self.secondary_color + (200,)
            )
            
            # Add text
            try:
                font_paths = [
                    "C:/Windows/Fonts/arialbd.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                ]
                font = None
                for fp in font_paths:
                    if os.path.exists(fp):
                        font = ImageFont.truetype(fp, 24)
                        break
                if not font:
                    font = ImageFont.load_default()
            except:
                font = ImageFont.load_default()
            
            # Draw "WC" or "$" in center
            text = "$"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (size - text_width) // 2
            y = (size - text_height) // 2
            draw.text((x, y), text, fill=self.accent_color, font=font)
            
            img.save(output_path, 'PNG')
            logger.info(f"Created watermark: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating watermark: {e}")
            return False


# For testing
if __name__ == '__main__':
    generator = OverlayGenerator()
    
    # Test headline overlay
    generator.create_headline_overlay(
        headline="NVIDIA Stock Surges After Earnings Beat Expectations",
        output_path="test_overlay.png",
        video_width=1920,
        video_height=1080
    )
    
    # Test watermark
    generator.create_simple_brand_watermark("test_watermark.png")
    
    print("Test overlays created!")
