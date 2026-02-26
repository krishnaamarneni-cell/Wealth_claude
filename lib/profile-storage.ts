import type { User } from '@supabase/supabase-js'

interface ProfileData {
  fullName: string
  username: string
  email: string
  bio: string
  timezone: string
  currency: string
  avatar: string
  memberSince: string
}

const PROFILE_STORAGE_KEY = 'userProfile'

/**
 * Get profile from storage (localStorage for now)
 * TODO: Replace with Supabase when /api/profile endpoint is created
 */
export async function getProfileFromStorage(): Promise<ProfileData | null> {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!saved) return null
    
    const profile = JSON.parse(saved) as ProfileData
    console.log('[profile-storage] Loaded profile from storage')
    return profile
  } catch (error) {
    console.error('[profile-storage] Error loading profile:', error)
    return null
  }
}

/**
 * Save profile to storage (localStorage for now)
 * TODO: Replace with Supabase when /api/profile endpoint is created
 */
export async function saveProfileToStorage(profile: ProfileData): Promise<void> {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    console.log('[profile-storage] Saved profile to storage')
  } catch (error) {
    console.error('[profile-storage] Error saving profile:', error)
    throw error
  }
}

/**
 * Clear profile from storage
 */
export async function clearProfileFromStorage(): Promise<void> {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    console.log('[profile-storage] Cleared profile from storage')
  } catch (error) {
    console.error('[profile-storage] Error clearing profile:', error)
    throw error
  }
}
