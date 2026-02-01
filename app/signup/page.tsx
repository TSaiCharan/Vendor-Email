'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    return true
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)

    // Disable email confirmation by setting emailRedirectTo to null and using signInWithPassword after signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: null },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Immediately log in the user after signup
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (loginError) {
        setError(loginError.message)
        setLoading(false)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-8 md:p-10 border border-slate-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              Create Account
            </h1>
            <p className="text-slate-400">
              Join us to automate your vendor emails
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400 text-sm font-medium">
                Account created! Redirecting...
              </p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
