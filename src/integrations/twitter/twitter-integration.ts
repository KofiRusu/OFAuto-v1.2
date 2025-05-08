import {
  AnalyticsResult,
  AuthResult,
  BasePlatformIntegration,
  PostPayload,
  PostResult,
  ActivityResult
} from '../BasePlatformIntegration';
import { TwitterAuth, TwitterConfig } from './twitter-auth';
import fetch from 'node-fetch';

// Twitter API v2 base URL
const TWITTER_API_BASE = 'https://api.twitter.com/2';

export class TwitterIntegration implements BasePlatformIntegration {
  private auth: TwitterAuth;
  private accessToken: string | null = null;
  private userId: string | null = null;
  
  constructor(config: TwitterConfig) {
    this.auth = new TwitterAuth(config);
    this.accessToken = config.accessToken || null;
  }
  
  /**
   * Authenticate with Twitter
   * @param code Authorization code from OAuth flow
   */
  async authenticate(code: string): Promise<AuthResult> {
    const authResult = await this.auth.getAccessToken(code);
    if (authResult.successful) {
      this.accessToken = authResult.accessToken;
      // Fetch the user ID after authentication
      await this.fetchUserId();
    }
    return authResult;
  }
  
  /**
   * Fetch user ID for the authenticated user
   */
  private async fetchUserId(): Promise<void> {
    if (!this.accessToken) return;
    
    try {
      const response = await fetch(`${TWITTER_API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json() as any;
        this.userId = data.data?.id;
      }
    } catch (error) {
      console.error('Error fetching Twitter user ID:', error);
    }
  }
  
  /**
   * Ensure access token is valid and refreshed if needed
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken) return false;
    
    const isValid = await this.auth.validateToken(this.accessToken);
    if (!isValid) {
      const refreshResult = await this.auth.refreshAccessToken();
      if (refreshResult.successful) {
        this.accessToken = refreshResult.accessToken;
        return true;
      }
      return false;
    }
    
    return true;
  }
  
  /**
   * Fetch analytics from Twitter (followers)
   */
  async fetchStats(): Promise<AnalyticsResult> {
    if (!this.accessToken || !this.userId) {
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: 'Not authenticated with Twitter or user ID not found'
      };
    }
    
    if (!await this.ensureValidToken()) {
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: 'Twitter token is invalid and could not be refreshed'
      };
    }
    
    try {
      // Get follower count
      const response = await fetch(`${TWITTER_API_BASE}/users/${this.userId}?user.fields=public_metrics`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        return {
          followers: 0,
          totalIncome: 0,
          currency: 'USD',
          tierBreakdown: [],
          lastUpdated: new Date(),
          error: `Failed to fetch Twitter stats: ${response.status}`
        };
      }
      
      const userData = await response.json() as any;
      const followers = userData.data?.public_metrics?.followers_count || 0;
      
      // Twitter doesn't have direct monetization in the API, so we set income to 0
      return {
        followers,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching Twitter stats:', error);
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: `Error fetching Twitter stats: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Post a tweet
   * @param payload Post content and settings
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    if (!this.accessToken) {
      return {
        successful: false,
        error: 'Not authenticated with Twitter'
      };
    }
    
    if (!await this.ensureValidToken()) {
      return {
        successful: false,
        error: 'Twitter token is invalid and could not be refreshed'
      };
    }
    
    try {
      // Format the tweet payload
      const tweetBody: any = {
        text: `${payload.title ? payload.title + ': ' : ''}${payload.content}`.substring(0, 280), // Twitter has a 280 character limit
      };
      
      // Handle scheduling if needed
      if (payload.scheduledFor) {
        const scheduledTime = new Date(payload.scheduledFor).toISOString();
        tweetBody.scheduled_at = Math.floor(new Date(payload.scheduledFor).getTime() / 1000); // Unix timestamp in seconds
        
        // Use the scheduled endpoint
        const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tweetBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return {
            successful: false,
            error: `Failed to schedule tweet: ${response.status} ${errorText}`
          };
        }
        
        const data = await response.json() as any;
        
        return {
          postId: data.data?.id,
          successful: true,
          scheduledFor: payload.scheduledFor
        };
      } else {
        // Post immediately
        const response = await fetch(`${TWITTER_API_BASE}/tweets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tweetBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return {
            successful: false,
            error: `Failed to post tweet: ${response.status} ${errorText}`
          };
        }
        
        const data = await response.json() as any;
        const tweetId = data.data?.id;
        
        return {
          postId: tweetId,
          url: tweetId ? `https://twitter.com/i/web/status/${tweetId}` : undefined,
          successful: true
        };
      }
    } catch (error) {
      console.error('Error posting tweet:', error);
      return {
        successful: false,
        error: `Error posting tweet: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Poll for new followers (Twitter doesn't have a direct pledge/payment system)
   */
  async pollNewActivity(): Promise<ActivityResult[]> {
    if (!this.accessToken || !this.userId) {
      return [];
    }
    
    if (!await this.ensureValidToken()) {
      return [];
    }
    
    try {
      // Get recent followers
      const response = await fetch(
        `${TWITTER_API_BASE}/users/${this.userId}/followers?max_results=10`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch Twitter followers: ${response.status}`);
        return [];
      }
      
      const followersData = await response.json() as any;
      const activities: ActivityResult[] = [];
      
      // We can't determine if these are new followers through the API
      // This would require maintaining a list of followers and checking for new ones
      // For now, we'll just return an empty array
      
      return activities;
    } catch (error) {
      console.error('Error polling Twitter activity:', error);
      return [];
    }
  }
} 