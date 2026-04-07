"""
Fal.ai Image Generator
Generate AI images for social media posts
"""

import os
import requests
import logging
from typing import Optional, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FalImageGenerator:
    """Generate images using Fal.ai API"""
    
    def __init__(self):
        self.api_key = os.getenv('FAL_API_KEY')
        self.base_url = "https://fal.run"
        
        # Default model (fast and cheap)
        self.model = "fal-ai/fast-sdxl"
        
        # WealthClaude brand colors
        self.brand_colors = {
            'primary': '#228B22',      # Forest Green
            'secondary': '#006400',    # Dark Green
            'accent': '#32CD32',        # Lime Green
            'white': '#FFFFFF'
        }
        
        # Template style prompts
        self.templates = {
            'quote_card': {
                'style': "minimalist quote card design, clean typography, professional, centered text area, gradient background with green tones, modern, sleek",
                'negative': "cluttered, busy, multiple images, faces, people"
            },
            'breaking_news': {
                'style': "breaking news graphic, bold headlines style, professional news broadcast look, red and white accents, urgent, modern news design, clean layout",
                'negative': "cartoon, anime, cluttered, unprofessional"
            },
            'meme': {
                'style': "viral meme format, bold impact font style, humorous, internet culture, shareable, eye-catching, social media optimized",
                'negative': "offensive, inappropriate, low quality"
            },
            'professional': {
                'style': "professional business graphic, corporate design, clean modern aesthetic, green color scheme, trustworthy, finance themed, sleek minimalist",
                'negative': "cartoon, childish, unprofessional, cluttered"
            },
            'market_update': {
                'style': "financial market graphic, stock chart aesthetic, professional trading desk look, green and white colors, data visualization style, modern finance",
                'negative': "cartoon, unprofessional, cluttered"
            }
        }
        
        # Platform aspect ratios
        self.aspect_ratios = {
            'twitter': {'width': 1200, 'height': 675},      # 16:9
            'instagram_square': {'width': 1080, 'height': 1080},  # 1:1
            'instagram_portrait': {'width': 1080, 'height': 1350}, # 4:5
            'instagram_story': {'width': 1080, 'height': 1920},    # 9:16
            'linkedin': {'width': 1200, 'height': 627},     # 1.91:1
            'youtube_thumbnail': {'width': 1280, 'height': 720},  # 16:9
        }
    
    def is_connected(self) -> bool:
        """Check if Fal.ai API key is configured"""
        return bool(self.api_key)
    
    def generate_image(
        self,
        prompt: str,
        template: str = 'professional',
        platform: str = 'twitter',
        include_branding: bool = True,
        custom_style: str = None
    ) -> Optional[str]:
        """
        Generate an image using Fal.ai
        
        Args:
            prompt: Description of what to generate
            template: Style template ('quote_card', 'breaking_news', 'meme', 'professional')
            platform: Target platform for aspect ratio
            include_branding: Whether to include WealthClaude branding hints
            custom_style: Override template style
            
        Returns:
            URL of generated image, or None if failed
        """
        if not self.api_key:
            logger.error("Fal.ai API key not configured")
            return None
        
        try:
            # Get template style
            template_config = self.templates.get(template, self.templates['professional'])
            style_prompt = custom_style or template_config['style']
            negative_prompt = template_config.get('negative', '')
            
            # Get dimensions for platform
            dimensions = self.aspect_ratios.get(platform, self.aspect_ratios['twitter'])
            
            # Build full prompt
            if include_branding:
                branding = "green color scheme, professional finance brand, WealthClaude style"
                full_prompt = f"{prompt}, {style_prompt}, {branding}"
            else:
                full_prompt = f"{prompt}, {style_prompt}"
            
            logger.info(f"Generating image with prompt: {full_prompt[:100]}...")
            
            # Call Fal.ai API
            response = requests.post(
                f"{self.base_url}/{self.model}",
                headers={
                    "Authorization": f"Key {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "prompt": full_prompt,
                    "negative_prompt": negative_prompt,
                    "image_size": {
                        "width": dimensions['width'],
                        "height": dimensions['height']
                    },
                    "num_images": 1,
                    "enable_safety_checker": True
                },
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                images = result.get('images', [])
                if images:
                    image_url = images[0].get('url')
                    logger.info(f"Image generated successfully: {image_url[:50]}...")
                    return image_url
                else:
                    logger.error("No images in response")
                    return None
            else:
                logger.error(f"Fal.ai API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error generating image: {e}")
            return None
    
    def generate_quote_card(
        self,
        quote_text: str,
        author: str = None,
        platform: str = 'twitter'
    ) -> Optional[str]:
        """Generate a quote card image"""
        prompt = f"inspirational quote card with space for text overlay"
        if author:
            prompt += f", attributed to {author}"
        return self.generate_image(prompt, template='quote_card', platform=platform)
    
    def generate_breaking_news(
        self,
        headline: str,
        platform: str = 'twitter'
    ) -> Optional[str]:
        """Generate a breaking news style image"""
        prompt = f"breaking news graphic background for headline: {headline[:50]}"
        return self.generate_image(prompt, template='breaking_news', platform=platform)
    
    def generate_market_update(
        self,
        topic: str,
        direction: str = 'neutral',  # 'up', 'down', 'neutral'
        platform: str = 'twitter'
    ) -> Optional[str]:
        """Generate a market update style image"""
        direction_style = {
            'up': 'green upward arrows, bullish, positive trend',
            'down': 'red downward arrows, bearish, declining trend',
            'neutral': 'balanced, stable, sideways movement'
        }
        prompt = f"financial market graphic about {topic}, {direction_style.get(direction, '')}"
        return self.generate_image(prompt, template='market_update', platform=platform)
    
    def generate_meme(
        self,
        concept: str,
        platform: str = 'twitter'
    ) -> Optional[str]:
        """Generate a meme style image"""
        prompt = f"viral meme about {concept}, funny, shareable"
        return self.generate_image(prompt, template='meme', platform=platform)
    
    def get_available_templates(self) -> Dict[str, str]:
        """Get list of available templates"""
        return {
            'quote_card': 'Text on branded background - great for quotes and tips',
            'breaking_news': 'News headline style - for urgent updates',
            'meme': 'Casual/viral style - for engagement',
            'professional': 'Clean corporate - for announcements',
            'market_update': 'Stock/chart aesthetic - for market news'
        }
    
    def get_platform_dimensions(self) -> Dict[str, Dict[str, int]]:
        """Get dimensions for each platform"""
        return self.aspect_ratios


# For testing
if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()
    
    generator = FalImageGenerator()
    print(f"Fal.ai connected: {generator.is_connected()}")
    print(f"Available templates: {generator.get_available_templates()}")
    
    if generator.is_connected():
        # Test generation
        url = generator.generate_image(
            prompt="stock market rising, bullish sentiment",
            template='professional',
            platform='twitter'
        )
        print(f"Generated image: {url}")
