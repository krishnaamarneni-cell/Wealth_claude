#!/usr/bin/env python3
"""
Make.com Social Media Poster for WealthClaude
Posts to Instagram and LinkedIn via Make.com webhook

Add to your .env file:
MAKE_WEBHOOK_URL=https://hook.us2.make.com/0kaubvw2hfot76jkqa5nstppp5q7q953
"""

import os
import json
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Configuration
MAKE_WEBHOOK_URL = os.getenv("MAKE_WEBHOOK_URL", "https://hook.us2.make.com/0kaubvw2hfot76jkqa5nstppp5q7q953")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
FAL_API_KEY = os.getenv("FAL_API_KEY")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "60"))

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def generate_text_with_groq(prompt: str) -> str:
    """Generate text content using Groq API"""
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a social media expert for WealthClaude, a financial education platform. Create engaging, informative posts about finance, investing, and wealth building. Keep posts concise and include relevant emojis and hashtags."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 500,
                "temperature": 0.7
            }
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            print(f"Groq API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error generating text: {e}")
        return None


def generate_image_with_fal(prompt: str) -> str:
    """Generate image using Fal.ai and return the URL"""
    try:
        # Submit the request
        response = requests.post(
            "https://queue.fal.run/fal-ai/fast-sdxl",
            headers={
                "Authorization": f"Key {FAL_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "prompt": prompt,
                "image_size": "square",  # Good for Instagram
                "num_inference_steps": 25,
                "guidance_scale": 7.5
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            # Check if it's a queued response
            if "request_id" in result:
                # Poll for result
                request_id = result["request_id"]
                for _ in range(30):  # Wait up to 60 seconds
                    time.sleep(2)
                    status_response = requests.get(
                        f"https://queue.fal.run/fal-ai/fast-sdxl/requests/{request_id}/status",
                        headers={"Authorization": f"Key {FAL_API_KEY}"}
                    )
                    if status_response.status_code == 200:
                        status = status_response.json()
                        if status.get("status") == "COMPLETED":
                            # Get the result
                            result_response = requests.get(
                                f"https://queue.fal.run/fal-ai/fast-sdxl/requests/{request_id}",
                                headers={"Authorization": f"Key {FAL_API_KEY}"}
                            )
                            if result_response.status_code == 200:
                                result = result_response.json()
                                if "images" in result and len(result["images"]) > 0:
                                    return result["images"][0]["url"]
                            break
            elif "images" in result and len(result["images"]) > 0:
                return result["images"][0]["url"]
        
        print(f"Fal.ai error: {response.status_code} - {response.text}")
        return None
    except Exception as e:
        print(f"Error generating image: {e}")
        return None


def post_to_make(platform: str, text: str, image_url: str = None) -> dict:
    """
    Send post to Make.com webhook
    
    Args:
        platform: "instagram" or "linkedin"
        text: The post caption/text
        image_url: URL to the image (required for Instagram)
    
    Returns:
        dict with success status and response
    """
    payload = {
        "platform": platform,
        "text": text,
        "image_url": image_url,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        response = requests.post(
            MAKE_WEBHOOK_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200 or response.text == "Accepted":
            print(f"✅ Successfully sent to Make.com for {platform}")
            return {"success": True, "response": response.text}
        else:
            print(f"❌ Make.com error: {response.status_code} - {response.text}")
            return {"success": False, "error": response.text}
    except Exception as e:
        print(f"❌ Error posting to Make.com: {e}")
        return {"success": False, "error": str(e)}


def process_pending_posts():
    """Process pending social media posts from Supabase"""
    try:
        # Get pending posts (status = 'pending_approval' or 'scheduled' with past time)
        result = supabase.table("social_posts")\
            .select("*")\
            .in_("status", ["pending_approval", "scheduled"])\
            .order("created_at", desc=False)\
            .limit(5)\
            .execute()
        
        posts = result.data
        
        if not posts:
            print("📭 No pending posts")
            return
        
        print(f"📬 Found {len(posts)} pending post(s)")
        
        for post in posts:
            post_id = post["id"]
            platforms = post.get("platforms", ["instagram", "linkedin"])
            text_content = post.get("text_content", "")
            image_url = post.get("media_url")
            content_type = post.get("content_type", "image")
            text_source = post.get("text_source", "manual")
            media_source = post.get("media_source", "url")
            
            print(f"\n🔄 Processing post: {post_id[:8]}...")
            print(f"   Platforms: {platforms}")
            print(f"   Content type: {content_type}")
            
            # Generate text if needed
            if text_source == "ai_generated" or not text_content:
                topic = post.get("topic", "financial tips and investing advice")
                print(f"   🤖 Generating text for topic: {topic}")
                generated_text = generate_text_with_groq(
                    f"Create a social media post about: {topic}"
                )
                if generated_text:
                    text_content = generated_text
                    # Update in database
                    supabase.table("social_posts").update({
                        "text_content": text_content
                    }).eq("id", post_id).execute()
            
            # Generate image if needed
            if media_source == "ai_generated" or (content_type == "image" and not image_url):
                image_prompt = post.get("image_prompt", "Professional finance infographic, modern design, green and white colors")
                print(f"   🎨 Generating image: {image_prompt[:50]}...")
                generated_image = generate_image_with_fal(image_prompt)
                if generated_image:
                    image_url = generated_image
                    # Update in database
                    supabase.table("social_posts").update({
                        "media_url": image_url
                    }).eq("id", post_id).execute()
            
            # Update status to posting
            supabase.table("social_posts").update({
                "status": "posting"
            }).eq("id", post_id).execute()
            
            # Post to each platform
            results = {}
            all_success = True
            
            for platform in platforms:
                if platform in ["instagram", "linkedin"]:
                    print(f"   📤 Posting to {platform}...")
                    result = post_to_make(platform, text_content, image_url)
                    results[platform] = result
                    if not result["success"]:
                        all_success = False
                    # Small delay between platforms
                    time.sleep(2)
                else:
                    print(f"   ⚠️ Skipping {platform} (not supported via Make.com)")
            
            # Update final status
            final_status = "posted" if all_success else "failed"
            update_data = {
                "status": final_status,
                "posted_at": datetime.utcnow().isoformat() if all_success else None,
                "post_results": json.dumps(results)
            }
            
            supabase.table("social_posts").update(update_data).eq("id", post_id).execute()
            
            print(f"   {'✅' if all_success else '❌'} Status: {final_status}")
    
    except Exception as e:
        print(f"❌ Error processing posts: {e}")
        import traceback
        traceback.print_exc()


def create_quick_post(platform: str, text: str, image_url: str = None, generate_image: bool = False):
    """
    Quickly create and post content
    
    Args:
        platform: "instagram", "linkedin", or "both"
        text: Post text/caption
        image_url: Optional image URL
        generate_image: If True, generate an AI image
    """
    print(f"\n🚀 Quick Post to {platform}")
    print(f"   Text: {text[:50]}...")
    
    # Generate image if requested
    if generate_image and not image_url:
        print("   🎨 Generating AI image...")
        image_url = generate_image_with_fal(
            f"Professional social media graphic for: {text[:100]}, modern design, clean, vibrant colors"
        )
        if image_url:
            print(f"   ✅ Image generated: {image_url[:50]}...")
    
    # Determine platforms
    platforms = ["instagram", "linkedin"] if platform == "both" else [platform]
    
    # Post to each platform
    for p in platforms:
        result = post_to_make(p, text, image_url)
        if result["success"]:
            print(f"   ✅ Posted to {p}")
        else:
            print(f"   ❌ Failed to post to {p}: {result.get('error')}")
        time.sleep(2)


def main():
    """Main loop - polls for pending posts"""
    print("=" * 60)
    print("🚀 WealthClaude Social Media Poster (Make.com)")
    print("=" * 60)
    print(f"Webhook: {MAKE_WEBHOOK_URL[:50]}...")
    print(f"Poll interval: {POLL_INTERVAL} seconds")
    print(f"Platforms: Instagram, LinkedIn")
    print("=" * 60)
    
    while True:
        try:
            process_pending_posts()
        except KeyboardInterrupt:
            print("\n👋 Stopping...")
            break
        except Exception as e:
            print(f"❌ Error in main loop: {e}")
        
        print(f"\n⏳ Waiting {POLL_INTERVAL}s...")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Quick post mode
        if sys.argv[1] == "quick":
            platform = sys.argv[2] if len(sys.argv) > 2 else "both"
            text = sys.argv[3] if len(sys.argv) > 3 else "Test post from WealthClaude! 📈 #finance #investing"
            image_url = sys.argv[4] if len(sys.argv) > 4 else None
            create_quick_post(platform, text, image_url, generate_image=True)
        elif sys.argv[1] == "test":
            # Test the webhook
            print("🧪 Testing Make.com webhook...")
            result = post_to_make(
                "instagram",
                "Test post from WealthClaude! 📈 #finance #investing #wealthclaude",
                "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080"
            )
            print(f"Result: {result}")
    else:
        main()
