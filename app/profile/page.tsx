'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserApiKeys } from '@/lib/database.types'

export default function Profile() {
  const [apiKeys, setApiKeys] = useState<UserApiKeys | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
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
        router.push('/auth/login')
        return
      }

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
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Gmail User</label>
          <input
            type="email"
            value={formData.gmail_user}
            onChange={(e) =>
              setFormData({ ...formData, gmail_user: e.target.value })
            }
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Gmail App Password
          </label>
          <input
            type="password"
            value={formData.gmail_app_password}
            onChange={(e) =>
              setFormData({ ...formData, gmail_app_password: e.target.value })
            }
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={formData.openai_api_key}
            onChange={(e) =>
              setFormData({ ...formData, openai_api_key: e.target.value })
            }
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save API Keys'}
        </button>
      </form>
    </div>
  )
}
