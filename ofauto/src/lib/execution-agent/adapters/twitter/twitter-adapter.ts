import { BasePlatformAdapter } from "../../base-adapter";
import {
  PlatformType,
  TaskPayload,
  ExecutionResult,
} from "../../types";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { PlatformFollower } from "@/lib/marketing/follower-monitor-service";
import { prisma } from "@/lib/prisma";

// Twitter API response interfaces
interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
    created_at?: string;
  };
  includes?: {
    media?: Array<{
      media_key: string;
      type: string;
      url?: string;
    }>;
  };
}

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
    description?: string;
    public_metrics: {
      followers_count: number;
      following_count: number;
      tweet_count: number;
      listed_count: number;
    };
  };
}

interface TwitterTweetsResponse {
  data: Array<{
    id: string;
    text: string;
    created_at: string;
    public_metrics: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
      impression_count?: number;
    };
  }>;
  meta: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
    next_token?: string;
  };
}

interface EngagementStats {
  followers: number;
  followersChange: number;
  engagement: number;
  tweets: number;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  timestamp: Date;
}

export class TwitterAdapter extends BasePlatformAdapter {
  public readonly platformType: PlatformType = "TWITTER";
  private accessToken: string | null = null;
  private userId: string | null = null;
  private apiBaseUrl = "https://api.twitter.com";
  private maxRetries = 3;

  constructor() {
    super();
  }

  public getCredentialRequirements(): string[] {
    return ["twitterAccessToken", "twitterUserId"];
  }

  public async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    if (!credentials.twitterAccessToken || !credentials.twitterUserId) {
      return false;
    }

