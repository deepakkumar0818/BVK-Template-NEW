# Zoho Token Refresh Cron Job Setup

This document explains how to set up the automatic token refresh cron job that runs every 10 minutes.

## Overview

The cron job automatically refreshes the Zoho access token every 10 minutes to prevent token expiration errors. The endpoint is located at `/api/cron/refresh-token`.

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel Deployments)

If you're deploying to Vercel, the cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-token",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Steps:**
1. Deploy your application to Vercel
2. The cron job will automatically run every 10 minutes
3. No additional configuration needed!

**Security (Optional):**
Add a `CRON_SECRET` environment variable in Vercel:
- Go to your Vercel project settings
- Add environment variable: `CRON_SECRET` with a secure random string
- The cron endpoint will verify this secret for security

### Option 2: External Cron Service

Use any external cron service to call the endpoint:

**Services:**
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)
- [UptimeRobot](https://uptimerobot.com)

**Configuration:**
- **URL:** `https://your-domain.com/api/cron/refresh-token`
- **Method:** GET or POST
- **Schedule:** Every 10 minutes (`*/10 * * * *`)
- **Headers (Optional):** `x-cron-secret: your-secret-key` (if CRON_SECRET is set)

### Option 3: Server Cron Job (Linux/Unix)

If you have server access, add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 10 minutes)
*/10 * * * * curl -X GET https://your-domain.com/api/cron/refresh-token
```

Or with secret header:
```bash
*/10 * * * * curl -X GET -H "x-cron-secret: your-secret-key" https://your-domain.com/api/cron/refresh-token
```

### Option 4: Windows Task Scheduler

For Windows servers:

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: "Daily" → "Repeat task every: 10 minutes"
4. Action: "Start a program"
5. Program: `curl.exe`
6. Arguments: `-X GET https://your-domain.com/api/cron/refresh-token`

## Environment Variables

Make sure these are set:

```env
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
CRON_SECRET=your_optional_secret_key  # Optional, for security
```

## Testing the Cron Endpoint

Test manually:

```bash
# Without secret
curl https://your-domain.com/api/cron/refresh-token

# With secret
curl -H "x-cron-secret: your-secret-key" https://your-domain.com/api/cron/refresh-token
```

Expected response:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "token_preview": "1000.abc123def456..."
}
```

## Monitoring

The cron job will:
- ✅ Refresh the token every 10 minutes
- ✅ Clear old cache before refreshing
- ✅ Return success/error status
- ✅ Log timestamp for monitoring

## Troubleshooting

**Error: "Unauthorized: Invalid cron secret"**
- Make sure `CRON_SECRET` environment variable matches the header value
- Or remove `CRON_SECRET` from environment if you don't want security check

**Error: "Missing Zoho env"**
- Ensure all Zoho environment variables are set correctly

**Token still expiring:**
- Check cron job is actually running (check logs)
- Verify the endpoint URL is correct
- Check network connectivity to Zoho API

## Schedule Format

The cron schedule `*/10 * * * *` means:
- Every 10 minutes
- Every hour
- Every day
- Every month
- Every day of week

You can customize this in `vercel.json` or your cron service.
