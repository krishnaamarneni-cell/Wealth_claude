'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { ShareModal } from './ShareModal'
import type { TabId } from '@/types/intelligence'

interface ShareButtonProps {
  tab: TabId
  data: any
  date?: string
}

export function ShareButton({ tab, data, date }: ShareButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary rounded-lg transition-colors"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </button>
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        tab={tab}
        data={data}
        date={date}
      />
    </>
  )
}
