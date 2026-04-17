import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, clearTokenCache } from '@/lib/zoho'

/**
 * Cron job endpoint to refresh Zoho access token every 10 minutes
 * 
 * This endpoint should be called by:
 * - Vercel Cron (if deployed on Vercel): Add to vercel.json
 * - External cron service (cron-job.org, EasyCron, etc.)
 * - Server cron job
 * 
 * Security: Add a secret header to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const cronSecret = request.headers.get('x-cron-secret')
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid cron secret' },
        { status: 401 }
      )
    }

    // Force refresh the token
    clearTokenCache()
    const accessToken = await getAccessToken(true)

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
      token_preview: accessToken.substring(0, 20) + '...',
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to refresh token',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for cron services that use POST
export async function POST(request: NextRequest) {
  return GET(request)
}
