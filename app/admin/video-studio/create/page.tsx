'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Calendar, Sparkles } from 'lucide-react'

interface MonitoredAccount {
  id: string
  username: string
  enabled: boolean
  last_checked_at: string | null
  reels_found: number
  reels_posted: number
  auto_post_instagram: boolean
  auto_post_youtube: boolean
}

export default function CreatePostPage() {
  const [text, setText] = useState('')
  const [reelUrl, setReelUrl] = useState('')
  const [contentType, setContentType] = useState<'reel' | 'image' | 'auto'>('reel')
  const [imageUrl, setImageUrl] = useState('')
  const [platforms, setPlatforms] = useState({ instagram: true, linkedin: false })
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [textTopic, setTextTopic] = useState('')

  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Auto-Follow state
  const [accounts, setAccounts] = useState<MonitoredAccount[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const fetchAccounts = async () => {
    setIsLoadingAccounts(true)
    try {
      const res = await fetch('/api/social/monitor')
      const data = await res.json()
      if (data.accounts) setAccounts(data.accounts)
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch monitored accounts' })
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) return
    setIsAdding(true)
    setMessage(null)
    try {
      const res = await fetch('/api/social/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.replace(/^@/, '').trim() }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: 'Account added!' })
        setNewUsername('')
        await fetchAccounts()
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to add account' })
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleAccount = async (id: string, field: string, value: boolean) => {
    try {
      await fetch('/api/social/monitor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
      await fetchAccounts()
    } catch {
      setMessage({ type: 'error', text: 'Failed to update account' })
    }
  }

  const handleRemoveAccount = async (id: string) => {
    try {
      await fetch(`/api/social/monitor?id=${id}`, { method: 'DELETE' })
      setMessage({ type: 'success', text: 'Account removed' })
      await fetchAccounts()
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove' })
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
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: contentType === 'reel' ? 'reel_caption' : 'text', prompt: textTopic }),
      })
      const data = await res.json()
      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setText(data.text)
        setMessage({ type: 'success', text: 'Caption generated!' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to generate caption' })
    } finally {
      setIsGeneratingText(false)
    }
  }

  const handlePostNow = async () => {
    const platformList = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)
    if (platformList.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one platform' })
      return
    }

    if (contentType === 'reel') {
      if (!reelUrl.trim() || !reelUrl.includes('instagram.com')) {
        setMessage({ type: 'error', text: 'Enter a valid Instagram Reel URL' })
        return
      }
    } else if (contentType === 'image') {
      if (!text.trim()) {
        setMessage({ type: 'error', text: 'Enter post text' })
        return
      }
    }

    setIsPosting(true)
    setMessage(null)

    try {
      if (contentType === 'reel') {
        const res = await fetch('/api/admin/video-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_url: reelUrl,
            text_content: text || null,
            content_type: 'reel',
            platforms: platformList,
            status: 'pending',
          }),
        })
        const data = await res.json()
        if (data.error) {
          setMessage({ type: 'error', text: data.error })
        } else {
          setMessage({ type: 'success', text: 'Reel queued! Python script will process it.' })
          clearForm()
        }
      } else {
        // Image posts go directly to Make.com
        const res = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platformList.length === 2 ? 'both' : platformList[0],
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
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to post' })
    } finally {
      setIsPosting(false)
    }
  }

  const handleSchedule = async () => {
    const platformList = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)
    if (platformList.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one platform' })
      return
    }
    if (contentType === 'reel' && !reelUrl.trim()) {
      setMessage({ type: 'error', text: 'Enter a reel URL' })
      return
    }

    setIsScheduling(true)
    setMessage(null)

    try {
      let scheduledFor = null
      if (scheduleDate && scheduleTime) {
        scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      }

      const res = await fetch('/api/admin/video-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: contentType === 'reel' ? reelUrl : null,
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
        setMessage({ type: 'success', text: 'Post scheduled!' })
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
    setImageUrl('')
    setTextTopic('')
    setScheduleDate('')
    setScheduleTime('')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/video-studio" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Post</h1>
          <p className="text-muted-foreground text-sm">Add a new reel or image post to the queue</p>
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
        {(['reel', 'image', 'auto'] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setContentType(type)
              if (type === 'auto') fetchAccounts()
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              contentType === type
                ? type === 'reel' ? 'bg-purple-600 text-white'
                  : type === 'image' ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {type === 'reel' ? 'Reel / Video' : type === 'image' ? 'Image Post' : 'Auto-Follow'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Content */}
        <div className="space-y-6">
          {/* Reel URL */}
          {contentType === 'reel' && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Instagram Reel URL</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Paste the Instagram Reel URL. Python script will download and post.
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

          {/* Caption / Text */}
          {contentType !== 'auto' && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Caption / Text</h2>
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">Generate with AI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textTopic}
                    onChange={(e) => setTextTopic(e.target.value)}
                    placeholder="e.g., investing tips for beginners"
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
                placeholder={contentType === 'reel' ? 'Leave empty for AI-generated caption...' : 'Write your post here...'}
                rows={5}
                className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{text.length} characters</span>
                <span>Max: 2,200</span>
              </div>
            </div>
          )}

          {/* Image URL (only for image posts) */}
          {contentType === 'image' && (
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Image</h2>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              {imageUrl && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-[200px] aspect-square object-cover rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <button onClick={() => setImageUrl('')} className="mt-2 text-red-500 hover:text-red-400 text-sm">
                    Remove image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Auto-Follow Section */}
          {contentType === 'auto' && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Add Account to Monitor</h2>
                <form onSubmit={handleAddAccount} className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {isAdding ? 'Adding...' : 'Add'}
                  </button>
                </form>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Monitored Accounts</h2>
                {isLoadingAccounts ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
                ) : accounts.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No accounts monitored yet</p>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((acct) => (
                      <div key={acct.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-sm">@{acct.username}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${acct.enabled ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                              {acct.enabled ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <button onClick={() => handleRemoveAccount(acct.id)} className="text-red-500 hover:text-red-400 text-sm">
                            Remove
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Reels found: {acct.reels_found} | Posted: {acct.reels_posted}
                        </p>
                        <div className="flex gap-4 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={acct.auto_post_instagram} onChange={(e) => handleToggleAccount(acct.id, 'auto_post_instagram', e.target.checked)} className="rounded" />
                            Instagram
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={acct.auto_post_youtube} onChange={(e) => handleToggleAccount(acct.id, 'auto_post_youtube', e.target.checked)} className="rounded" />
                            YouTube
                          </label>
                          <button
                            onClick={() => handleToggleAccount(acct.id, 'enabled', !acct.enabled)}
                            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                          >
                            {acct.enabled ? 'Pause' : 'Resume'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Settings & Actions */}
        {contentType !== 'auto' && (
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Platforms</h2>
              <div className="space-y-3">
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
                      <Film className="h-8 w-8 mx-auto text-purple-400 mb-1" />
                      <p className="text-xs text-muted-foreground">Reel will be downloaded</p>
                    </div>
                  </div>
                )}
                {contentType === 'image' && imageUrl && (
                  <img src={imageUrl} alt="Preview" className="aspect-square max-h-[200px] object-cover rounded-lg mb-3" />
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {text || (contentType === 'reel' ? 'Caption will be AI-generated...' : 'Your post text...')}
                </p>
                <div className="flex gap-2 mt-3">
                  {platforms.instagram && (
                    <span className="px-2 py-1 bg-pink-500/10 text-pink-400 rounded text-xs">Instagram</span>
                  )}
                  {platforms.linkedin && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">LinkedIn</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePostNow}
                disabled={isPosting}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isPosting ? 'Processing...' : contentType === 'reel' ? 'Add to Queue' : 'Post Now'}
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
        )}
      </div>
    </div>
  )
}
