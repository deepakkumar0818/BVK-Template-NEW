import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken, clearTokenCache } from '@/lib/zoho'

// Zoho CRM v8 — Get Records / Get a Record by ID (Contacts module).
// Docs: https://www.zoho.com/crm/developer/docs/api/v8/get-records.html
// India DC → www.zohoapis.in
const CRM_BASE = 'https://www.zohoapis.in/crm/v8'
const MODULE_API_NAME = 'Contacts'

async function fetchContact(accessToken: string, id: string, fieldsParam: string): Promise<Response> {
  const url = id
    ? new URL(`${CRM_BASE}/${MODULE_API_NAME}/${encodeURIComponent(id)}`)
    : new URL(`${CRM_BASE}/${MODULE_API_NAME}`)

  // `fields` is required on the list endpoint in v8; harmless on the
  // single-record endpoint. Default set covers everything a
  // quotation/invoice template is likely to need.
  const defaultFields =
    'id,First_Name,Last_Name,Full_Name,Email,Phone,Mobile,Salutation,Title,' +
    'Department,Account_Name,Mailing_Street,Mailing_City,Mailing_State,' +
    'Mailing_Zip,Mailing_Country,Owner,Description,Created_Time,Modified_Time'
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

    // Same empty-body guard as /api/zoho-deals — Zoho v8 can return
    // 204 No Content with no JSON body when the id isn't found.
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

    let response = await fetchContact(accessToken, id, fieldsParam)
    let data = await safeJson(response)

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
        response = await fetchContact(accessToken, id, fieldsParam)
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

    if (data == null) {
      return NextResponse.json(
        {
          data: null,
          note: `Zoho CRM returned ${response.status} with an empty body — likely means the Contact id was not found or the token lacks CRM scope.`,
          requestedId: id,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to fetch Contact',
        details: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      },
      { status: 500 }
    )
  }
}
