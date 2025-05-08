import axios from 'axios';
import { AuthResult } from '../BasePlatformIntegration';
import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import { axiosWithRetry } from './patreon-utils';

// Patreon OAuth2 endpoints
const PATREON_OAUTH_BASE_URL = 'https://www.patreon.com/oauth2';
const TOKEN_ENDPOINT = `https://www.patreon.com/oauth2/api/token`;
const AUTHORIZE_ENDPOINT = `${PATREON_OAUTH_BASE_URL}/authorize`;

// Required scopes for our application
const DEFAULT_SCOPES = [
  'identity',
  'identity[email]',
  'campaigns',
  'campaigns.members',
  'campaigns.posts',
];

/**
 * Generates the Patreon OAuth2 authorization URL
 * @returns URL to redirect users to for authorization
 */
export function generateAuthUrl(state?: string): string {
  const clientId = process.env.PATREON_CLIENT_ID;
  const redirectUri = process.env.PATREON_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Patreon client ID or redirect URI not configured');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: DEFAULT_SCOPES.join(' '),
  });

  if (state) {
    params.append('state', state);
  }

  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens
 * @param code Authorization code from OAuth flow
 * @returns Access token information
 */
export async function exchangeCodeForToken(
  code: string,
  platformId: string
): Promise<AuthResult> {
  try {
    const clientId = process.env.PATREON_CLIENT_ID;
    const clientSecret = process.env.PATREON_CLIENT_SECRET;
    const redirectUri = process.env.PATREON_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Patreon client ID, client secret, or redirect URI not configured');
    }

    const params = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const response = await axiosWithRetry.post(TOKEN_ENDPOINT, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 0));

    // Store the credentials securely
    const credentialService = CredentialService.getInstance();
    await credentialService.storeCredentials(platformId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiresAt.toISOString(),
      tokenType: data.token_type,
      scope: data.scope,
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenType: data.token_type,
      scope: data.scope?.split(' '),
      successful: true,
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return {
      accessToken: '',
      successful: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refreshes an expired access token using the refresh token
 * @param refreshToken Refresh token from previous authentication
 * @returns New access token information
 */
export async function refreshAccessToken(
  refreshToken: string,
  platformId: string
): Promise<AuthResult> {
  try {
    const clientId = process.env.PATREON_CLIENT_ID;
    const clientSecret = process.env.PATREON_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Patreon client ID or client secret not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await axiosWithRetry.post(TOKEN_ENDPOINT, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = response.data;
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 0));

    // Store the new credentials securely
    const credentialService = CredentialService.getInstance();
    await credentialService.storeCredentials(platformId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: expiresAt.toISOString(),
      tokenType: data.token_type,
      scope: data.scope,
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      tokenType: data.token_type,
      scope: data.scope?.split(' '),
      successful: true,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      accessToken: '',
      successful: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retrieves the access token for a platform, refreshing if necessary
 * @param platformId Platform ID to get token for
 * @returns Valid access token or null if unable to retrieve
 */
export async function getValidAccessToken(platformId: string): Promise<string | null> {
  try {
    const credentialService = CredentialService.getInstance();
    const credentials = await credentialService.getCredentials(platformId);
    
    if (!credentials.accessToken) {
      return null;
    }
    
    // Check if token needs refresh
    if (credentials.expiresAt) {
      const expiresAt = new Date(credentials.expiresAt);
      const now = new Date();
      
      // If token is expired or about to expire in the next 5 minutes
      if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        if (!credentials.refreshToken) {
          return null;
        }
        
        const refreshResult = await refreshAccessToken(credentials.refreshToken, platformId);
        if (!refreshResult.successful) {
          return null;
        }
        
        return refreshResult.accessToken;
      }
    }
    
    return credentials.accessToken;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    return null;
  }
} 