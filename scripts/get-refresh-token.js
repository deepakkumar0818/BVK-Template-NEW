/**
 * Zoho Refresh Token Generator Script
 * 
 * This script helps you exchange an authorization code for a refresh token.
 * 
 * Usage:
 * 1. Get authorization code from Step 3 in ZOHO_OAUTH_SETUP.md
 * 2. Run: node scripts/get-refresh-token.js
 * 3. Follow the prompts
 */

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
  console.log('\n=== Zoho Refresh Token Generator ===\n');
  console.log('This script will help you get your refresh token.\n');
  console.log('Prerequisites:');
  console.log('1. You have created a Zoho API Client');
  console.log('2. You have obtained an authorization code from the OAuth flow\n');
  
  const clientId = await question('Enter your Client ID: ');
  if (!clientId) {
    console.error('❌ Client ID is required');
    rl.close();
    return;
  }

  const clientSecret = await question('Enter your Client Secret: ');
  if (!clientSecret) {
    console.error('❌ Client Secret is required');
    rl.close();
    return;
  }

  const authCode = await question('Enter the authorization code (from redirect URL): ');
  if (!authCode) {
    console.error('❌ Authorization code is required');
    rl.close();
    return;
  }

  const redirectUri = await question('Enter redirect URI (default: http://localhost:3000/api/zoho-callback): ') || 'http://localhost:3000/api/zoho-callback';

  console.log('\n⏳ Exchanging authorization code for tokens...\n');

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
      console.log('✅ Success! Tokens received.\n');
      console.log('📋 Add these to your .env.local file:\n');
      console.log('─'.repeat(60));
      console.log(`ZOHO_CLIENT_ID=${clientId}`);
      console.log(`ZOHO_CLIENT_SECRET=${clientSecret}`);
      console.log(`ZOHO_REFRESH_TOKEN=${data.refresh_token}`);
      console.log('─'.repeat(60));
      console.log('\n📝 Token Details:');
      console.log(`   Access Token: ${data.access_token.substring(0, 30)}...`);
      console.log(`   Refresh Token: ${data.refresh_token.substring(0, 30)}...`);
      console.log(`   Expires In: ${data.expires_in || data.expires_in_sec} seconds`);
      console.log(`   Token Type: ${data.token_type}`);
      console.log('\n⚠️  Keep these credentials secure and never commit them to git!\n');
    } else {
      console.error('❌ Error exchanging authorization code:\n');
      console.error(JSON.stringify(data, null, 2));
      console.log('\n💡 Common issues:');
      console.log('   - Authorization code may have expired (get a new one)');
      console.log('   - Redirect URI doesn\'t match the registered one');
      console.log('   - Client ID or Client Secret is incorrect');
      console.log('   - Code was already used (can only be used once)\n');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('\n💡 Check your internet connection and try again.\n');
  }

  rl.close();
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  rl.close();
  process.exit(1);
});
