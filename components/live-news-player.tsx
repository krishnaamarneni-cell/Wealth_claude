"use client"

import { useState } from "react"
import { Play, Tv, Volume2, VolumeX, Maximize2, ChevronDown, ChevronUp } from "lucide-react"

/**
 * Live News Player - embeds YouTube 24/7 news live streams.
 *
 * Uses YouTube's channel-based live_stream URL which auto-redirects to whatever
 * stream is currently live on that channel. More reliable than hardcoded video IDs.
 *
 * All channels have official public livestreams on YouTube. Embedding is allowed
 * by YouTube ToS — channels receive view counts and ad revenue.
 */

interface Channel {
  id: string
  name: string
  /** YouTube channel ID — uses live_stream?channel=X (auto-finds current live) */
  channelId?: string
  /** OR direct video ID — uses embed/VIDEO_ID (for channels where live_stream fails) */
  videoId?: string
  color: string
  region: string
}

// Bloomberg + Sky News use direct video IDs since their live_stream?channel= doesn't always work.
// Other channels use channel-based URLs which auto-redirect to whatever is currently live.
const CHANNELS: Channel[] = [
  { id: 'bloomberg', name: 'Bloomberg', videoId: 'iEpJwprxDdk', color: 'bg-orange-600', region: '🇺🇸 US' },
  { id: 'cnbc', name: 'CNBC', channelId: 'UCvJJ_dzjViJCoLf5uKUTwoA', color: 'bg-blue-600', region: '🇺🇸 US' },
  { id: 'sky', name: 'Sky News', videoId: 'YDvsBbKfLPA', color: 'bg-red-600', region: '🇬🇧 UK' },
  { id: 'euronews', name: 'Euronews', channelId: 'UCSrZ3UV4jOidv8ppoVuvW9Q', color: 'bg-blue-500', region: '🇪🇺 EU' },
  { id: 'dw', name: 'DW News', channelId: 'UCknLrEdhRCp1aegoMqRaCZg', color: 'bg-red-500', region: '🇩🇪 DE' },
  { id: 'france24', name: 'France 24', channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg', color: 'bg-blue-700', region: '🇫🇷 FR' },
  { id: 'aljazeera', name: 'Al Jazeera', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', color: 'bg-yellow-600', region: '🇶🇦 QA' },
]

function buildEmbedUrl(ch: Channel, muted: boolean): string {
  const base = ch.videoId
    ? `https://www.youtube.com/embed/${ch.videoId}`
    : `https://www.youtube.com/embed/live_stream?channel=${ch.channelId}`
  const params = `autoplay=1&mute=${muted ? 1 : 0}&modestbranding=1&rel=0`
  return `${base}${ch.videoId ? '?' : '&'}${params}`
}

function buildYouTubeUrl(ch: Channel): string {
  return ch.videoId
    ? `https://www.youtube.com/watch?v=${ch.videoId}`
    : `https://www.youtube.com/channel/${ch.channelId}/live`
}

interface LiveNewsPlayerProps {
  /** Layout mode: "card" = inline collapsible card, "sticky" = always-visible panel */
  mode?: 'card' | 'sticky'
}

export default function LiveNewsPlayer({ mode = 'card' }: LiveNewsPlayerProps) {
  const [selectedChannel, setSelectedChannel] = useState<Channel>(CHANNELS[0])
  const [expanded, setExpanded] = useState(mode === 'sticky')
  const [muted, setMuted] = useState(true)

  const embedUrl = buildEmbedUrl(selectedChannel, muted)

  return (
    <div className="rounded-xl border bg-card overflow-hidden mb-6">
      {/* Header with channel tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/50 flex-wrap">
        <div className="flex items-center gap-1.5 pr-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Tv className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Live News</span>
        </div>

        {/* Channel tabs — horizontal scroll on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
          {CHANNELS.map((ch) => {
            const active = selectedChannel.id === ch.id
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setSelectedChannel(ch)
                  setExpanded(true)
                }}
                className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  active
                    ? `${ch.color} text-white`
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
                title={`${ch.name} · ${ch.region}`}
              >
                {ch.name}
              </button>
            )
          })}
        </div>

        {/* Collapse/expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1.5 rounded-md hover:bg-secondary transition-colors"
          title={expanded ? 'Hide player' : 'Show player'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Video container */}
      {expanded ? (
        <div className="relative bg-black">
          <div className="relative aspect-video w-full">
            <iframe
              key={selectedChannel.id + (muted ? '-muted' : '-sound')}
              src={embedUrl}
              title={`${selectedChannel.name} Live`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Overlay controls */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border">
            <div className="flex items-center gap-3 text-xs">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${selectedChannel.color} text-white font-semibold`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="text-muted-foreground">{selectedChannel.name} · {selectedChannel.region}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMuted(!muted)}
                className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <a
                href={buildYouTubeUrl(selectedChannel)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                title="Open on YouTube"
              >
                <Maximize2 className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        // Collapsed state — show a tap-to-play button
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-4 py-4 bg-black/40 hover:bg-black/60 transition-colors text-left"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/40">
            <Play className="h-4 w-4 text-primary fill-primary ml-0.5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Watch Live News</p>
            <p className="text-xs text-muted-foreground">{CHANNELS.length} channels · Bloomberg, CNBC, Sky, Al Jazeera, and more</p>
          </div>
        </button>
      )}
    </div>
  )
}
