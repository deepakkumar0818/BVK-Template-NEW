import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, clearTokenCache } from '@/lib/zoho'

/**
 * Zoho Creator API (India DC) - Account Module Report.
 * Same app as quotations/sales orders (machine-master2), different report:
 * All_Account_Modules. Isolated route — used only by the sls-ods-no-44
 * "Application" lookup (search by the sales order's linked Account_Module.ID,
 * then read the matched record's Application field).
 */
const CREATOR_BASE = 'https://www.zohoapis.in/creator/v2.1/data'
const OWNER_NAME = 'bvkinfrasoftservicespvtltd'
const APP_LINK_NAME = 'machine-master2'
const REPORT_LINK_NAME = 'All_Account_Modules'

async function fetchAccountModules(accessToken: string, searchParams: URLSearchParams): Promise<Response> {
  const id = searchParams.get('id') || ''
  const max_records = searchParams.get('max_records') || '200'
  const field_config = searchParams.get('field_config') || 'all'
  const criteriaParam = searchParams.get('criteria') || ''
  const fields = searchParams.get('fields') || ''
  const privatelink = searchParams.get('privatelink') || ''

  const criteria = id ? `ID == ${id}` : criteriaParam

  const url = new URL(
    `${CREATOR_BASE}/${OWNER_NAME}/${APP_LINK_NAME}/report/${REPORT_LINK_NAME}`
  )
  url.searchParams.set('max_records', max_records)
  url.searchParams.set('field_config', field_config)
  if (criteria) url.searchParams.set('criteria', criteria)
  if (fields) url.searchParams.set('fields', fields)
  if (privatelink) url.searchParams.set('privatelink', privatelink)

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
    let accessToken = await getAccessToken()

    let response = await fetchAccountModules(accessToken, searchParams)
    let data = await response.json()

    if (!response.ok && (response.status === 401 || response.status === 403)) {
      const errorCode = data?.code
      if (errorCode === 1030 || response.status === 401 || response.status === 403) {
        clearTokenCache()
        accessToken = await getAccessToken(true)
        response = await fetchAccountModules(accessToken, searchParams)
        data = await response.json()
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Zoho Creator API error',
          details: data,
          status: response.status,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to fetch Account Module',
        details: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      },
      { status: 500 }
    )
  }
}
