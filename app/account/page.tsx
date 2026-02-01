'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserApiKeys } from '@/lib/database.types'
import { CreateJobDialog } from '@/components/create-job-dialog'
import { UserDropdown } from '@/components/user-dropdown'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [apiKeys, setApiKeys] = useState<UserApiKeys | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    gmail_user: '',
    gmail_app_password: '',
    openai_api_key: '',
  })

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching API keys:', error)
      } else if (data) {
        setApiKeys(data)
        setFormData({
          gmail_user: data.gmail_user,
          gmail_app_password: data.gmail_app_password,
          openai_api_key: data.openai_api_key,
        })
      }

      setLoading(false)
    }

    fetchUserData()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    if (apiKeys) {
      const { error } = await supabase
        .from('user_api_keys')
        .update(formData)
        .eq('user_id', user.id)

      if (error) {
        setMessage('Error updating keys')
      } else {
        setMessage('API keys updated successfully!')
      }
    } else {
      const { error } = await supabase.from('user_api_keys').insert([
        {
          user_id: user.id,
          ...formData,
        },
      ])

      if (error) {
        setMessage('Error saving keys')
      } else {
        setMessage('API keys saved successfully!')
      }
    }

    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-slate-100 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Account Settings</h1>
              <p className="text-indigo-100 mt-1">{user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/home">
                <Button variant="ghost" className="text-white hover:bg-indigo-700">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <UserDropdown email={user?.email} />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-8 flex justify-end">
              <CreateJobDialog />
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              API Configuration
            </h2>

            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  message.includes('successfully')
                    ? 'bg-green-900/20 border-green-800'
                    : 'bg-red-900/20 border-red-800'
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    message.includes('successfully')
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {message}
                </p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Gmail User */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Gmail Email Address
                </label>
                <input
                  type="email"
                  placeholder="your-email@gmail.com"
                  value={formData.gmail_user}
                  onChange={(e) =>
                    setFormData({ ...formData, gmail_user: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-400 mt-2">
                  The Gmail account to send emails from
                </p>
              </div>

              {/* Gmail App Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Gmail App Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your Gmail app password"
                    value={formData.gmail_app_password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gmail_app_password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Generate from{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    Google Account Settings
                  </a>
                </p>
              </div>

              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={formData.openai_api_key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        openai_api_key: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Get from{' '}
                  <a
                    href="https://platform.openai.com/account/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition mt-8"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
