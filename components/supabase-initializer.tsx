'use client'

import { useEffect } from 'react'

/**
 * This component initializes Supabase tables and buckets on app startup
 * It must be called from a client component
 */
export function SupabaseInitializer() {
  useEffect(() => {
    // Initialize Supabase on app load
    const initializeApp = async () => {
      try {
        // We'll call the init API endpoint instead of directly calling the function
        const response = await fetch('/api/init', { method: 'POST' })
        if (response.ok) {
          console.log('[app] Supabase initialization completed')
        } else {
          console.log('[app] Supabase initialization status:', response.status)
        }
      } catch (error) {
        console.error('[app] Error initializing Supabase:', error)
      }
    }

    initializeApp()
  }, [])

  return null // This component doesn't render anything
}
