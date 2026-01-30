import { initializeSupabase } from '@/lib/supabase-init'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    await initializeSupabase()
    return Response.json({ success: true, message: 'Supabase initialized' })
  } catch (error) {
    console.error('[init-api] Error:', error)
    return Response.json(
      { success: false, error: 'Initialization failed' },
      { status: 500 }
    )
  }
}
