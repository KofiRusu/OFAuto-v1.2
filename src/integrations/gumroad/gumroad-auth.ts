import { AuthResult } from '../BasePlatformIntegration';
import fetch from 'node-fetch';

// Gumroad OAuth2 endpoints
const GUMROAD_AUTH_URL = 'https://gumroad.com/oauth/authorize';
const GUMROAD_TOKEN_URL = 'https://api.gumroad.com/oauth/token';

// Gumroad API base URL
const GUMROAD_API_BASE = 'https://api.gumroad.com/v2';

export interface GumroadTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

export interface GumroadConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
}

export class GumroadAuth {
  private config: GumroadConfig;
  
  constructor(config: GumroadConfig) {
    this.config = config;
  }

  /**
   * Generate the OAuth authorization URL for Gumroad
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
    });
    
    return `${GUMROAD_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from OAuth flow
   */
  async getAccessToken(code: string): Promise<AuthResult> {
    try {
      const response = await fetch(GUMROAD_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gumroad auth error:', errorText);
        return {
          accessToken: '',
          successful: false,
          error: `Gumroad auth failed: ${response.status} ${errorText}`,
        };
      }

      const data = await response.json() as GumroadTokenResponse;
      
      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: [data.scope],
        successful: true,
      };
    } catch (error) {
      console.error('Gumroad auth error:', error);
      return {
        accessToken: '',
        successful: false,
        error: `Gumroad auth exception: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate the current access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      // Try to fetch user data to validate the token
      const response = await fetch(`${GUMROAD_API_BASE}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Gumroad token validation error:', error);
      return false;
    }
  }
} 