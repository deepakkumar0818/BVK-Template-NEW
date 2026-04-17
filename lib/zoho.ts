const ZOHO_TOKEN_URL = 'https://accounts.zoho.in/oauth/v2/token'
const SAFETY_BUFFER_MS = 5 * 60 * 1000 // Refresh 5 minutes before expiry
const CRON_REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes for cron job

let cached: { access_token: string; expires_at: number } | null = null
let lastRefreshTime: number = 0

/**
 * Clears the cached token (useful when token is invalid/expired)
 */
export function clearTokenCache(): void {
  cached = null
  lastRefreshTime = 0
}

/**
 * Gets the last refresh time (useful for monitoring)
 */
export function getLastRefreshTime(): number {
  return lastRefreshTime
}

/**
 * Checks if token needs refresh based on cron interval
 */
export function shouldRefreshForCron(): boolean {
  const now = Date.now()
  return !lastRefreshTime || (now - lastRefreshTime) >= CRON_REFRESH_INTERVAL_MS
}

export async function getAccessToken(forceRefresh = false): Promise<string> {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Missing Zoho env: ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET')
  }

  const now = Date.now()
  
  // Return cached token if it's still valid and not forcing refresh
  if (!forceRefresh && cached && cached.expires_at > now) {
    return cached.access_token
  }

  // Clear cache if forcing refresh or token expired
  if (forceRefresh || (cached && cached.expires_at <= now)) {
    cached = null
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })

  const res = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()

  if (!res.ok) {
    // Clear cache on error
    cached = null
    throw new Error(`Zoho token error: ${JSON.stringify(data)}`)
  }

  // Use actual expires_in from Zoho response (in seconds), convert to milliseconds
  // Default to 3600 seconds (1 hour) if not provided
  const expiresInSeconds = data.expires_in_sec || data.expires_in || 3600
  const expiresInMs = expiresInSeconds * 1000

  cached = {
    access_token: data.access_token,
    // Set expiry with safety buffer (refresh 5 minutes before actual expiry)
    expires_at: now + expiresInMs - SAFETY_BUFFER_MS,
  }

  // Update last refresh time for cron monitoring
  lastRefreshTime = now

  return data.access_token
}
