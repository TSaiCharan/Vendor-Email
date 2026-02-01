import { NextResponse } from "next/server"
import { supabase } from '@/lib/supabase'
import type { Job } from '@/lib/types'

// Helper to get Chicago time (UTC-6 or UTC-5 depending on DST)
function getChicagoDate(): Date {
  const now = new Date()
  const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }))
  return chicagoTime
}

// Get today's date in YYYY-MM-DD format (Chicago time)
function getTodayDateString(): string {
  const today = getChicagoDate()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get("date")

    // determine date to read: use provided or default to today (Chicago time)
    const dateToRead = dateParam || getTodayDateString()
    const filePath = `${dateToRead}.json`

    // Read from Supabase storage
    const { data, error } = await supabase.storage
      .from('jobs')
      .download(filePath)

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ success: true, jobs: [] })
      }
      console.error('[jobs-api] Error reading jobs file:', error)
      return NextResponse.json({ success: true, jobs: [] })
    }

    if (!data) {
      return NextResponse.json({ success: true, jobs: [] })
    }

    const text = await data.text()
    let jobs: Job[] = []
    try {
      jobs = JSON.parse(text)
    } catch (e) {
      console.error('[jobs-api] Failed to parse jobs file:', e)
      return NextResponse.json({ success: false, error: "Failed to parse jobs file" }, { status: 500 })
    }

    // Ensure jobs is an array
    if (!Array.isArray(jobs)) jobs = []

    return NextResponse.json({ success: true, jobs })
  } catch (err) {
    console.error('[jobs-api] Error:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
