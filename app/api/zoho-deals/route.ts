import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, clearTokenCache } from '@/lib/zoho'

// Zoho CRM v8 — Get Records / Get a Record by ID
// Docs: https://www.zoho.com/crm/developer/docs/api/v8/get-records.html
// India DC → www.zohoapis.in
const CRM_BASE = 'https://www.zohoapis.in/crm/v8'
const MODULE_API_NAME = 'Deals'

async function fetchDeal(accessToken: string, id: string, fieldsParam: string): Promise<Response> {
  // Path variant hits the single-record endpoint when an id is given;
  // falls back to the list endpoint otherwise (client can pass criteria
  // or paging params later if needed).
  const url = id
    ? new URL(`${CRM_BASE}/${MODULE_API_NAME}/${encodeURIComponent(id)}`)
    : new URL(`${CRM_BASE}/${MODULE_API_NAME}`)

  // `fields` is required on Get Records in v8. Default to a broad set
  // so callers who just want to poke at the record don't have to know
  // every field name upfront.
  const defaultFields =
    'id,Deal_Name,Stage,Amount,Closing_Date,Account_Name,Contact_Name,Owner,' +
    'Description,Created_Time,Modified_Time,Probability,Type,Lead_Source,' +
    'Next_Step,Expected_Revenue'
  url.searchParams.set('fields', fieldsParam || defaultFields)

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
    const id = (searchParams.get('id') || '').trim()
    const fieldsParam = (searchParams.get('fields') || '').trim()

    // Zoho CRM v8 can return `204 No Content` with an EMPTY body when
    // the record doesn't exist or matches nothing — calling `.json()`
    // on an empty body throws `Unexpected end of JSON input`. Read the
    // body as text first, then parse only if it's non-empty.
    const safeJson = async (r: Response): Promise<unknown> => {
      const raw = await r.text()
      if (!raw) return null
      try {
        return JSON.parse(raw)
      } catch {
        return { _rawBody: raw }
      }
    }

    let accessToken = await getAccessToken()

    // First attempt
    let response = await fetchDeal(accessToken, id, fieldsParam)
    let data = await safeJson(response)

    // Auth failure → refresh token once, retry
    if (!response.ok && (response.status === 401 || response.status === 403)) {
      const errorCode = (data as { code?: unknown })?.code
      if (
        errorCode === 'INVALID_TOKEN' ||
        errorCode === 1030 ||
        response.status === 401 ||
        response.status === 403
      ) {
        clearTokenCache()
        accessToken = await getAccessToken(true)
        response = await fetchDeal(accessToken, id, fieldsParam)
        data = await safeJson(response)
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Zoho CRM API error',
          details: data,
          status: response.status,
        },
        { status: response.status }
      )
    }

    // 204 No Content or empty body → surface an informative payload
    // instead of a bare `null` so the caller can tell what happened.
    if (data == null) {
      return NextResponse.json(
        {
          data: null,
          note: `Zoho CRM returned ${response.status} with an empty body — likely means the Deal id was not found or the token lacks CRM scope.`,
          requestedId: id,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to fetch Deal',
        details: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      },
      { status: 500 }
    )
  }
}
