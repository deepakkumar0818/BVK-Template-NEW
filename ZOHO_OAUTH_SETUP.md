# Zoho OAuth Setup Guide - How to Generate Access Token

## Overview

The application uses **OAuth 2.0** to authenticate with Zoho APIs. The access token is generated using a **refresh token** that you need to obtain once through the OAuth authorization flow.

## How Access Token Generation Works

### Current Implementation (Using Refresh Token)

The application currently uses a **refresh token** to automatically generate new access tokens. Here's how it works:

1. **Refresh Token** (stored in `.env.local`) - Long-lived token that doesn't expire
2. **Access Token** (generated automatically) - Short-lived token (expires in ~1 hour)
3. **Automatic Refresh** - When access token expires, the system automatically uses refresh token to get a new one

### Flow Diagram

```
┌─────────────────┐
│  Refresh Token  │ (Stored in .env.local - obtained once via OAuth)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  POST to Zoho Token URL             │
│  https://accounts.zoho.in/oauth/    │
│  v2/token                           │
│                                     │
│  Body:                              │
│  - refresh_token                    │
│  - client_id                        │
│  - client_secret                    │
│  - grant_type: refresh_token        │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────┐
│  Access Token   │ (Valid for ~1 hour)
└─────────────────┘
```

## Step-by-Step: Getting Your Initial Refresh Token

### Step 1: Create a Zoho API Client

1. Go to [Zoho API Console (India)](https://api-console.zoho.in/)
2. Click **"Add Client"** or **"Create Client"**
3. Select **"Server-based Applications"**
4. Fill in the details:
   - **Client Name**: `Quotation Template App` (or any name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorized Redirect URIs**: 
     - `http://localhost:3000/api/zoho-callback` (for development)
     - `https://your-production-domain.com/api/zoho-callback` (for production)
5. Click **"Create"**
6. **Copy and save**:
   - **Client ID** (you'll need this)
   - **Client Secret** (you'll need this)

### Step 2: Generate Authorization URL

Construct this URL with your Client ID:

```
https://accounts.zoho.in/oauth/v2/auth?
  scope=ZohoCreator.data.READ,ZohoCreator.data.CREATE&
  client_id=YOUR_CLIENT_ID&
  response_type=code&
  redirect_uri=http://localhost:3000/api/zoho-callback&
  access_type=offline
```

**Important Parameters:**
- `scope`: `ZohoCreator.data.READ,ZohoCreator.data.CREATE` (or your required scopes)
- `client_id`: Your Client ID from Step 1
- `response_type`: Must be `code`
- `redirect_uri`: Must match the one you registered
- `access_type`: Must be `offline` (to get refresh token)

### Step 3: Authorize and Get Authorization Code

1. Open the URL from Step 2 in your browser
2. Log in to your Zoho account
3. Click **"Accept"** to authorize the application
4. You'll be redirected to: `http://localhost:3000/api/zoho-callback?code=AUTHORIZATION_CODE`
5. **Copy the `code` parameter** from the URL (this is your authorization code)

### Step 4: Exchange Authorization Code for Refresh Token

Make a POST request to exchange the authorization code for tokens:

**URL:**
```
https://accounts.zoho.in/oauth/v2/token
```

**Method:** POST

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Body (URL-encoded):**
```
grant_type=authorization_code
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=http://localhost:3000/api/zoho-callback
&code=AUTHORIZATION_CODE_FROM_STEP_3
```

**Example using cURL:**
```bash
curl -X POST https://accounts.zoho.in/oauth/v2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost:3000/api/zoho-callback" \
  -d "code=AUTHORIZATION_CODE"
```

**Response:**
```json
{
  "access_token": "1000.abc123def456...",
  "refresh_token": "1000.xyz789uvw012...",
  "expires_in": 3600,
  "expires_in_sec": 3600,
  "token_type": "Bearer",
  "api_domain": "www.zohoapis.in"
}
```

### Step 5: Save Refresh Token to Environment Variables

Add these to your `.env.local` file:

```env
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REFRESH_TOKEN=your_refresh_token_here
```

**⚠️ Important:**
- Never commit `.env.local` to git
- The refresh token is long-lived and doesn't expire (unless revoked)
- Keep it secure!

## How the Application Uses These Tokens

### Automatic Access Token Generation

The application automatically generates access tokens using the refresh token:

**File:** `lib/zoho.ts`

```typescript
export async function getAccessToken(forceRefresh = false): Promise<string> {
  // 1. Get credentials from environment
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET

  // 2. Check if cached token is still valid
  if (!forceRefresh && cached && cached.expires_at > now) {
    return cached.access_token  // Return cached token
  }

  // 3. Exchange refresh token for new access token
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  // 4. Cache the new access token
  cached = {
    access_token: data.access_token,
    expires_at: now + expiresInMs - SAFETY_BUFFER_MS,
  }

  return data.access_token
}
```

### Token Caching

- Access tokens are **cached in memory** to avoid unnecessary API calls
- Tokens are refreshed **5 minutes before expiry** (safety buffer)
- If a token expires, it's automatically refreshed on the next API call

## Quick Setup Script

You can create a helper script to automate Step 4. Create `scripts/get-refresh-token.js`:

```javascript
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('=== Zoho Refresh Token Generator ===\n');
  
  const clientId = await question('Enter your Client ID: ');
  const clientSecret = await question('Enter your Client Secret: ');
  const authCode = await question('Enter the authorization code from Step 3: ');
  const redirectUri = await question('Enter redirect URI (default: http://localhost:3000/api/zoho-callback): ') || 'http://localhost:3000/api/zoho-callback';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: authCode,
  });

  try {
    const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Success! Add these to your .env.local:\n');
      console.log(`ZOHO_CLIENT_ID=${clientId}`);
      console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`);
      console.log(`ZOHO_REFRESH_TOKEN=${data.refresh_token}`);
    } else {
      console.error('\n❌ Error:', data);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }

  rl.close();
}

main();
```

Run it:
```bash
node scripts/get-refresh-token.js
```

## Troubleshooting

### Error: "Invalid Grant"
- Authorization code may have expired (they expire quickly)
- Redirect URI doesn't match
- Code was already used (can only be used once)

**Solution:** Repeat Step 3 to get a new authorization code

### Error: "Invalid Client"
- Client ID or Client Secret is incorrect
- Client was deleted or disabled

**Solution:** Verify credentials in Zoho API Console

### Error: "Refresh Token Expired"
- Refresh token was revoked in Zoho
- Account permissions changed

**Solution:** Repeat the entire OAuth flow (Steps 1-5)

## Required Scopes

For Zoho Creator API access, you need these scopes:
- `ZohoCreator.data.READ` - Read data from Creator apps
- `ZohoCreator.data.CREATE` - Create data in Creator apps (if needed)

Add more scopes separated by commas in the authorization URL.

## Security Best Practices

1. ✅ Store credentials in `.env.local` (never commit to git)
2. ✅ Use different Client IDs for development and production
3. ✅ Regularly rotate refresh tokens if possible
4. ✅ Monitor token usage in Zoho API Console
5. ✅ Use HTTPS in production redirect URIs

## Summary

1. **One-time setup**: Get refresh token via OAuth flow (Steps 1-5)
2. **Automatic**: Application uses refresh token to get access tokens automatically
3. **Cached**: Access tokens are cached and refreshed before expiry
4. **No manual intervention**: Once set up, tokens refresh automatically

The refresh token is your "master key" - keep it secure and never expose it publicly!
