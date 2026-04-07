"""
YouTube Uploader Module
Handles YouTube API authentication and video uploads
"""

import os
import json
import pickle
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import Google API client
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False
    logger.warning(
        "Google API client not installed. Install with: "
        "pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client"
    )


class YouTubeUploader:
    """YouTube API client for uploading videos"""
    
    # Required OAuth scopes
    SCOPES = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.readonly'
    ]
    
    def __init__(
        self,
        credentials_file: str = "client_secrets.json",
        token_file: str = "youtube_token.pickle"
    ):
        """
        Initialize YouTube uploader
        
        Args:
            credentials_file: Path to Google OAuth client secrets JSON
            token_file: Path to store/load OAuth tokens
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.youtube = None
        self.credentials = None
        
        if not GOOGLE_API_AVAILABLE:
            logger.error("Google API libraries not available")
            return
        
        # Try to load existing credentials
        self._load_credentials()
    
    def _load_credentials(self):
        """Load or refresh OAuth credentials"""
        if not GOOGLE_API_AVAILABLE:
            return
        
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                self.credentials = pickle.load(token)
        
        # Refresh if expired
        if self.credentials and self.credentials.expired and self.credentials.refresh_token:
            try:
                self.credentials.refresh(Request())
                self._save_credentials()
            except Exception as e:
                logger.error(f"Failed to refresh credentials: {e}")
                self.credentials = None
        
        # Build YouTube service if credentials valid
        if self.credentials and self.credentials.valid:
            self._build_service()
    
    def _save_credentials(self):
        """Save credentials to file"""
        with open(self.token_file, 'wb') as token:
            pickle.dump(self.credentials, token)
    
    def _build_service(self):
        """Build YouTube API service"""
        if self.credentials:
            self.youtube = build('youtube', 'v3', credentials=self.credentials)
    
    def authenticate(self, open_browser: bool = True) -> bool:
        """
        Run OAuth flow to authenticate with YouTube
        
        Args:
            open_browser: Whether to open browser for auth
            
        Returns:
            True if authentication successful
        """
        if not GOOGLE_API_AVAILABLE:
            logger.error("Google API libraries not available")
            return False
        
        if not os.path.exists(self.credentials_file):
            logger.error(f"Credentials file not found: {self.credentials_file}")
            logger.info(
                "To set up YouTube API:\n"
                "1. Go to https://console.cloud.google.com/\n"
                "2. Create a project and enable YouTube Data API v3\n"
                "3. Create OAuth 2.0 credentials (Desktop app)\n"
                "4. Download the JSON and save as 'client_secrets.json'"
            )
            return False
        
        try:
            flow = InstalledAppFlow.from_client_secrets_file(
                self.credentials_file,
                self.SCOPES
            )
            
            if open_browser:
                self.credentials = flow.run_local_server(port=8080)
            else:
                self.credentials = flow.run_console()
            
            self._save_credentials()
            self._build_service()
            
            logger.info("✅ YouTube authentication successful!")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    def is_authenticated(self) -> bool:
        """Check if we have valid credentials"""
        return self.youtube is not None and self.credentials is not None and self.credentials.valid
    
    def get_channel_info(self) -> Optional[Dict[str, Any]]:
        """Get authenticated user's channel info"""
        if not self.is_authenticated():
            return None
        
        try:
            response = self.youtube.channels().list(
                part='snippet,statistics',
                mine=True
            ).execute()
            
            if response.get('items'):
                channel = response['items'][0]
                return {
                    'id': channel['id'],
                    'title': channel['snippet']['title'],
                    'description': channel['snippet'].get('description', ''),
                    'thumbnail': channel['snippet']['thumbnails']['default']['url'],
                    'subscriber_count': channel['statistics'].get('subscriberCount', 0),
                    'video_count': channel['statistics'].get('videoCount', 0),
                    'view_count': channel['statistics'].get('viewCount', 0)
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get channel info: {e}")
            return None
    
    def upload_video(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: List[str] = None,
        category_id: str = "22",  # 22 = People & Blogs, 25 = News & Politics
        privacy_status: str = "public",
        thumbnail_path: Optional[str] = None,
        scheduled_time: Optional[datetime] = None,
        is_short: bool = False
    ) -> Dict[str, Any]:
        """
        Upload a video to YouTube
        
        Args:
            video_path: Path to video file
            title: Video title
            description: Video description
            tags: List of tags
            category_id: YouTube category ID
            privacy_status: public, private, or unlisted
            thumbnail_path: Optional custom thumbnail
            scheduled_time: Optional scheduled publish time
            is_short: Whether this is a YouTube Short
            
        Returns:
            Dict with upload result
        """
        if not self.is_authenticated():
            return {"success": False, "error": "Not authenticated"}
        
        if not os.path.exists(video_path):
            return {"success": False, "error": f"Video file not found: {video_path}"}
        
        try:
            # Add #Shorts tag for Shorts
            if is_short:
                tags = tags or []
                if "#Shorts" not in tags and "Shorts" not in tags:
                    tags.insert(0, "#Shorts")
            
            # Prepare video metadata
            body = {
                'snippet': {
                    'title': title[:100],  # YouTube max title length
                    'description': description[:5000],  # YouTube max description length
                    'tags': tags[:500] if tags else [],  # YouTube tag limits
                    'categoryId': category_id
                },
                'status': {
                    'privacyStatus': privacy_status,
                    'selfDeclaredMadeForKids': False
                }
            }
            
            # Set scheduled publish time
            if scheduled_time and privacy_status == "private":
                body['status']['privacyStatus'] = "private"
                body['status']['publishAt'] = scheduled_time.isoformat() + "Z"
            
            # Create media upload object
            media = MediaFileUpload(
                video_path,
                chunksize=1024*1024,  # 1MB chunks
                resumable=True,
                mimetype='video/*'
            )
            
            # Upload video
            logger.info(f"Uploading: {title}")
            
            request = self.youtube.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media
            )
            
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    logger.info(f"Upload progress: {int(status.progress() * 100)}%")
            
            video_id = response['id']
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            
            logger.info(f"✅ Upload complete: {video_url}")
            
            # Upload thumbnail if provided
            if thumbnail_path and os.path.exists(thumbnail_path):
                self._upload_thumbnail(video_id, thumbnail_path)
            
            return {
                "success": True,
                "video_id": video_id,
                "video_url": video_url,
                "title": title
            }
            
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _upload_thumbnail(self, video_id: str, thumbnail_path: str) -> bool:
        """Upload custom thumbnail for video"""
        try:
            self.youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumbnail_path, mimetype='image/jpeg')
            ).execute()
            
            logger.info(f"✅ Thumbnail uploaded for video {video_id}")
            return True
            
        except Exception as e:
            logger.warning(f"Thumbnail upload failed: {e}")
            return False
    
    def update_video(
        self,
        video_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Update an existing video's metadata"""
        if not self.is_authenticated():
            return {"success": False, "error": "Not authenticated"}
        
        try:
            # Get current video data
            response = self.youtube.videos().list(
                part='snippet',
                id=video_id
            ).execute()
            
            if not response.get('items'):
                return {"success": False, "error": "Video not found"}
            
            snippet = response['items'][0]['snippet']
            
            # Update fields
            if title:
                snippet['title'] = title
            if description:
                snippet['description'] = description
            if tags:
                snippet['tags'] = tags
            
            # Update video
            self.youtube.videos().update(
                part='snippet',
                body={
                    'id': video_id,
                    'snippet': snippet
                }
            ).execute()
            
            return {"success": True, "video_id": video_id}
            
        except Exception as e:
            logger.error(f"Update failed: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_video(self, video_id: str) -> Dict[str, Any]:
        """Delete a video"""
        if not self.is_authenticated():
            return {"success": False, "error": "Not authenticated"}
        
        try:
            self.youtube.videos().delete(id=video_id).execute()
            return {"success": True, "video_id": video_id}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_video_stats(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get video statistics"""
        if not self.is_authenticated():
            return None
        
        try:
            response = self.youtube.videos().list(
                part='statistics,snippet',
                id=video_id
            ).execute()
            
            if response.get('items'):
                item = response['items'][0]
                stats = item.get('statistics', {})
                return {
                    'video_id': video_id,
                    'title': item['snippet']['title'],
                    'views': int(stats.get('viewCount', 0)),
                    'likes': int(stats.get('likeCount', 0)),
                    'comments': int(stats.get('commentCount', 0))
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return None
    
    def get_today_upload_count(self) -> int:
        """Get number of videos uploaded today"""
        if not self.is_authenticated():
            return 0
        
        try:
            # Get videos from today
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            response = self.youtube.search().list(
                part='id',
                forMine=True,
                type='video',
                publishedAfter=today.isoformat() + "Z",
                maxResults=50
            ).execute()
            
            return len(response.get('items', []))
            
        except Exception as e:
            logger.error(f"Failed to get upload count: {e}")
            return 0


# CLI usage
if __name__ == "__main__":
    import sys
    
    uploader = YouTubeUploader()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Authenticate: python youtube_uploader.py auth")
        print("  Channel info: python youtube_uploader.py info")
        print("  Upload video: python youtube_uploader.py upload <video_path> '<title>'")
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "auth":
        success = uploader.authenticate()
        if success:
            info = uploader.get_channel_info()
            if info:
                print(f"Connected to channel: {info['title']}")
                print(f"Subscribers: {info['subscriber_count']}")
    
    elif action == "info":
        if uploader.is_authenticated():
            info = uploader.get_channel_info()
            print(json.dumps(info, indent=2))
        else:
            print("Not authenticated. Run 'python youtube_uploader.py auth' first.")
    
    elif action == "upload" and len(sys.argv) >= 4:
        if not uploader.is_authenticated():
            print("Not authenticated. Run 'python youtube_uploader.py auth' first.")
            sys.exit(1)
        
        result = uploader.upload_video(
            video_path=sys.argv[2],
            title=sys.argv[3],
            description="Uploaded via WealthClaude Video Studio"
        )
        print(json.dumps(result, indent=2))
    
    else:
        print("Invalid arguments")
