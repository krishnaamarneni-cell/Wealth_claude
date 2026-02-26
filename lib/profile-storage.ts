export interface ProfileData {
  fullName: string
  username: string
  email: string
  bio: string
  timezone: string
  currency: string
  avatar: string
  memberSince: string
}

const DEFAULT_PROFILE: ProfileData = {
  fullName: '',
  username: '',
  email: '',
  bio: '',
  timezone: 'UTC',
  currency: 'USD',
  avatar: '',
  memberSince: new Date().toISOString(),
}

export async function getProfileFromStorage(): Promise<ProfileData> {
  try {
    const response = await fetch('/api/profile')
    if (response.ok) {
      const data = await response.json()
      if (data) {
        localStorage.setItem('userProfile', JSON.stringify(data))
        return data
      }
    }
  } catch (e) {
    console.warn('[profile-storage] Supabase failed, using localStorage')
  }

  try {
    const stored = localStorage.getItem('userProfile')
    if (stored) return JSON.parse(stored)
  } catch (e) {
    console.error('[profile-storage] localStorage error:', e)
  }

  return DEFAULT_PROFILE
}

export async function saveProfileToStorage(profile: ProfileData): Promise<boolean> {
  localStorage.setItem('userProfile', JSON.stringify(profile))

  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[profile-storage] Save failed:', err)
      return false
    }

    return true
  } catch (e) {
    console.error('[profile-storage] Network error:', e)
    return false
  }
}