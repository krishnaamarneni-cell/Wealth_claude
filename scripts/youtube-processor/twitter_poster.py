"""
Twitter/X Posting Module for Video Studio
Posts videos and updates to Twitter/X
"""

import os
import tweepy
from typing import Optional, Dict, Any


class TwitterPoster:
    """Handle posting to Twitter/X"""
    
    def __init__(self):
        self.api_key = os.getenv('TWITTER_API_KEY')
        self.api_secret = os.getenv('TWITTER_API_SECRET')
        self.access_token = os.getenv('TWITTER_ACCESS_TOKEN')
        self.access_secret = os.getenv('TWITTER_ACCESS_SECRET')
        
        self.client = None
        self.api_v1 = None
        
        if self._has_credentials():
            self._init_client()
    
    def _has_credentials(self) -> bool:
        """Check if Twitter credentials are set"""
        return all([
            self.api_key,
            self.api_secret,
            self.access_token,
            self.access_secret
        ])
    
    def _init_client(self):
        """Initialize Twitter client"""
        try:
            # V2 client for tweets
            self.client = tweepy.Client(
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_secret
            )
            
            # V1.1 API for media uploads
            auth = tweepy.OAuthHandler(self.api_key, self.api_secret)
            auth.set_access_token(self.access_token, self.access_secret)
            self.api_v1 = tweepy.API(auth)
            
            print("✓ Twitter client initialized")
        except Exception as e:
            print(f"✗ Twitter init error: {e}")
            self.client = None
            self.api_v1 = None
    
    def is_connected(self) -> bool:
        """Check if Twitter is connected"""
        return self.client is not None
    
    def post_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Post a text-only tweet"""
        if not self.client:
            return None
        
        try:
            response = self.client.create_tweet(text=text)
            tweet_id = response.data['id']
            
            return {
                'id': tweet_id,
                'url': f"https://twitter.com/i/status/{tweet_id}"
            }
        except Exception as e:
            print(f"✗ Tweet error: {e}")
            return None
    
    def post_with_video(
        self,
        text: str,
        video_path: str,
        wait_for_async: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Post a tweet with video"""
        if not self.client or not self.api_v1:
            return None
        
        try:
            # Upload video using V1.1 API (chunked upload)
            print(f"  Uploading video to Twitter: {video_path}")
            media = self.api_v1.media_upload(
                video_path,
                media_category='tweet_video'
            )
            
            # Wait for processing if needed
            if wait_for_async and hasattr(media, 'processing_info'):
                import time
                while True:
                    status = self.api_v1.get_media_upload_status(media.media_id)
                    if status.processing_info.get('state') == 'succeeded':
                        break
                    elif status.processing_info.get('state') == 'failed':
                        raise Exception("Video processing failed")
                    time.sleep(status.processing_info.get('check_after_secs', 5))
            
            # Post tweet with media
            response = self.client.create_tweet(
                text=text,
                media_ids=[media.media_id]
            )
            
            tweet_id = response.data['id']
            
            return {
                'id': tweet_id,
                'url': f"https://twitter.com/i/status/{tweet_id}"
            }
        except Exception as e:
            print(f"✗ Tweet with video error: {e}")
            return None
    
    def post_with_image(
        self,
        text: str,
        image_path: str
    ) -> Optional[Dict[str, Any]]:
        """Post a tweet with image (thumbnail)"""
        if not self.client or not self.api_v1:
            return None
        
        try:
            # Upload image
            media = self.api_v1.media_upload(image_path)
            
            # Post tweet with media
            response = self.client.create_tweet(
                text=text,
                media_ids=[media.media_id]
            )
            
            tweet_id = response.data['id']
            
            return {
                'id': tweet_id,
                'url': f"https://twitter.com/i/status/{tweet_id}"
            }
        except Exception as e:
            print(f"✗ Tweet with image error: {e}")
            return None
    
    def get_me(self) -> Optional[Dict[str, Any]]:
        """Get authenticated user info"""
        if not self.client:
            return None
        
        try:
            response = self.client.get_me()
            return {
                'id': response.data.id,
                'username': response.data.username,
                'name': response.data.name
            }
        except Exception as e:
            print(f"✗ Get user error: {e}")
            return None


# CLI for testing
if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    poster = TwitterPoster()
    
    if poster.is_connected():
        user = poster.get_me()
        if user:
            print(f"Connected as: @{user['username']}")
        
        # Test post (comment out in production)
        # result = poster.post_text("Testing Video Studio integration!")
        # if result:
        #     print(f"Posted: {result['url']}")
    else:
        print("Twitter not connected. Check your .env file.")
