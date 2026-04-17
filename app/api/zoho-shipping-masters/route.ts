import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, clearTokenCache } from '@/lib/zoho'

// Zoho Creator API (India DC) - Shipping Masters report
const CREATOR_BASE = 'https://www.zohoapis.in/creator/v2.1/data'
const OWNER_NAME = 'bvkinfrasoftservicespvtltd'
const APP_LINK_NAME = 'machine-master2'
const REPORT_LINK_NAME = 'All_Shipping_Masters'

async function fetchShippingMasters(accessToken: string, accountId: string): Promise<Response> {
  const criteria = `Account_ID == "${accountId}"`
  
  const url = new URL(
    `${CREATOR_BASE}/${OWNER_NAME}/${APP_LINK_NAME}/report/${REPORT_LINK_NAME}`
  )
  url.searchParams.set('max_records', '200')
  url.searchParams.set('field_config', 'all')
  url.searchParams.set('criteria', criteria)

  return fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      Accept: 'application/json',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id') || ''

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id parameter is required' },
        { status: 400 }
      )
    }

    let accessToken = await getAccessToken()

    // First attempt
    let response = await fetchShippingMasters(accessToken, accountId)
    let data = await response.json()

    // If we get an authorization error (401/403), try refreshing the token once
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      const errorCode = data?.code
      
      if (errorCode === 1030 || response.status === 401 || response.status === 403) {
        clearTokenCache()
        accessToken = await getAccessToken(true)
        
        // Retry with fresh token
        response = await fetchShippingMasters(accessToken, accountId)
        data = await response.json()
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Zoho Creator API error', 
          details: data,
          status: response.status 
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to fetch Shipping Masters',
        details: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      },
      { status: 500 }
    )
  }
}
