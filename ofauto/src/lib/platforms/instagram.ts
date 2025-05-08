import { prisma } from '@/lib/prisma';
import { decryptCredential } from '@/lib/security';
import { logger } from '@/lib/logger';

interface InstagramCredentials {
  accessToken: string;
  userId: string;
}

export interface InstagramUser {
  id: string;
  username: string;
  name?: string;
  profile_picture?: string;
  bio?: string;
  website?: string;
  is_business?: boolean;
  follows_count?: number;
  followers_count?: number;
  media_count?: number;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  children?: {
    data: Array<{
      id: string;
      media_type: 'IMAGE' | 'VIDEO';
      media_url: string;
    }>;
  };
}

export interface InstagramInsight {
  name: string;
  period: 'day' | 'week' | 'lifetime';
  values: Array<{
    value: number;
    end_time?: string;
  }>;
}

export class InstagramClient {
  private accessToken: string | null = null;
  private userId: string | null = null;
  private clientId: string;
  private baseUrl = 'https://graph.instagram.com/';
  private graphApiVersion = 'v18.0'; // Update this as needed

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Initialize the client by fetching and decrypting credentials
   */
  async initialize() {
    logger.debug({ clientId: this.clientId }, 'Initializing Instagram client');
    
    const credential = await prisma.clientCredential.findUnique({
      where: { 
        clientId_platformType: { 
          clientId: this.clientId, 
          platformType: 'instagram'
        } 
      },
    });

    if (!credential) {
      logger.error({ clientId: this.clientId }, 'Instagram credentials not found');
      throw new Error('Instagram credentials not found');
    }

    const decrypted = decryptCredential({
      encrypted: credential.credential,
      iv: credential.iv,
      authTag: credential.authTag,
    });

    if (!decrypted) {
      logger.error({ clientId: this.clientId }, 'Failed to decrypt Instagram credentials');
      throw new Error('Failed to decrypt Instagram credentials');
    }

    const credentials = JSON.parse(decrypted) as InstagramCredentials;
    this.accessToken = credentials.accessToken;
    this.userId = credentials.userId;
    
    logger.debug({ clientId: this.clientId }, 'Instagram client initialized successfully');
  }

  /**
   * Helper method to make authenticated API requests to Instagram
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'DELETE' = 'GET', 
    data?: Record<string, any>
  ): Promise<T> {
    if (!this.accessToken) {
      await this.initialize();
    }

    // Ensure endpoint has the API version prefix
    if (!endpoint.startsWith('/')) {
      endpoint = `/${endpoint}`;
    }
    
    // Construct full URL with API version
    const url = new URL(`${this.baseUrl}${this.graphApiVersion}${endpoint}`);

    // Add access token to all requests
    url.searchParams.append('access_token', this.accessToken!);

    // For GET requests, add additional params to the URL
    if (method === 'GET' && data) {
      Object.entries(data).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    // Prepare fetch options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // For non-GET requests, add the data to the body
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    try {
      logger.debug({ endpoint, method }, 'Making Instagram API request');
      
      const response = await fetch(url.toString(), options);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          endpoint, 
          method, 
          status: response.status, 
          statusText: response.statusText,
          errorText 
        }, 'Instagram API request failed');
        
        throw new Error(`Instagram API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      return result as T;
    } catch (error) {
      logger.error({ error, endpoint, method }, 'Error making Instagram API request');
      throw error;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<InstagramUser> {
    if (!this.userId) {
      await this.initialize();
    }
    
    const fields = 'id,username,website,biography,name,ig_id,followers_count,follows_count,media_count,profile_picture_url';
    
    const response = await this.request<InstagramUser>(`/${this.userId}`, 'GET', { fields });
    return response;
  }

  /**
   * Get user's media
   */
  async getUserMedia(limit = 25): Promise<InstagramMedia[]> {
    if (!this.userId) {
      await this.initialize();
    }
    
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{id,media_type,media_url}';
    
    const response = await this.request<{data: InstagramMedia[]}>(`/${this.userId}/media`, 'GET', {
      fields,
      limit,
    });
    
    return response.data;
  }

  /**
   * Get details for a specific media
   */
  async getMediaDetails(mediaId: string): Promise<InstagramMedia> {
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,children{id,media_type,media_url}';
    
    const response = await this.request<InstagramMedia>(`/${mediaId}`, 'GET', { fields });
    return response;
  }

  /**
   * Get insights for a media post (business accounts only)
   */
  async getMediaInsights(mediaId: string): Promise<InstagramInsight[]> {
    const metric = 'engagement,impressions,reach';
    
    const response = await this.request<{data: InstagramInsight[]}>(`/${mediaId}/insights`, 'GET', { metric });
    return response.data;
  }

  /**
   * Get insights for the user profile (business accounts only)
   */
  async getUserInsights(period: 'day' | 'week' | 'lifetime' = 'day', metrics: string[] = ['impressions', 'reach', 'profile_views']): Promise<InstagramInsight[]> {
    if (!this.userId) {
      await this.initialize();
    }
    
    const metric = metrics.join(',');
    
    const response = await this.request<{data: InstagramInsight[]}>(`/${this.userId}/insights`, 'GET', {
      metric,
      period,
    });
    
    return response.data;
  }
} 