"""
AI Generator - Generate titles, descriptions, and analyze content
Uses Groq API with Llama for fast inference
"""

import os
import re
import json
import logging
from typing import Optional, List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    logger.warning("Groq not installed. Install with: pip install groq")
    GROQ_AVAILABLE = False


class AIGenerator:
    """Generate AI content using Groq API"""
    
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        self.client = None
        
        if GROQ_AVAILABLE and self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            logger.warning("Groq client not initialized - missing API key or package")
    
    def _call_groq(self, prompt: str, max_tokens: int = 500) -> Optional[str]:
        """Make a call to Groq API"""
        if not self.client:
            return None
            
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return None
    
    def generate_title(self, original_title: str, video_type: str = 'long') -> List[str]:
        """Generate engaging titles for a video"""
        
        prompt = f"""Generate 3 engaging YouTube titles for this video.
Original title: {original_title}
Video type: {video_type} form content

Requirements:
- Keep titles under 100 characters
- Make them attention-grabbing
- Include relevant keywords for search
- Don't use clickbait or misleading titles
- Keep the core message of the original

Return ONLY the 3 titles, one per line, no numbers or bullets."""

        result = self._call_groq(prompt)
        
        if result:
            titles = [t.strip() for t in result.split('\n') if t.strip()]
            return titles[:3] if titles else [original_title]
        
        return [original_title]
    
    def generate_description(self, title: str, source_type: str = 'youtube', 
                            original_description: str = '', tags: List[str] = None) -> str:
        """Generate a comprehensive YouTube description"""
        
        prompt = f"""Create a comprehensive YouTube video description for this video.

Title: {title}
Source: {source_type}
Original description: {original_description[:500] if original_description else 'None provided'}

Requirements:
1. Start with a compelling 1-2 sentence summary that hooks viewers
2. Add 2-3 sentences explaining what viewers will learn or see
3. Include a call-to-action (subscribe, like, comment)
4. Add relevant hashtags at the end (5-8 hashtags)

Format:
[Compelling summary]

[What viewers will learn/see]

👍 Like this video if you found it helpful!
🔔 Subscribe for more content like this!
💬 Share your thoughts in the comments!

[Hashtags]

Keep the total description under 300 words. Make it professional but engaging."""

        result = self._call_groq(prompt, max_tokens=600)
        
        if result:
            return result
        
        # Fallback description
        hashtags = ' '.join([f'#{tag}' for tag in (tags or ['video', 'content'])[:5]])
        return f"""📺 {title}

Watch this video to learn more about this topic!

👍 Like this video if you found it helpful!
🔔 Subscribe for more content like this!
💬 Share your thoughts in the comments below!

{hashtags}"""
    
    def generate_tags(self, title: str, max_tags: int = 15) -> List[str]:
        """Generate relevant tags for SEO"""
        
        prompt = f"""Generate {max_tags} relevant YouTube tags for this video.
Title: {title}

Requirements:
- Mix of broad and specific tags
- Include relevant keywords
- Good for YouTube SEO
- No hashtag symbols, just the words

Return ONLY the tags, one per line, no numbers or explanations."""

        result = self._call_groq(prompt)
        
        if result:
            tags = [t.strip().lower().replace('#', '') for t in result.split('\n') if t.strip()]
            return tags[:max_tags] if tags else ['video', 'content']
        
        # Fallback tags
        words = title.lower().split()[:5]
        return words + ['video', 'content', 'youtube']
    
    def analyze_transcript(self, transcript: str, video_title: str = '') -> Dict[str, Any]:
        """Analyze a video transcript to extract key information"""
        
        # Truncate transcript if too long
        max_chars = 4000
        if len(transcript) > max_chars:
            transcript = transcript[:max_chars] + "..."
        
        prompt = f"""Analyze this video transcript and extract key information.

Title: {video_title}
Transcript: {transcript}

Provide a JSON response with:
{{
    "summary": "2-3 sentence summary of the video",
    "key_points": ["point 1", "point 2", "point 3"],
    "topics": ["topic1", "topic2", "topic3"],
    "sentiment": "positive/negative/neutral",
    "suggested_title": "An engaging title for this content"
}}

Return ONLY valid JSON, no other text."""

        result = self._call_groq(prompt, max_tokens=800)
        
        if result:
            try:
                # Clean up the response
                result = result.strip()
                if result.startswith('```'):
                    result = re.sub(r'^```json?\n?', '', result)
                    result = re.sub(r'\n?```$', '', result)
                return json.loads(result)
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI analysis as JSON")
        
        return {
            "summary": f"Video about {video_title}",
            "key_points": [],
            "topics": [],
            "sentiment": "neutral",
            "suggested_title": video_title
        }
    
    def generate_hook(self, title: str, transcript_snippet: str = '') -> str:
        """Generate a compelling hook/intro for the video"""
        
        prompt = f"""Write a compelling 1-2 sentence hook for this video that would make someone want to watch.

Title: {title}
Content snippet: {transcript_snippet[:500] if transcript_snippet else 'Not available'}

Requirements:
- Create curiosity or urgency
- Be concise (under 50 words)
- Don't be clickbaity or misleading

Return ONLY the hook, no other text."""

        result = self._call_groq(prompt, max_tokens=100)
        
        if result:
            return result
        
        return f"Watch this video about {title}"


class ThumbnailGenerator:
    """Generate or enhance thumbnails"""
    
    def __init__(self):
        # For now, we'll use YouTube's auto-generated thumbnails
        # Future: Could integrate with image generation APIs
        pass
    
    def suggest_thumbnail_text(self, title: str) -> str:
        """Suggest text overlay for thumbnail"""
        # Extract key words from title
        words = title.split()
        if len(words) > 4:
            return ' '.join(words[:4]).upper()
        return title.upper()


# For testing
if __name__ == '__main__':
    ai = AIGenerator()
    
    test_title = "Senator Questions Federal Reserve Chair About Interest Rates"
    
    print("=== Testing AI Generator ===\n")
    
    print("1. Generating titles...")
    titles = ai.generate_title(test_title)
    for t in titles:
        print(f"   - {t}")
    
    print("\n2. Generating description...")
    desc = ai.generate_description(test_title, 'youtube')
    print(desc)
    
    print("\n3. Generating tags...")
    tags = ai.generate_tags(test_title)
    print(f"   Tags: {', '.join(tags)}")
    
    print("\n4. Generating hook...")
    hook = ai.generate_hook(test_title)
    print(f"   Hook: {hook}")
