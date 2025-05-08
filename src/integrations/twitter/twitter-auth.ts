import { AuthResult } from '../BasePlatformIntegration';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Twitter OAuth2 endpoints
const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';

// Twitter API base URL
const TWITTER_API_BASE = 'https://api.twitter.com/2';

export interface TwitterTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface TwitterConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export class TwitterAuth {
  private config: TwitterConfig;
  private codeVerifier: string;
  
  constructor(config: TwitterConfig) {
    this.config = config;
    this.codeVerifier = this.generateCodeVerifier();
  }

  /**
   * Generate the OAuth authorization URL for Twitter
   */
  async getAuthUrl(): Promise<string> {
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state: crypto.randomBytes(16).toString('hex'),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    
    return `${TWITTER_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from OAuth flow
   */
  async getAccessToken(code: string): Promise<AuthResult> {
    try {
      const params = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        code_verifier: this.codeVerifier,
      });
      
      const response = await fetch(TWITTER_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twitter auth error:', errorText);
        return {
          accessToken: '',
          successful: false,
          error: `Twitter auth failed: ${response.status} ${errorText}`,
        };
      }

      const data = await response.json() as TwitterTokenResponse;
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
      
      // Update config with new tokens
      this.config.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      this.config.expiresAt = expiresAt;
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        tokenType: data.token_type,
        scope: data.scope.split(' '),
        successful: true,
      };
    } catch (error) {
      console.error('Twitter auth error:', error);
      return {
        accessToken: '',
        successful: false,
        error: `Twitter auth exception: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<AuthResult> {
    if (!this.config.refreshToken) {
      return {
        accessToken: '',
        successful: false,
        error: 'No refresh token available',
      };
    }
    
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
      });
      
      const response = await fetch(TWITTER_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Twitter token refresh error:', errorText);
        return {
          accessToken: '',
          successful: false,
          error: `Twitter token refresh failed: ${response.status} ${errorText}`,
        };
      }

      const data = await response.json() as TwitterTokenResponse;
      const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
      
      // Update config with new tokens
      this.config.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      this.config.expiresAt = expiresAt;
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        tokenType: data.token_type,
        scope: data.scope.split(' '),
        successful: true,
      };
    } catch (error) {
      console.error('Twitter token refresh error:', error);
      return {
        accessToken: '',
        successful: false,
        error: `Twitter token refresh exception: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate the current access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      // Try to fetch user data to validate the token
      const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Twitter token validation error:', error);
      return false;
    }
  }

  /**
   * Generate a random code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate code challenge from code verifier for PKCE
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return Buffer.from(hash).toString('base64url');
  }
} 