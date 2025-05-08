import { prisma } from '@/lib/prisma';
import { decryptCredential } from '@/lib/security';
import { logger } from '@/lib/logger';

interface TwitterCredentials {
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: number;
  apiKey: string;
  apiSecret: string;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified: boolean;
  followers_count: number;
  following_count: number;
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    urls?: Array<{ url: string; expanded_url: string }>;
  };
}

export interface TwitterScheduledTweet {
  id: string;
  text: string;
  scheduled_time: string;
}

export class TwitterClient {
  private accessToken: string | null = null;
  private accessTokenExpiry: number | null = null;
  private refreshToken: string | null = null;
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private clientId: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Initialize the client by fetching and decrypting credentials
   */
  async initialize() {
    logger.debug({ clientId: this.clientId }, 'Initializing Twitter client');
    
    const credential = await prisma.clientCredential.findUnique({
      where: { 
        clientId_platformType: { 
          clientId: this.clientId, 
          platformType: 'twitter'
        } 
      },
    });

    if (!credential) {
      logger.error({ clientId: this.clientId }, 'Twitter credentials not found');
      throw new Error('Twitter credentials not found');
    }

    const decrypted = decryptCredential({
      encrypted: credential.credential,
      iv: credential.iv,
      authTag: credential.authTag,
    });

    if (!decrypted) {
      logger.error({ clientId: this.clientId }, 'Failed to decrypt Twitter credentials');
      throw new Error('Failed to decrypt Twitter credentials');
    }

    const credentials = JSON.parse(decrypted) as TwitterCredentials;
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken || null;
    this.accessTokenExpiry = credentials.tokenExpiry || null;
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    
    // Check if the access token is expired and refresh if needed
    if (this.accessTokenExpiry && this.refreshToken) {
      const now = Date.now();
      if (now >= this.accessTokenExpiry) {
        await this.refreshAccessToken();
      }
    }
    
    logger.debug({ clientId: this.clientId }, 'Twitter client initialized successfully');
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken() {
    logger.debug({ clientId: this.clientId }, 'Refreshing Twitter access token');
    
    if (!this.refreshToken || !this.apiKey || !this.apiSecret) {
      logger.error({ clientId: this.clientId }, 'Missing refresh token or API credentials');
      throw new Error('Missing refresh token or API credentials');
    }

    try {
      const tokenEndpoint = 'https://api.twitter.com/oauth2/token';
      const authString = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authString}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || this.refreshToken;
      this.accessTokenExpiry = Date.now() + (data.expires_in * 1000);

      // Update the stored credentials
      await this.updateStoredCredentials();
      
      logger.debug({ clientId: this.clientId }, 'Twitter access token refreshed successfully');
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error refreshing Twitter access token');
      throw error;
    }
  }

  /**
   * Update the stored credentials in the database
   */
  private async updateStoredCredentials() {
    logger.debug({ clientId: this.clientId }, 'Updating stored Twitter credentials');
    
    const credentials: TwitterCredentials = {
      accessToken: this.accessToken!,
      apiKey: this.apiKey!,
      apiSecret: this.apiSecret!,
    };

    if (this.refreshToken) {
      credentials.refreshToken = this.refreshToken;
    }

    if (this.accessTokenExpiry) {
      credentials.tokenExpiry = this.accessTokenExpiry;
    }

    const credentialToEncrypt = JSON.stringify(credentials);
    const encryptedData = encryptedData = require('@/lib/security').encryptCredential(credentialToEncrypt);

    if (!encryptedData) {
      logger.error({ clientId: this.clientId }, 'Failed to encrypt updated Twitter credentials');
      throw new Error('Failed to encrypt credentials');
    }

    try {
      await prisma.clientCredential.update({
        where: {
          clientId_platformType: {
            clientId: this.clientId,
            platformType: 'twitter',
          },
        },
        data: {
          credential: encryptedData.encrypted,
          iv: encryptedData.iv,
          authTag: encryptedData.authTag,
        },
      });
      
      logger.debug({ clientId: this.clientId }, 'Twitter credentials updated successfully');
    } catch (error) {
      logger.error({ error, clientId: this.clientId }, 'Error updating Twitter credentials');
      throw error;
    }
  }

  /**
   * Helper method to make authenticated API requests to Twitter
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: Record<string, any>
  ): Promise<T> {
    if (!this.accessToken) {
      await this.initialize();
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    // For GET requests, add parameters to the URL
    if (method === 'GET' && data) {
      Object.entries(data).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    // Prepare fetch options
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    // For non-GET requests, add the data to the body
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    try {
      logger.debug({ endpoint, method }, 'Making Twitter API request');
      
      const response = await fetch(url.toString(), options);
      
      // If the token is expired, refresh and retry once
      if (response.status === 401 && this.refreshToken) {
        await this.refreshAccessToken();
        
        // Update the Authorization header with the new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`,
        };
        
        // Retry the request
        const retryResponse = await fetch(url.toString(), options);
        
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text();
          logger.error({ 
            endpoint, 
            method, 
            status: retryResponse.status, 
            statusText: retryResponse.statusText,
            errorText 
          }, 'Twitter API request failed after token refresh');
          
          throw new Error(`Twitter API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const result = await retryResponse.json();
        return result as T;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          endpoint, 
          method, 
          status: response.status, 
          statusText: response.statusText,
          errorText 
        }, 'Twitter API request failed');
        
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result as T;
    } catch (error) {
      logger.error({ error, endpoint, method }, 'Error making Twitter API request');
      throw error;
    }
  }

  /**
   * Get the authenticated user's profile
   */
  async getMyProfile(): Promise<TwitterUser> {
    const params = {
      'user.fields': 'profile_image_url,verified,public_metrics',
    };
    
    const response = await this.request<{data: TwitterUser}>('/users/me', 'GET', params);
    return response.data;
  }

  /**
   * Get a user by username
   */
  async getUserByUsername(username: string): Promise<TwitterUser> {
    const params = {
      'user.fields': 'profile_image_url,verified,public_metrics',
    };
    
    const response = await this.request<{data: TwitterUser}>(`/users/by/username/${username}`, 'GET', params);
    return response.data;
  }

  /**
   * Post a tweet
   */
  async postTweet(text: string): Promise<TwitterTweet> {
    const data = { text };
    const response = await this.request<{data: TwitterTweet}>('/tweets', 'POST', data);
    return response.data;
  }

  /**
   * Schedule a tweet
   */
  async scheduleTweet(text: string, scheduledTime: Date): Promise<TwitterScheduledTweet> {
    const data = {
      text,
      scheduled_time: scheduledTime.toISOString(),
    };
    
    // Note: This endpoint is part of the Twitter API v2, but might require additional permissions
    const response = await this.request<{data: TwitterScheduledTweet}>('/tweets/scheduled', 'POST', data);
    return response.data;
  }

  /**
   * Get user's timeline tweets
   */
  async getUserTimeline(userId: string, limit = 10): Promise<TwitterTweet[]> {
    const params = {
      max_results: limit,
      'tweet.fields': 'created_at,public_metrics,entities',
    };
    
    const response = await this.request<{data: TwitterTweet[]}>(`/users/${userId}/tweets`, 'GET', params);
    return response.data;
  }
} 