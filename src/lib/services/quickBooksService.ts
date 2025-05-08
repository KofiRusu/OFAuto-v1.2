import { QuickBooksConnect, QuickBooksRefresh, ConnectionStatus } from '../schemas/quickbooks';
import axios from 'axios';
import { env } from '@/env.mjs';

// Define token response interface
export interface QuickBooksTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  x_refresh_token_expires_in?: number;
  realmId?: string;
}

/**
 * Exchange OAuth code for access and refresh tokens
 * @param code Authorization code from OAuth flow
 * @returns Token response with access_token, refresh_token, and expires_in
 */
export async function exchangeOAuthCode(code: string): Promise<QuickBooksTokenResponse> {
  try {
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.QUICKBOOKS_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${env.QUICKBOOKS_CLIENT_ID}:${env.QUICKBOOKS_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    return response.data as QuickBooksTokenResponse;
  } catch (error) {
    console.error('Error exchanging OAuth code:', error);
    throw new Error('Failed to exchange OAuth code for tokens');
  }
}

/**
 * Refresh QuickBooks access token
 * @param refreshToken Refresh token to use
 * @returns New token response with updated access_token and refresh_token
 */
export async function refreshAccessToken(refreshToken: string): Promise<QuickBooksTokenResponse> {
  try {
    const response = await axios.post(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${env.QUICKBOOKS_CLIENT_ID}:${env.QUICKBOOKS_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    return response.data as QuickBooksTokenResponse;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Check the connection status with QuickBooks
 * @param accessToken Current access token
 * @param realmId Company ID in QuickBooks
 * @returns Connection status (CONNECTED, FAILED, PENDING)
 */
export async function getConnectionStatus(accessToken: string, realmId: string): Promise<ConnectionStatus> {
  try {
    // Make a simple API call to validate the token
    const response = await axios.get(
      `https://quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    // If we get here, the token is valid
    return 'CONNECTED';
  } catch (error) {
    // Check if it's an auth error
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return 'FAILED';
    }
    
    // For any other error, assume the connection is failing
    console.error('Error checking QuickBooks connection status:', error);
    return 'FAILED';
  }
}

/**
 * Get OAuth authorization URL for QuickBooks
 * @returns URL to redirect user for authorization
 */
export function getAuthorizationUrl(): string {
  const baseUrl = 'https://appcenter.intuit.com/connect/oauth2';
  const params = new URLSearchParams({
    client_id: env.QUICKBOOKS_CLIENT_ID,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: env.QUICKBOOKS_REDIRECT_URI,
    state: Math.random().toString(36).substring(2, 15),
  });

  return `${baseUrl}?${params.toString()}`;
} 