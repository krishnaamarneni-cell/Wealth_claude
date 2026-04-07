"""
Social Media Processor
Handles AI content generation and multi-platform posting
"""

import os
import sys
import time
from datetime import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from supabase import create_client, Client

# Import our modules
from social_poster import SocialMediaPoster
from fal_image_generator import FalImageGenerator
from ai_generator import AIGenerator

# Load environment variables
load_dotenv()


class SocialMediaProcessor:
    """Main processor for social media content"""
    
    def __init__(self):
        # Initialize Supabase
        self.supabase: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_KEY')
        )
        
        # Initialize modules
        self.poster = SocialMediaPoster()
        self.image_gen = FalImageGenerator()
        self.ai = AIGenerator()
        
        # Settings
        self.poll_interval = int(os.getenv('POLL_INTERVAL_SECONDS', 30))
        
        print("=" * 50)
        print("SOCIAL MEDIA PROCESSOR")
        print("=" * 50)
        print(f"Poll interval: {self.poll_interval}s")
        print(f"Connected platforms: {self.poster.get_connected_platforms()}")
        print(f"Fal.ai (images): {'✓ Connected' if self.image_gen.is_connected() else '✗ Not connected'}")
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
    
    def get_pending_posts(self) -> List[Dict[str, Any]]:
        """Get posts ready to be processed/posted"""
        try:
            result = self.supabase.table('social_posts')\
                .select('*')\
                .in_('status', ['pending_approval', 'scheduled'])\
                .order('created_at')\
                .limit(10)\
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting pending posts: {e}")
            return []
    
    def get_scheduled_posts(self) -> List[Dict[str, Any]]:
        """Get posts scheduled for now or earlier"""
        try:
            now = datetime.now().isoformat()
            result = self.supabase.table('social_posts')\
                .select('*')\
                .eq('status', 'scheduled')\
                .lte('scheduled_for', now)\
                .order('scheduled_for')\
                .limit(10)\
                .execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting scheduled posts: {e}")
            return []
    
    def update_post(self, post_id: str, updates: Dict[str, Any]):
        """Update a social post"""
        try:
            self.supabase.table('social_posts')\
                .update(updates)\
                .eq('id', post_id)\
                .execute()
        except Exception as e:
            print(f"Error updating post {post_id}: {e}")
    
    def log_activity(self, post_id: str, action: str, platform: str = None, details: str = None):
        """Log activity for a post"""
        try:
            self.supabase.table('social_activity_log').insert({
                'post_id': post_id,
                'action': action,
                'platform': platform,
                'details': details
            }).execute()
        except Exception as e:
            print(f"Error logging activity: {e}")
    
    def generate_text_with_ai(self, prompt: str, template: str = 'professional') -> Optional[str]:
        """Generate text content using AI"""
        try:
            # Use Groq to generate text
            system_prompt = f"""You are a social media content creator for WealthClaude, a finance brand.
Create engaging, informative content about finance, investing, and markets.
Style: {template}
Keep it concise and engaging for social media.
Include a call to action when appropriate.
Do NOT include hashtags - they will be added separately."""
            
            response = self.ai.generate_with_groq(prompt, system_prompt)
            return response
        except Exception as e:
            print(f"Error generating text: {e}")
            return None
    
    def generate_hashtags(self, text: str, max_tags: int = 5) -> List[str]:
        """Generate relevant hashtags for content"""
        try:
            prompt = f"""Generate {max_tags} relevant hashtags for this social media post about finance/investing:

"{text}"

Return ONLY the hashtags, one per line, without the # symbol.
Focus on: finance, investing, markets, and trending topics."""
            
            response = self.ai.generate_with_groq(prompt)
            if response:
                hashtags = [tag.strip().replace('#', '') for tag in response.split('\n') if tag.strip()]
                return hashtags[:max_tags]
            return ['Finance', 'Investing', 'Markets']
        except Exception as e:
            print(f"Error generating hashtags: {e}")
            return ['Finance', 'Investing', 'Markets']
    
    def generate_image_with_ai(
        self,
        prompt: str,
        template: str = 'professional',
        platform: str = 'twitter'
    ) -> Optional[str]:
        """Generate image using Fal.ai"""
        if not self.image_gen.is_connected():
            print("Fal.ai not connected")
            return None
        
        return self.image_gen.generate_image(
            prompt=prompt,
            template=template,
            platform=platform,
            include_branding=True
        )
    
    def process_post(self, post: Dict[str, Any]) -> bool:
        """Process a single social media post"""
        post_id = post['id']
        content_type = post.get('content_type', 'text')
        
        print(f"\n→ Processing post: {post_id[:8]}...")
        print(f"  Type: {content_type}")
        
        try:
            # Update status to processing
            self.update_post(post_id, {'status': 'posting'})
            
            # Get or generate text
            text = post.get('text_content') or post.get('ai_generated_text')
            if not text and post.get('text_source') == 'ai_generated':
                print("  Generating text with AI...")
                text = self.generate_text_with_ai(
                    post.get('ai_text_prompt', 'Create a finance tip'),
                    post.get('template_type', 'professional')
                )
                self.update_post(post_id, {'ai_generated_text': text, 'text_content': text})
            
            # Get or generate hashtags
            hashtags = post.get('hashtags') or []
            if post.get('auto_hashtags', True) and not hashtags:
                print("  Generating hashtags...")
                hashtags = self.generate_hashtags(text or '')
                self.update_post(post_id, {'hashtags': hashtags})
            
            # Get or generate image
            image_url = post.get('media_url') or post.get('ai_generated_image_url')
            if post.get('media_source') == 'ai_generated' and not image_url:
                print("  Generating image with AI...")
                image_prompt = post.get('ai_image_prompt', text or 'finance themed image')
                image_url = self.generate_image_with_ai(
                    prompt=image_prompt,
                    template=post.get('template_type', 'professional'),
                    platform=post.get('platforms', ['twitter'])[0]
                )
                if image_url:
                    self.update_post(post_id, {
                        'ai_generated_image_url': image_url,
                        'media_url': image_url
                    })
            
            # Get video path if applicable
            video_path = post.get('processed_video_url') if content_type in ['video', 'video_text'] else None
            
            # Post to platforms
            platforms = post.get('platforms', ['twitter'])
            print(f"  Posting to: {', '.join(platforms)}")
            
            results = self.poster.post(
                text=text or '',
                platforms=platforms,
                hashtags=hashtags,
                image_path=image_url if content_type in ['image', 'image_text'] else None,
                video_path=video_path
            )
            
            # Update with results
            update_data = {'posted_at': datetime.now().isoformat()}
            any_success = False
            
            for platform, result in results.items():
                if result.get('success'):
                    any_success = True
                    update_data[f'{platform}_post_id'] = result.get('post_id')
                    update_data[f'{platform}_post_url'] = result.get('url')
                    self.log_activity(post_id, 'posted', platform, result.get('url'))
                    print(f"  ✓ {platform}: {result.get('url', 'Posted')}")
                else:
                    error = result.get('error', 'Unknown error')
                    self.log_activity(post_id, 'failed', platform, error)
                    print(f"  ✗ {platform}: {error}")
            
            # Update status
            update_data['status'] = 'posted' if any_success else 'failed'
            self.update_post(post_id, update_data)
            
            return any_success
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            self.update_post(post_id, {
                'status': 'failed',
                'error_message': str(e)
            })
            self.log_activity(post_id, 'failed', None, str(e))
            return False
    
    def run(self):
        """Main processing loop"""
        print("\n🚀 Starting social media processor loop...")
        
        while True:
            try:
                settings = self.get_settings()
                
                # Check for scheduled posts that are due
                scheduled = self.get_scheduled_posts()
                if scheduled:
                    print(f"\nFound {len(scheduled)} scheduled posts ready to post")
                    for post in scheduled:
                        self.process_post(post)
                
                # Check for auto-post if enabled
                if settings.get('social_auto_post', False):
                    pending = self.get_pending_posts()
                    if pending:
                        print(f"\nFound {len(pending)} pending posts (auto-post enabled)")
                        for post in pending[:5]:  # Limit batch size
                            self.process_post(post)
                
            except KeyboardInterrupt:
                print("\n\n👋 Stopping social media processor...")
                break
            except Exception as e:
                print(f"\n❌ Error in main loop: {e}")
            
            print(f"⏳ Waiting {self.poll_interval}s...")
            time.sleep(self.poll_interval)


