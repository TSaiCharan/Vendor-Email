'use client'

import { jwtDecode } from 'jwt-decode'

export interface User {
  id: string
  email: string
  iat?: number
  exp?: number
}

const AUTH_COOKIE_NAME = 'auth_token'
const USER_COOKIE_NAME = 'user_email'
const COOKIE_EXPIRY_DAYS = 7

/**
 * Get the authentication token from cookies
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (name === AUTH_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }
  return null
}

/**
 * Set authentication token in cookies
 */
export function setAuthToken(token: string, email: string): void {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS)
  
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`
  document.cookie = `${USER_COOKIE_NAME}=${encodeURIComponent(email)}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`
}

/**
 * Remove authentication token from cookies
 */
export function clearAuthToken(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
  document.cookie = `${USER_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
}

/**
 * Get current user from cookies
 */
export function getCurrentUser(): User | null {
  const token = getAuthToken()
  if (!token) return null

  try {
    const decoded = jwtDecode<User>(token)
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      clearAuthToken()
      return null
    }
    return decoded
  } catch (error) {
    console.error('Failed to decode token:', error)
    clearAuthToken()
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

/**
 * Validate login credentials (mock validation - replace with your backend logic)
 * This should call your backend API to validate credentials
 */
export async function validateLogin(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Call your backend API endpoint to validate credentials
    // For now, we'll create a mock JWT token
    // In production, your backend should validate and return a token
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Login failed' }
    }

    const data = await response.json()
    
    // Set the token in cookies
    if (data.token) {
      setAuthToken(data.token, email)
      return { success: true, user: { id: data.id, email } }
    }

    return { success: false, error: 'No token received' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Validate signup (mock validation - replace with your backend logic)
 */
export async function validateSignUp(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Signup failed' }
    }

    const data = await response.json()
    
    if (data.token) {
      setAuthToken(data.token, email)
      return { success: true, user: { id: data.id, email } }
    }

    return { success: false, error: 'No token received' }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Logout user
 */
export function logout(): void {
  clearAuthToken()
}

/**
 * Get email from cookies (for quick access without JWT decoding)
 */
export function getUserEmail(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (name === USER_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }
  return null
}
