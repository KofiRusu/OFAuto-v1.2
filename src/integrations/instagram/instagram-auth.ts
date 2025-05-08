import { AuthResult } from '../BasePlatformIntegration';
import fetch from 'node-fetch';

// Instagram/Facebook OAuth endpoints
const INSTAGRAM_AUTH_URL = 'https://api.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const FB_GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

export interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  userId?: string;
  expiresAt?: Date;
}

export class InstagramAuth {
  private config: InstagramConfig;
  
  constructor(config: InstagramConfig) {
    this.config = config;
  }

  /**
   * Generate the OAuth authorization URL for Instagram
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
    });
    
    return `${INSTAGRAM_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from OAuth flow
   */
  async getAccessToken(code: string): Promise<AuthResult> {
    try {
      // First get the short-lived token
      const formData = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code,
      });
      
      const response = await fetch(INSTAGRAM_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Instagram auth error:', errorText);
        return {
          accessToken: '',
          successful: false,
          error: `Instagram auth failed: ${response.status} ${errorText}`,
        };
      }

      const shortLivedData = await response.json() as InstagramTokenResponse;
      
      // Exchange for a long-lived token
      const longLivedTokenResult = await this.exchangeForLongLivedToken(shortLivedData.access_token);
      
      if (!longLivedTokenResult.successful) {
        return longLivedTokenResult;
      }
      
      // Update config with user ID
      this.config.userId = shortLivedData.user_id;
      
      return longLivedTokenResult;
    } catch (error) {
      console.error('Instagram auth error:', error);
      return {
        accessToken: '',
        successful: false,
        error: `Instagram auth exception: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Exchange short-lived token for a long-lived token (60 days)
   */
  private async exchangeForLongLivedToken(shortLivedToken: string): Promise<AuthResult> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.config.clientSecret,
        access_token: shortLivedToken,
      });
      
      const response = await fetch(`${FB_GRAPH_API_URL}/oauth/access_token?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Instagram long-lived token error:', errorText);
        return {
          accessToken: '',
          successful: false,
          error: `Instagram long-lived token failed: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json() as InstagramLongLivedTokenResponse;
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
      
      // Update config with new token
      this.config.accessToken = data.access_token;
      this.config.expiresAt = expiresAt;
      
      return {
        accessToken: data.access_token,
        expiresAt,
        tokenType: data.token_type,
        successful: true,
      };
    } catch (error) {
      console.error('Instagram long-lived token error:', error);
      return {
        accessToken: '',
        successful: false,
        error: `Instagram long-lived token exception: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Refresh the long-lived token
   */
  async refreshLongLivedToken(token: string): Promise<AuthResult> {
    try {
      const params = new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: token,
      });
      
      const response = await fetch(`${FB_GRAPH_API_URL}/oauth/access_token?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Instagram token refresh error:', errorText);
        return {
          accessToken: '',
          successful: false,
          error: `Instagram token refresh failed: ${response.status} ${errorText}`,
        };
      }
      
      const data = await response.json() as InstagramLongLivedTokenResponse;
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
      
      // Update config with new token
      this.config.accessToken = data.access_token;
      this.config.expiresAt = expiresAt;
      
      return {
        accessToken: data.access_token,
        expiresAt,
        tokenType: data.token_type,
        successful: true,
      };
    } catch (error) {
      console.error('Instagram token refresh error:', error);
      return {
        accessToken: '',
        successful: false,
        error: `Instagram token refresh exception: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate the current access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      // Try to get user info to validate the token
      const response = await fetch(`${FB_GRAPH_API_URL}/me?access_token=${accessToken}`);
      return response.ok;
    } catch (error) {
      console.error('Instagram token validation error:', error);
      return false;
    }
  }
} 