# CLI Commands
def create_post(
    text: str = None,
    image_prompt: str = None,
    template: str = 'professional',
    platforms: List[str] = ['twitter'],
    schedule: str = None
):
    """Create a new social post via CLI"""
    load_dotenv()
    
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_KEY')
    )
    
    post_data = {
        'content_type': 'text' if not image_prompt else 'image_text',
        'text_content': text,
        'text_source': 'manual' if text else 'ai_generated',
        'ai_image_prompt': image_prompt,
        'media_source': 'ai_generated' if image_prompt else None,
        'template_type': template,
        'platforms': platforms,
        'status': 'scheduled' if schedule else 'pending_approval',
        'scheduled_for': schedule,
        'auto_hashtags': True
    }
    
    result = supabase.table('social_posts').insert(post_data).execute()
    print(f"Created post: {result.data[0]['id']}")
    return result.data[0]


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Social Media Processor')
    parser.add_argument('--run', action='store_true', help='Run the processor loop')
    parser.add_argument('--create', action='store_true', help='Create a new post')
    parser.add_argument('--text', type=str, help='Post text')
    parser.add_argument('--image', type=str, help='Image generation prompt')
    parser.add_argument('--template', type=str, default='professional', help='Template type')
    parser.add_argument('--platforms', type=str, default='twitter', help='Comma-separated platforms')
    
    args = parser.parse_args()
    
    if args.create:
        create_post(
            text=args.text,
            image_prompt=args.image,
            template=args.template,
            platforms=args.platforms.split(',')
        )
    else:
        processor = SocialMediaProcessor()
        processor.run()
