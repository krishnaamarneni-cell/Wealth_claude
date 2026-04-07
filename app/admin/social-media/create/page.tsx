'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Calendar, Sparkles, ImageIcon, Loader2, X, Youtube, Film } from 'lucide-react'

type ContentType = 'reel' | 'image' | 'youtube'

export default function CreatePostPage() {
  const [text, setText] = useState('')
  const [reelUrl, setReelUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [contentType, setContentType] = useState<ContentType>('reel')
  const [imageUrl, setImageUrl] = useState('')
  const [platforms, setPlatforms] = useState({ instagram: true, linkedin: false, youtube: false, twitter: false })
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [textTopic, setTextTopic] = useState('')

  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Reset platforms when switching tabs
  const switchTab = (type: ContentType) => {
    setContentType(type)
    setMessage(null)
    if (type === 'youtube') {
      setPlatforms({ instagram: false, linkedin: false, youtube: true, twitter: false })
    } else if (type === 'reel') {
      setPlatforms({ instagram: true, linkedin: false, youtube: false, twitter: false })
    } else {
      setPlatforms({ instagram: true, linkedin: false, youtube: false, twitter: false })
    }
  }

  const handleGenerateCaption = async () => {
    if (!textTopic.trim()) {
      setMessage({ type: 'error', text: 'Enter a topic for AI to write about' })
      return
    }
    setIsGeneratingText(true)
    setMessage(null)
    try {
      const captionType = contentType === 'youtube' ? 'youtube_description' : contentType === 'reel' ? 'reel_caption' : 'text'
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: captionType, prompt: textTopic }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setText(data.text)
        setMessage({ type: 'success', text: contentType === 'youtube' ? 'Description generated!' : 'Caption generated!' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to generate' })
    } finally {
      setIsGeneratingText(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!text.trim()) {
      setMessage({ type: 'error', text: 'Write or generate a caption first — image prompt is based on it' })
      return
    }
    setIsGeneratingImage(true)
    setMessage(null)
    try {
      const imagePrompt = `Professional, high-quality social media post image for finance/investing brand. Topic: ${text.slice(0, 200)}. Style: clean, modern, premium dark theme with subtle gradients. No text overlay.`
      const res = await fetch('/api/social/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setImageUrl(data.image_url)
        setMessage({ type: 'success', text: 'Image generated!' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to generate image' })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const getSourceUrl = () => {
    if (contentType === 'reel') return reelUrl
    if (contentType === 'youtube') return youtubeUrl
    return null
  }

  const validateForm = (): string | null => {
    const platformList = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)
    if (platformList.length === 0) return 'Select at least one platform'

    if (contentType === 'reel') {
      if (!reelUrl.trim() || !reelUrl.includes('instagram.com')) return 'Enter a valid Instagram Reel URL'
    } else if (contentType === 'youtube') {
      if (!youtubeUrl.trim() || (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be'))) {
        return 'Enter a valid YouTube URL'
      }
    } else if (contentType === 'image') {
      if (!text.trim()) return 'Enter post text'
    }
    return null
  }

  const handlePostNow = async () => {
    const err = validateForm()
    if (err) { setMessage({ type: 'error', text: err }); return }

    const platformList = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)
    setIsPosting(true)
    setMessage(null)

    try {
      if (contentType === 'image') {
        // Image posts go directly to Make.com
        const res = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platformList.length > 1 ? 'both' : platformList[0],
            text,
            image_url: imageUrl,
            content_type: 'image',
          }),
        })
        const data = await res.json()
        if (data.error) {
          setMessage({ type: 'error', text: data.error })
        } else {
          setMessage({ type: 'success', text: 'Posted successfully!' })
          clearForm()
        }
      } else {
        // Reel or YouTube — save as "approved" so Python picks up immediately
        const res = await fetch('/api/admin/video-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_url: getSourceUrl(),
            source_type: contentType === 'youtube' ? 'youtube' : 'instagram',
            text_content: text || null,
            content_type: contentType,
            platforms: platformList,
            status: 'approved',
          }),
        })
        const data = await res.json()
        if (data.error) {
          setMessage({ type: 'error', text: data.error })
        } else {
          const label = contentType === 'youtube' ? 'YouTube video' : 'Reel'
          setMessage({ type: 'success', text: `${label} approved! Python script will process it shortly.` })
          clearForm()
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to post' })
    } finally {
      setIsPosting(false)
    }
  }

  const handleAddToQueue = async () => {
    if (contentType === 'reel' && (!reelUrl.trim() || !reelUrl.includes('instagram.com'))) {
      setMessage({ type: 'error', text: 'Enter a valid Instagram Reel URL' }); return
    }
    if (contentType === 'youtube' && (!youtubeUrl.trim() || (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')))) {
      setMessage({ type: 'error', text: 'Enter a valid YouTube URL' }); return
    }
    const platformList = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)

    setIsPosting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/video-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: getSourceUrl(),
          source_type: contentType === 'youtube' ? 'youtube' : 'instagram',
          text_content: text || null,
          media_url: contentType === 'image' ? imageUrl : null,
          content_type: contentType,
          platforms: platformList,
          status: 'pending',
        }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Added to queue for review!' })
        clearForm()
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add to queue' })
    } finally {
      setIsPosting(false)
    }
  }

  const handleSchedule = async () => {
    const err = validateForm()
    if (err) { setMessage({ type: 'error', text: err }); return }
    if (!scheduleDate || !scheduleTime) {
      setMessage({ type: 'error', text: 'Pick a date and time' }); return
    }

    const platformList = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)
    setIsScheduling(true)
    setMessage(null)

    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      const res = await fetch('/api/admin/video-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: getSourceUrl(),
          source_type: contentType === 'youtube' ? 'youtube' : 'instagram',
          text_content: text || null,
          media_url: contentType === 'image' ? imageUrl : null,
          content_type: contentType,
          platforms: platformList,
          status: 'pending',
          scheduled_for: scheduledFor,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Scheduled!' })
        clearForm()
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to schedule' })
    } finally {
      setIsScheduling(false)
    }
  }

  function clearForm() {
    setText('')
    setReelUrl('')
    setYoutubeUrl('')
    setImageUrl('')
    setTextTopic('')
    setScheduleDate('')
    setScheduleTime('')
  }

  const isYoutubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/social-media" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Post</h1>
          <p className="text-muted-foreground text-sm">Add a new reel, image post, or YouTube video</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/20 text-green-500'
            : 'bg-red-500/10 border border-red-500/20 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Content Type Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => switchTab('reel')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
            contentType === 'reel' ? 'bg-purple-600 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Film className="h-4 w-4" /> Reel / Video
        </button>
        <button
          onClick={() => switchTab('image')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
            contentType === 'image' ? 'bg-green-600 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <ImageIcon className="h-4 w-4" /> Image Post
        </button>
        <button
          onClick={() => switchTab('youtube')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
            contentType === 'youtube' ? 'bg-red-600 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Youtube className="h-4 w-4" /> YouTube
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Reel URL */}
          {contentType === 'reel' && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Instagram Reel URL</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Paste the URL. Python script will download, generate caption, upload to Cloudinary, and send to Make.com.
              </p>
              <input
                type="url"
                value={reelUrl}
                onChange={(e) => setReelUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/ABC123..."
                className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {reelUrl && reelUrl.includes('instagram.com') && (
                <p className="text-xs text-green-500 mt-2">Valid Instagram URL detected</p>
              )}
            </div>
          )}

          {/* YouTube URL */}
          {contentType === 'youtube' && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">YouTube Video URL</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Paste the URL. Python script will download, transcribe, generate AI title/description, add headline overlay, and upload to YouTube.
              </p>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {youtubeUrl && isYoutubeUrl(youtubeUrl) && (
                <p className="text-xs text-green-500 mt-2">Valid YouTube URL detected</p>
              )}

              {/* YouTube-specific info */}
              <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-red-400">Pipeline:</strong> Download → Transcribe → AI Title & Description → Headline Overlay → Upload to YouTube
                </p>
              </div>
            </div>
          )}

          {/* Caption / Description */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">
              {contentType === 'youtube' ? 'Title & Description' : 'Caption / Text'}
            </h2>
            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2">Generate with AI</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textTopic}
                  onChange={(e) => setTextTopic(e.target.value)}
                  placeholder={contentType === 'youtube' ? 'e.g., Federal Reserve interest rate decision' : 'e.g., investing tips for beginners'}
                  className="flex-1 px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingText}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium inline-flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGeneratingText ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                contentType === 'youtube'
                  ? 'Leave empty for AI-generated title & description...'
                  : contentType === 'reel'
                    ? 'Leave empty for AI-generated caption...'
                    : 'Write your post here...'
              }
              rows={contentType === 'youtube' ? 8 : 5}
              className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{text.length} characters</span>
              <span>Max: {contentType === 'youtube' ? '5,000' : '2,200'}</span>
            </div>
          </div>

          {/* Image — only for image posts */}
          {contentType === 'image' && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Image</h2>
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">Paste image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div className="relative flex items-center my-4">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !text.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                {isGeneratingImage ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating image...</>
                ) : (
                  <><ImageIcon className="h-4 w-4" /> Generate Image from Caption</>
                )}
              </button>
              {!text.trim() && (
                <p className="text-xs text-muted-foreground mt-2">Write a caption first — the image will be based on it</p>
              )}
              {imageUrl && (
                <div className="mt-4 relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-[250px] object-cover rounded-lg border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Platform Selection */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Platforms</h2>
            <div className="space-y-3">
              {contentType === 'youtube' ? (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.youtube}
                      onChange={(e) => setPlatforms({ ...platforms, youtube: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm inline-flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" /> YouTube
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.twitter}
                      onChange={(e) => setPlatforms({ ...platforms, twitter: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Twitter / X</span>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.instagram}
                      onChange={(e) => setPlatforms({ ...platforms, instagram: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Instagram ({contentType === 'reel' ? 'Reel' : 'Post'})</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.linkedin}
                      onChange={(e) => setPlatforms({ ...platforms, linkedin: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">LinkedIn ({contentType === 'reel' ? 'Video' : 'Post'})</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Schedule (Optional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <div className="rounded-lg border p-4">
              {contentType === 'reel' && reelUrl && (
                <div className="aspect-video rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                  <div className="text-center">
                    <span className="text-3xl">🎬</span>
                    <p className="text-xs text-muted-foreground mt-1">Reel will be downloaded & processed</p>
                  </div>
                </div>
              )}
              {contentType === 'youtube' && youtubeUrl && (
                <div className="aspect-video rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
                  <div className="text-center">
                    <Youtube className="h-8 w-8 text-red-500 mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">Video will be downloaded, transcribed & re-uploaded</p>
                  </div>
                </div>
              )}
              {contentType === 'image' && imageUrl && (
                <img src={imageUrl} alt="Preview" className="aspect-square max-h-[200px] object-cover rounded-lg mb-3" />
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                {text || (
                  contentType === 'youtube'
                    ? 'Title & description will be AI-generated by Python script...'
                    : contentType === 'reel'
                      ? 'Caption will be AI-generated by Python script...'
                      : 'Your post text...'
                )}
              </p>
              <div className="flex gap-2 mt-3">
                {platforms.instagram && (
                  <span className="px-2 py-1 bg-pink-500/10 text-pink-400 rounded text-xs">Instagram</span>
                )}
                {platforms.linkedin && (
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">LinkedIn</span>
                )}
                {platforms.youtube && (
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">YouTube</span>
                )}
                {platforms.twitter && (
                  <span className="px-2 py-1 bg-sky-500/10 text-sky-400 rounded text-xs">Twitter</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handlePostNow}
              disabled={isPosting}
              className={`w-full py-3 rounded-lg disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2 ${
                contentType === 'youtube'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Send className="h-4 w-4" />
              {isPosting
                ? 'Processing...'
                : contentType === 'youtube'
                  ? 'Process & Upload Now'
                  : contentType === 'reel'
                    ? 'Post Now (Auto-process)'
                    : 'Post Now'
              }
            </button>
            <button
              onClick={handleAddToQueue}
              disabled={isPosting}
              className="w-full py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
            >
              Add to Queue (Review first)
            </button>
            <button
              onClick={handleSchedule}
              disabled={isScheduling}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {isScheduling ? 'Scheduling...' : 'Schedule for Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
