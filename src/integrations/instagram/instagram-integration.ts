import {
  AnalyticsResult,
  AuthResult,
  BasePlatformIntegration,
  PostPayload,
  PostResult,
  ActivityResult
} from '../BasePlatformIntegration';
import { InstagramAuth, InstagramConfig } from './instagram-auth';
import fetch from 'node-fetch';

// Instagram Graph API (Facebook) base URL
const FB_GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

export class InstagramIntegration implements BasePlatformIntegration {
  private auth: InstagramAuth;
  private accessToken: string | null = null;
  private userId: string | null = null;
  
  constructor(config: InstagramConfig) {
    this.auth = new InstagramAuth(config);
    this.accessToken = config.accessToken || null;
    this.userId = config.userId || null;
  }
  
  /**
   * Authenticate with Instagram
   * @param code Authorization code from OAuth flow
   */
  async authenticate(code: string): Promise<AuthResult> {
    const authResult = await this.auth.getAccessToken(code);
    if (authResult.successful) {
      this.accessToken = authResult.accessToken;
    }
    return authResult;
  }
  
  /**
   * Ensure access token is valid and refreshed if needed
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken) return false;
    
    // Check if token is valid
    const isValid = await this.auth.validateToken(this.accessToken);
    if (!isValid) {
      // Try to refresh the token
      const refreshResult = await this.auth.refreshLongLivedToken(this.accessToken);
      if (refreshResult.successful) {
        this.accessToken = refreshResult.accessToken;
        return true;
      }
      return false;
    }
    
    return true;
  }
  
  /**
   * Fetch analytics from Instagram (followers, media count)
   */
  async fetchStats(): Promise<AnalyticsResult> {
    if (!this.accessToken || !this.userId) {
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: 'Not authenticated with Instagram or user ID not found'
      };
    }
    
    if (!await this.ensureValidToken()) {
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: 'Instagram token is invalid and could not be refreshed'
      };
    }
    
    try {
      // Get user info including follower count
      const response = await fetch(
        `${FB_GRAPH_API_URL}/${this.userId}?fields=followers_count,media_count&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        return {
          followers: 0,
          totalIncome: 0,
          currency: 'USD',
          tierBreakdown: [],
          lastUpdated: new Date(),
          error: `Failed to fetch Instagram stats: ${response.status}`
        };
      }
      
      const userData = await response.json() as any;
      const followers = userData.followers_count || 0;
      
      // Instagram doesn't have direct monetization in the API, so we set income to 0
      return {
        followers,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching Instagram stats:', error);
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: `Error fetching Instagram stats: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Create a media post on Instagram
   * Note: Instagram API doesn't support direct posting, this requires creation of a container first
   * @param payload Post content and settings
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    if (!this.accessToken || !this.userId) {
      return {
        successful: false,
        error: 'Not authenticated with Instagram or user ID not found'
      };
    }
    
    if (!await this.ensureValidToken()) {
      return {
        successful: false,
        error: 'Instagram token is invalid and could not be refreshed'
      };
    }
    
    try {
      // Instagram requires media to be uploaded first - we'd need image URLs
      if (!payload.mediaUrls || payload.mediaUrls.length === 0) {
        return {
          successful: false,
          error: 'Instagram requires media (images/videos) for posts'
        };
      }
      
      // For each media URL, we need to create a container
      const mediaContainers = [];
      
      for (const mediaUrl of payload.mediaUrls) {
        // Create a media container
        const containerParams = new URLSearchParams({
          image_url: mediaUrl,
          caption: `${payload.title ? payload.title + ': ' : ''}${payload.content}`,
          access_token: this.accessToken
        });
        
        const containerResponse = await fetch(
          `${FB_GRAPH_API_URL}/${this.userId}/media`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: containerParams.toString()
          }
        );
        
        if (!containerResponse.ok) {
          const errorText = await containerResponse.text();
          return {
            successful: false,
            error: `Failed to create Instagram media container: ${containerResponse.status} ${errorText}`
          };
        }
        
        const containerData = await containerResponse.json() as any;
        mediaContainers.push(containerData.id);
      }
      
      // Now publish the media
      let publishedPostId = '';
      
      if (mediaContainers.length === 1) {
        // Single media post
        const publishParams = new URLSearchParams({
          creation_id: mediaContainers[0],
          access_token: this.accessToken
        });
        
        const publishResponse = await fetch(
          `${FB_GRAPH_API_URL}/${this.userId}/media_publish`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: publishParams.toString()
          }
        );
        
        if (!publishResponse.ok) {
          const errorText = await publishResponse.text();
          return {
            successful: false,
            error: `Failed to publish Instagram post: ${publishResponse.status} ${errorText}`
          };
        }
        
        const publishData = await publishResponse.json() as any;
        publishedPostId = publishData.id;
      } else {
        // Instagram doesn't have a direct API for carousel posts through the Graph API
        // This would require additional implementation using different endpoints
        return {
          successful: false,
          error: 'Multiple media posts (carousel) not supported in this implementation'
        };
      }
      
      return {
        postId: publishedPostId,
        successful: true
      };
    } catch (error) {
      console.error('Error creating Instagram post:', error);
      return {
        successful: false,
        error: `Error creating Instagram post: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Poll for new activity on Instagram (not directly supported by API)
   */
  async pollNewActivity(): Promise<ActivityResult[]> {
    // Instagram's API doesn't provide a way to get new followers or direct activity
    // We would need to use a difference-based approach by storing previous follower counts
    // and comparing, which is out of scope for this implementation
    return [];
  }
} 