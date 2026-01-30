'use client'

import { supabase } from '@/lib/supabase'

/**
 * Make an authenticated fetch request with the user's session token
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
) {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }

  // Add authorization header if we have a session
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  // Always include credentials for cookies
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  }

  return fetch(url, fetchOptions)
}
