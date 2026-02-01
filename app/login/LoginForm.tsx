'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) router.replace('/home')
    }
    checkSession()
  }, [router])

  // Read ?message= from URL
  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) setMessage(msg)
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (!email || !password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        return
      }

      if (!data.session) {
        setMessage('Check your email to confirm your account.')
        return
      }

      router.replace('/home')
    } catch (err) {
      console.error('Unexpected error during login:', err)
      setError('Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 md:p-10 border border-slate-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Welcome Back</h1>
            <p className="text-slate-400">Login to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400 text-sm font-medium">{message}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 mt-6 transition"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