    try {
      // Test the credentials by getting basic user info
      const response = await axios.get(
        `${this.apiBaseUrl}/2/users/${credentials.twitterUserId}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.twitterAccessToken}`,
          },
        }
      );
      
      return !!response.data?.data?.id;
    } catch (error) {
      console.error("Twitter credential validation error:", error);
      return false;
    }
  }

  public async initialize(config: any): Promise<boolean> {
    const result = await super.initialize(config);
    
    if (result) {
      this.accessToken = config.credentials.twitterAccessToken;
      this.userId = config.credentials.twitterUserId;
    }
    
    return result;
  }

  public async postContent(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("POST_CONTENT");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "POST_CONTENT", ["content"]);
    if (validationError) return validationError;

    try {
      let tweetData: any = {
        text: task.content,
      };

      // If a media URL is provided, handle media upload
      if (task.mediaUrls && task.mediaUrls.length > 0) {
        // Note: Twitter API v2 requires a media_id which would normally be obtained by
        // first uploading the media via a separate endpoint. For this placeholder implementation,
        // we'll simulate this step and assume it's pre-uploaded.
        
        // In a real implementation, we would:
        // 1. Upload the media to Twitter's upload endpoint
        // 2. Get the media_id
        // 3. Attach it to the tweet
        
        // Placeholder/simulation:
        tweetData.media = {
          media_ids: ["SIMULATED_MEDIA_ID_FOR_DEMO"], // This would be real media IDs in production
        };
      }

      // Post the tweet
      const response = await this.apiRequest(
        "POST",
        "/2/tweets",
        tweetData
      );

      if (!response.data?.data?.id) {
        return this.createErrorResult(
          "POST_CONTENT",
          "Failed to post tweet",
          response.data
        );
      }

      // Return success with the tweet ID
      return this.createSuccessResult(
        "POST_CONTENT",
        response.data.data.id,
        {
          tweetId: response.data.data.id,
          text: response.data.data.text,
          createdAt: response.data.data.created_at,
          url: `https://twitter.com/twitter/status/${response.data.data.id}`
        }
      );
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? `Twitter API error: ${error.response?.data?.detail || error.response?.data?.errors?.[0]?.message || error.message}`
        : error instanceof Error 
          ? error.message 
          : "Unknown error posting to Twitter";
      
      return this.createErrorResult(
        "POST_CONTENT",
        errorMessage
      );
    }
  }

  public async sendDM(task: TaskPayload): Promise<ExecutionResult> {
    // Twitter API v2 supports DMs, but for this implementation we'll return a placeholder error
    return this.createErrorResult(
      "SEND_DM",
      "Direct messaging not implemented in current Twitter adapter"
    );
  }

  public async adjustPricing(task: TaskPayload): Promise<ExecutionResult> {
    // Not applicable for Twitter
    return this.createErrorResult(
      "ADJUST_PRICING",
      "Pricing adjustments are not applicable to Twitter"
    );
  }

  public async schedulePost(task: TaskPayload): Promise<ExecutionResult> {
    // Twitter API v2 doesn't directly support scheduling via the API
    // Third-party solutions or Twitter's own scheduling features would be needed
    return this.createErrorResult(
      "SCHEDULE_POST",
      "Post scheduling not directly supported by Twitter API v2"
    );
  }

  public async fetchMetrics(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("FETCH_METRICS");
    if (initError) return initError;

    try {
      // Get user profile metrics
      const userResponse = await this.apiRequest(
        "GET",
        `/2/users/${this.userId}`,
        {
          "user.fields": "public_metrics,profile_image_url,description"
        }
      );

      if (!userResponse.data?.data) {
        return this.createErrorResult(
          "FETCH_METRICS",
          "Failed to fetch user profile data"
        );
      }

      const userData = userResponse.data.data as TwitterUserResponse["data"];

      // Get recent tweets with metrics
      const tweetsResponse = await this.apiRequest(
        "GET",
        `/2/users/${this.userId}/tweets`,
        {
          max_results: 10,
          "tweet.fields": "public_metrics,created_at",
          exclude: "retweets,replies"
        }
      );

      if (!tweetsResponse.data?.data) {
        return this.createErrorResult(
          "FETCH_METRICS",
          "Failed to fetch tweets data"
        );
      }

      const tweetsData = tweetsResponse.data.data as TwitterTweetsResponse["data"];

      // Calculate engagement metrics from recent tweets
      let totalLikes = 0;
      let totalRetweets = 0;
      let totalReplies = 0;
      let totalQuotes = 0;
      let totalImpressions = 0;

      for (const tweet of tweetsData) {
        totalLikes += tweet.public_metrics.like_count;
        totalRetweets += tweet.public_metrics.retweet_count;
        totalReplies += tweet.public_metrics.reply_count;
        totalQuotes += tweet.public_metrics.quote_count;
        
        // Impression count may not be available for all users/apps
        if (tweet.public_metrics.impression_count) {
          totalImpressions += tweet.public_metrics.impression_count;
        }
      }

      // Calculate engagement rate (simplified)
      const tweetsCount = tweetsData.length || 1; // Avoid division by zero
      const followers = userData.public_metrics.followers_count;
      
      // Average engagements per tweet as a percentage of followers
      const engagementPerTweet = (totalLikes + totalRetweets + totalReplies + totalQuotes) / tweetsCount;
      const engagement = followers > 0 ? (engagementPerTweet / followers) * 100 : 0;

      // Compile stats
      const stats: EngagementStats = {
        followers,
        followersChange: 0, // Would need historical data
        engagement,
        tweets: userData.public_metrics.tweet_count,
        impressions: totalImpressions / tweetsCount, // Average impressions per tweet
        likes: totalLikes / tweetsCount,
        retweets: totalRetweets / tweetsCount,
        replies: totalReplies / tweetsCount,
        quotes: totalQuotes / tweetsCount,
        timestamp: new Date()
      };

      return this.createSuccessResult(
        "FETCH_METRICS",
        undefined,
        stats
      );
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? `Twitter API error: ${error.response?.data?.detail || error.response?.data?.errors?.[0]?.message || error.message}`
        : error instanceof Error 
          ? error.message 
          : "Unknown error fetching Twitter metrics";
      
      return this.createErrorResult(
        "FETCH_METRICS",
        errorMessage
      );
    }
  }

  /**
   * Fetch followers list for a Twitter account
   * @param accountId The platform account ID
   * @returns Promise<PlatformFollower[]> List of followers
   */
  public async fetchFollowers(accountId: string): Promise<PlatformFollower[]> {
    try {
      const platform = await prisma.platform.findUnique({
        where: { id: accountId },
      });

      if (!platform) {
        throw new Error(`Platform with ID ${accountId} not found`);
      }

      // Initialize the adapter if needed
      if (!this.isInitialized()) {
        // Get credentials using the platform ID
        const credentials = await this.fetchCredentials(accountId);
        if (!credentials) {
          throw new Error(`Failed to fetch credentials for platform ${accountId}`);
        }
        
        const initialized = await this.initialize({
          platformId: accountId,
          clientId: platform.clientId,
          credentials,
        });
        
        if (!initialized) {
          throw new Error(`Failed to initialize Twitter adapter for platform ${accountId}`);
        }
      }

      // Get the Twitter user ID (this user's followers)
      const userId = this.userId; 
      if (!userId) {
        throw new Error("Twitter user ID not available");
      }

      // Make API request to get followers
      // Note: Twitter API has pagination, we'll implement a simplified version
      const response = await this.apiRequest(
        "GET",
        `/2/users/${userId}/followers`,
        {
          "max_results": 100, // Maximum allowed by Twitter API
          "user.fields": "created_at",
        }
      );

      if (!response.success || !response.data?.data) {
        throw new Error(`Failed to fetch Twitter followers: ${response.error?.message || "Unknown error"}`);
      }

      // Transform the response to our standard PlatformFollower format
      return response.data.data.map((follower: any) => ({
        id: follower.id,
        name: follower.name,
        username: follower.username,
        joinedAt: follower.created_at,
      }));
    } catch (error) {
      console.error("Error fetching Twitter followers:", error);
      return [];
    }
  }

  // Helper to fetch credentials for a platform
  private async fetchCredentials(platformId: string): Promise<Record<string, string>> {
    try {
      // Get credentials from the database (normally this would use CredentialService)
      const credentials = await prisma.platformCredential.findMany({
        where: { platformId },
      });

      // We should decrypt these values, but for simplicity we'll just return them
      // In production, use CredentialService to decrypt
      const result: Record<string, string> = {};
      for (const cred of credentials) {
        result[cred.key] = cred.value; // In reality, this would be decrypted
      }

      return result;
    } catch (error) {
      console.error("Error fetching credentials:", error);
      return {};
    }
  }

  // Helper methods
  private async apiRequest(
    method: string,
    endpoint: string,
    params: Record<string, any> = {},
    retryCount = 0
  ): Promise<any> {
    try {
      const url = `${this.apiBaseUrl}${endpoint}`;
      const config: AxiosRequestConfig = {
        method,
        url,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        ...(method === "GET" 
          ? { params } 
          : { data: params }
        )
      };

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle rate limiting (Twitter uses 429 status code)
        if (error.response?.status === 429 && retryCount < this.maxRetries) {
          const retryAfter = error.response.headers["x-rate-limit-reset"] 
            ? parseInt(error.response.headers["x-rate-limit-reset"]) - Math.floor(Date.now() / 1000)
            : Math.pow(2, retryCount);
          
          const backoffTime = retryAfter * 1000 || Math.pow(2, retryCount) * 1000;
          console.log(`Rate limited by Twitter API, retrying in ${backoffTime}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return this.apiRequest(method, endpoint, params, retryCount + 1);
        }
        
        return { 
          success: false, 
          error: error.response?.data || { message: error.message } 
        };
      }
      
      return { success: false, error: { message: "Unknown error" } };
    }
  }
} 