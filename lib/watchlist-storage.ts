export interface WatchlistItem {
  id: string
  symbol: string
  companyName: string
  addedDate: string
  addedPrice: number
}

export const getWatchlistFromStorage = (): WatchlistItem[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('watchlist')
  return stored ? JSON.parse(stored) : []
}

export const saveWatchlistToStorage = (watchlist: WatchlistItem[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('watchlist', JSON.stringify(watchlist))
}
