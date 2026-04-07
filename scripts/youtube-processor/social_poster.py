"""
Social Media Poster
Unified posting to Twitter, Instagram, LinkedIn
"""

import os
import requests
import tweepy
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TwitterPoster:
    """Post content to Twitter/X"""
    
    def __init__(self):
        self.api_key = os.getenv('TWITTER_API_KEY')
        self.api_secret = os.getenv('TWITTER_API_SECRET')
        self.access_token = os.getenv('TWITTER_ACCESS_TOKEN')
        self.access_token_secret = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
        self.bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        
        self.client = None
        self.api_v1 = None
        
        if self.is_configured():
            self._init_client()
    
    def is_configured(self) -> bool:
        """Check if Twitter credentials are configured"""
        return all([
            self.api_key,
            self.api_secret,
            self.access_token,
            self.access_token_secret
        ])
    
    def _init_client(self):
        """Initialize Twitter API clients"""
        try:
            # Twitter API v2 client (for posting tweets)
            self.client = tweepy.Client(
                bearer_token=self.bearer_token,
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret
            )
            
            # Twitter API v1.1 (for media uploads)
            auth = tweepy.OAuth1UserHandler(
                self.api_key,
                self.api_secret,
                self.access_token,
                self.access_token_secret
            )
            self.api_v1 = tweepy.API(auth)
            
            logger.info("Twitter client initialized")
        except Exception as e:
            logger.error(f"Error initializing Twitter client: {e}")
    
    def post_text(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Post a text-only tweet
        
        Args:
            text: Tweet text (max 280 characters)
            
        Returns:
            Dict with tweet_id and url, or None if failed
        """
        if not self.client:
            logger.error("Twitter client not initialized")
            return None
        
        try:
            # Truncate if too long
            if len(text) > 280:
                text = text[:277] + "..."
            
            response = self.client.create_tweet(text=text)
            tweet_id = response.data['id']
            
            logger.info(f"Tweet posted: {tweet_id}")
            return {
                'tweet_id': tweet_id,
                'url': f"https://twitter.com/i/status/{tweet_id}"
            }
        except Exception as e:
            logger.error(f"Error posting tweet: {e}")
            return None
    
    def post_with_image(self, text: str, image_path: str) -> Optional[Dict[str, Any]]:
        """
        Post a tweet with an image
        
        Args:
            text: Tweet text
            image_path: Path to image file OR URL
            
        Returns:
            Dict with tweet_id and url, or None if failed
        """
        if not self.client or not self.api_v1:
            logger.error("Twitter client not initialized")
            return None
        
        try:
            # Download image if it's a URL
            if image_path.startswith('http'):
                image_path = self._download_temp_file(image_path, 'image')
                if not image_path:
                    return None
            
            # Upload media using v1.1 API
            media = self.api_v1.media_upload(image_path)
            media_id = media.media_id
            
            # Truncate text if too long
            if len(text) > 280:
                text = text[:277] + "..."
            
            # Post tweet with media
            response = self.client.create_tweet(
                text=text,
                media_ids=[media_id]
            )
            tweet_id = response.data['id']
            
            logger.info(f"Tweet with image posted: {tweet_id}")
            return {
                'tweet_id': tweet_id,
                'url': f"https://twitter.com/i/status/{tweet_id}"
            }
        except Exception as e:
            logger.error(f"Error posting tweet with image: {e}")
            return None
    
    def post_with_video(self, text: str, video_path: str) -> Optional[Dict[str, Any]]:
        """
        Post a tweet with a video
        
        Args:
            text: Tweet text
            video_path: Path to video file
            
        Returns:
            Dict with tweet_id and url, or None if failed
        """
        if not self.client or not self.api_v1:
            logger.error("Twitter client not initialized")
            return None
        
        try:
            # Download video if it's a URL
            if video_path.startswith('http'):
                video_path = self._download_temp_file(video_path, 'video')
                if not video_path:
                    return None
            
            # Upload video using chunked upload
            media = self.api_v1.media_upload(
                video_path,
                media_category='tweet_video',
                chunked=True
            )
            media_id = media.media_id
            
            # Wait for processing
            self._wait_for_media_processing(media_id)
            
            # Truncate text if too long
            if len(text) > 280:
                text = text[:277] + "..."
            
            # Post tweet with media
            response = self.client.create_tweet(
                text=text,
                media_ids=[media_id]
            )
            tweet_id = response.data['id']
            
            logger.info(f"Tweet with video posted: {tweet_id}")
            return {
                'tweet_id': tweet_id,
                'url': f"https://twitter.com/i/status/{tweet_id}"
            }
        except Exception as e:
            logger.error(f"Error posting tweet with video: {e}")
            return None
    
    def _download_temp_file(self, url: str, file_type: str) -> Optional[str]:
        """Download a file from URL to temp location"""
        try:
            response = requests.get(url, timeout=60)
            if response.status_code == 200:
                ext = 'jpg' if file_type == 'image' else 'mp4'
                temp_path = f"./temp/twitter_upload_{datetime.now().timestamp()}.{ext}"
                os.makedirs('./temp', exist_ok=True)
                with open(temp_path, 'wb') as f:
                    f.write(response.content)
                return temp_path
            return None
        except Exception as e:
            logger.error(f"Error downloading file: {e}")
            return None
    
    def _wait_for_media_processing(self, media_id: int, max_wait: int = 60):
        """Wait for video processing to complete"""
        import time
        waited = 0
        while waited < max_wait:
            try:
                status = self.api_v1.get_media_upload_status(media_id)
                state = status.processing_info.get('state')
                if state == 'succeeded':
                    return True
                elif state == 'failed':
                    return False
                time.sleep(5)
                waited += 5
            except:
                return True  # Assume success if can't check
        return True


class InstagramPoster:
    """Post content to Instagram (placeholder for future implementation)"""
    
    def __init__(self):
        self.access_token = os.getenv('INSTAGRAM_ACCESS_TOKEN')
        self.account_id = os.getenv('INSTAGRAM_ACCOUNT_ID')
    
    def is_configured(self) -> bool:
        """Check if Instagram credentials are configured"""
        return bool(self.access_token and self.account_id)
    
    def post_image(self, image_url: str, caption: str) -> Optional[Dict[str, Any]]:
        """Post an image to Instagram (requires Business Account)"""
        # TODO: Implement Instagram Graph API posting
        logger.warning("Instagram posting not yet implemented")
        return None
    
    def post_reel(self, video_url: str, caption: str) -> Optional[Dict[str, Any]]:
        """Post a reel to Instagram"""
        # TODO: Implement Instagram Reels posting
        logger.warning("Instagram Reels posting not yet implemented")
        return None


class LinkedInPoster:
    """Post content to LinkedIn (placeholder for future implementation)"""
    
    def __init__(self):
        self.access_token = os.getenv('LINKEDIN_ACCESS_TOKEN')
        self.person_id = os.getenv('LINKEDIN_PERSON_ID')
    
    def is_configured(self) -> bool:
        """Check if LinkedIn credentials are configured"""
        return bool(self.access_token and self.person_id)
    
    def post_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Post text to LinkedIn"""
        # TODO: Implement LinkedIn API posting
        logger.warning("LinkedIn posting not yet implemented")
        return None
    
    def post_with_image(self, text: str, image_url: str) -> Optional[Dict[str, Any]]:
        """Post with image to LinkedIn"""
        # TODO: Implement LinkedIn image posting
        logger.warning("LinkedIn image posting not yet implemented")
        return None


class SocialMediaPoster:
    """
    Unified social media poster
    Handles posting to multiple platforms with auto-formatting
    """
    
    def __init__(self):
        self.twitter = TwitterPoster()
        self.instagram = InstagramPoster()
        self.linkedin = LinkedInPoster()
        
        # Character limits per platform
        self.char_limits = {
            'twitter': 280,
            'instagram': 2200,
            'linkedin': 3000
        }
        
        # Hashtag limits per platform
        self.hashtag_limits = {
            'twitter': 5,      # Best practice (can use more)
            'instagram': 30,   # Max allowed
            'linkedin': 5      # Best practice
        }
    
    def get_connected_platforms(self) -> List[str]:
        """Get list of connected platforms"""
        platforms = []
        if self.twitter.is_configured():
            platforms.append('twitter')
        if self.instagram.is_configured():
            platforms.append('instagram')
        if self.linkedin.is_configured():
            platforms.append('linkedin')
        return platforms
    
    def format_text_for_platform(
        self,
        text: str,
        hashtags: List[str],
        platform: str
    ) -> str:
        """Format text with hashtags for specific platform"""
        
        # Limit hashtags per platform
        max_hashtags = self.hashtag_limits.get(platform, 5)
        hashtags = hashtags[:max_hashtags]
        
        # Format hashtags
        hashtag_str = ' '.join([f"#{tag.replace('#', '')}" for tag in hashtags])
        
        # Combine text and hashtags
        char_limit = self.char_limits.get(platform, 280)
        
        if platform == 'twitter':
            # Twitter: text + hashtags, truncate if needed
            full_text = f"{text}\n\n{hashtag_str}"
            if len(full_text) > char_limit:
                available = char_limit - len(hashtag_str) - 5  # 5 for \n\n...
                full_text = f"{text[:available]}...\n\n{hashtag_str}"
        elif platform == 'instagram':
            # Instagram: text + line break + hashtags
            full_text = f"{text}\n\n.\n.\n.\n{hashtag_str}"
        elif platform == 'linkedin':
            # LinkedIn: more professional, fewer hashtags
            full_text = f"{text}\n\n{hashtag_str}"
        else:
            full_text = f"{text}\n\n{hashtag_str}"
        
        return full_text
    
    def post(
        self,
        text: str,
        platforms: List[str],
        hashtags: List[str] = None,
        image_path: str = None,
        video_path: str = None
    ) -> Dict[str, Any]:
        """
        Post content to multiple platforms
        
        Args:
            text: Post text
            platforms: List of platforms to post to
            hashtags: List of hashtags (auto-formatted)
            image_path: Path/URL to image (optional)
            video_path: Path to video (optional)
            
        Returns:
            Dict with results per platform
        """
        results = {}
        hashtags = hashtags or []
        
        for platform in platforms:
            formatted_text = self.format_text_for_platform(text, hashtags, platform)
            
            try:
                if platform == 'twitter':
                    if video_path:
                        result = self.twitter.post_with_video(formatted_text, video_path)
                    elif image_path:
                        result = self.twitter.post_with_image(formatted_text, image_path)
                    else:
                        result = self.twitter.post_text(formatted_text)
                    
                    results['twitter'] = {
                        'success': bool(result),
                        'post_id': result.get('tweet_id') if result else None,
                        'url': result.get('url') if result else None
                    }
                
                elif platform == 'instagram':
                    # Placeholder for Instagram
                    results['instagram'] = {
                        'success': False,
                        'error': 'Instagram posting not yet implemented'
                    }
                
                elif platform == 'linkedin':
                    # Placeholder for LinkedIn
                    results['linkedin'] = {
                        'success': False,
                        'error': 'LinkedIn posting not yet implemented'
                    }
                    
            except Exception as e:
                results[platform] = {
                    'success': False,
                    'error': str(e)
                }
        
        return results


# For testing
if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()
    
    poster = SocialMediaPoster()
    print(f"Connected platforms: {poster.get_connected_platforms()}")
    
    # Test formatting
    text = "Bitcoin hits new all-time high as institutional adoption grows"
    hashtags = ['Bitcoin', 'Crypto', 'Finance', 'Investing']
    
    print("\nTwitter format:")
    print(poster.format_text_for_platform(text, hashtags, 'twitter'))
    
    print("\nInstagram format:")
    print(poster.format_text_for_platform(text, hashtags, 'instagram'))
