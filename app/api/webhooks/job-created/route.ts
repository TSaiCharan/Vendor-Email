import { processNextJob } from '@/lib/job-processor'
import { createClient } from '@supabase/supabase-js'

// Maximum execution time for this function
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('x-supabase-signature')
    
    console.log('[webhooks] Job created webhook triggered')

    const body = await req.json()
    console.log('[webhooks] Webhook payload:', body.type)

    // Get API keys from database for this user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Extract user_id from the webhook payload or request context
    const userId = body.record?.user_id

    if (!userId) {
      console.warn('[webhooks] No user_id in webhook payload')
      return Response.json({ success: false, error: 'No user_id' }, { status: 400 })
    }

    // Fetch API keys for this user
    const { data: apiKeys, error: keysError } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (keysError || !apiKeys) {
      console.warn('[webhooks] No API keys found for user:', userId)
      // Still try to process without API keys (for local development)
      await processNextJob()
      return Response.json({ success: true, processed: false, reason: 'No API keys' })
    }

    // Process the job
    console.log('[webhooks] Processing job for user:', userId)
    const result = await processNextJob(
      apiKeys.openai_api_key,
      apiKeys.gmail_user,
      apiKeys.gmail_app_password
    )

    console.log('[webhooks] Processing result:', result)

    return Response.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('[webhooks] Error processing webhook:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
