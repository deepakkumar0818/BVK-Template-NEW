import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/zoho'

/**
 * API endpoint to get the current Zoho access token
 * Returns the access token for client-side use
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessToken()

    return NextResponse.json({
      access_token: accessToken,
      success: true,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to get access token',
        details: err instanceof Error ? { message: err.message, stack: err.stack } : err,
        success: false,
      },
      { status: 500 }
    )
  }
}
