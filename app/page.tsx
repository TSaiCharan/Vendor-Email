'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session && data.session.user) {
        setUser(data.session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Vendor Email Automate
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Automate your vendor communications with AI-powered email management
          </p>

          {user ? (
            <div className="space-y-4">
              <p className="text-blue-100 text-lg">
                Welcome, <span className="font-semibold">{user.email}</span>
              </p>
              <button
                onClick={() => router.replace('/home')}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                href="/login"
                className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-block px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">⚡ Fast</h3>
            <p className="text-blue-100">
              Automate email responses instantly with AI
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">🔒 Secure</h3>
            <p className="text-blue-100">
              Your credentials are encrypted and safe
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">🎯 Smart</h3>
            <p className="text-blue-100">
              Personalized responses powered by OpenAI
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
