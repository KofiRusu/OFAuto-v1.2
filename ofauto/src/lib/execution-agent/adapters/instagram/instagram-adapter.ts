import { BasePlatformAdapter } from "../../base-adapter";
import {
  PlatformType,
  TaskPayload,
  ExecutionResult,
} from "../../types";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { PlatformFollower } from "@/lib/marketing/follower-monitor-service";
import { prisma } from "@/lib/prisma";

// Instagram API response interfaces
interface InstagramMediaResponse {
  id: string;
  permalink?: string;
  media_type?: string;
  media_url?: string;
  caption?: string;
  timestamp?: string;
}

interface InstagramInsightsResponse {
  data: Array<{
    name: string;
    period: string;
    values: Array<{
      value: number;
    }>;
  }>;
}

interface InstagramUserResponse {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  biography?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

interface EngagementStats {
  followers: number;
  followersChange: number;
  engagement: number;
  impressions: number;
  reach: number;
  profileViews: number;
  mediaCount: number;
  timestamp: Date;
}

export class InstagramAdapter extends BasePlatformAdapter {
  public readonly platformType: PlatformType = "INSTAGRAM";
  private accessToken: string | null = null;
  private apiVersion = "v18.0"; // Meta Graph API version
  private apiBaseUrl = "https://graph.facebook.com";
  private instagramBusinessAccountId: string | null = null;
  private maxRetries = 3;

  constructor() {
    super();
  }

  public getCredentialRequirements(): string[] {
    return ["accessToken", "instagramBusinessAccountId"];
  }

  public async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    if (!credentials.accessToken || !credentials.instagramBusinessAccountId) {
      return false;
    }

    try {
      // Test the credentials by getting basic account info
      const response = await axios.get(
        `${this.apiBaseUrl}/${this.apiVersion}/${credentials.instagramBusinessAccountId}`,
        {
          params: {
            fields: "id,username",
            access_token: credentials.accessToken,
          },
        }
      );
      
      return !!response.data?.id;
    } catch (error) {
      console.error("Instagram credential validation error:", error);
      return false;
    }
  }

  public async initialize(config: any): Promise<boolean> {
    const result = await super.initialize(config);
    
    if (result) {
      this.accessToken = config.credentials.accessToken;
      this.instagramBusinessAccountId = config.credentials.instagramBusinessAccountId;
    }
    
    return result;
  }

  public async postContent(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("POST_CONTENT");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "POST_CONTENT", ["content", "mediaUrls"]);
    if (validationError) return validationError;

    try {
      let mediaId: string;
      
      // Different handling based on media type
      if (task.mediaUrls && task.mediaUrls.length > 0) {
        // Step 1: Create a container for the media
        const containerResponse = await this.apiRequest(
          "POST",
          `/${this.instagramBusinessAccountId}/media`,
          {
            image_url: task.mediaUrls[0],
            caption: task.content,
            // Additional parameters for scheduled posts
            ...(task.scheduledFor && { 
              publishing_type: "SCHEDULED",
              published: false,
              scheduled_publish_time: Math.floor(task.scheduledFor.getTime() / 1000)
            })
          }
        );

        if (!containerResponse.data?.id) {
          return this.createErrorResult(
            "POST_CONTENT",
            "Failed to create media container",
            containerResponse.data
          );
        }

        mediaId = containerResponse.data.id;
        
        // Step 2: Publish the container
        const publishResponse = await this.apiRequest(
          "POST",
          `/${this.instagramBusinessAccountId}/media_publish`,
          {
            creation_id: mediaId
          }
        );

        if (!publishResponse.data?.id) {
          return this.createErrorResult(
            "POST_CONTENT",
            "Failed to publish media",
            publishResponse.data
          );
        }

        // Return success with the published media ID
        return this.createSuccessResult(
          "POST_CONTENT",
          publishResponse.data.id,
          {
            permalink: `https://www.instagram.com/p/${publishResponse.data.id}/`,
            mediaType: "IMAGE",
            caption: task.content
          }
        );
      } else {
        // Text-only content (for stories or IGTV captions)
        return this.createErrorResult(
          "POST_CONTENT",
          "Instagram requires media (image or video) for posts",
        );
      }
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? `Instagram API error: ${error.response?.data?.error?.message || error.message}`
        : error instanceof Error 
          ? error.message 
          : "Unknown error posting to Instagram";
      
      return this.createErrorResult(
        "POST_CONTENT",
        errorMessage
      );
    }
  }

  public async sendDM(task: TaskPayload): Promise<ExecutionResult> {
    // Instagram Graph API doesn't support direct message sending
    return this.createErrorResult(
      "SEND_DM",
      "Direct messaging is not supported by Instagram Graph API"
    );
  }

  public async adjustPricing(task: TaskPayload): Promise<ExecutionResult> {
    // Not applicable for Instagram
    return this.createErrorResult(
      "ADJUST_PRICING",
      "Pricing adjustments are not applicable to Instagram"
    );
  }

  public async schedulePost(task: TaskPayload): Promise<ExecutionResult> {
    // Instagram post creation already includes scheduling capability
    // We'll validate and then delegate to postContent
    const initError = this.checkInitialized("SCHEDULE_POST");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "SCHEDULE_POST", ["content", "mediaUrls", "scheduledFor"]);
    if (validationError) return validationError;

    if (!task.scheduledFor || task.scheduledFor.getTime() <= Date.now()) {
      return this.createErrorResult(
        "SCHEDULE_POST",
        "Scheduled time must be in the future"
      );
    }

    // Create a modified task that will be handled by postContent
    const postTask = {
      ...task,
      taskType: "POST_CONTENT"
    };

    return this.postContent(postTask);
  }

  public async fetchMetrics(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("FETCH_METRICS");
    if (initError) return initError;

    try {
      // Get user profile metrics
      const userResponse = await this.apiRequest(
        "GET",
        `/${this.instagramBusinessAccountId}`,
        {
          fields: "id,username,followers_count,follows_count,media_count,profile_picture_url"
        }
      );

      if (!userResponse.data?.id) {
        return this.createErrorResult(
          "FETCH_METRICS",
          "Failed to fetch user profile data"
        );
      }

      const userData = userResponse.data as InstagramUserResponse;

      // Get account insights
      const insightsResponse = await this.apiRequest(
        "GET",
        `/${this.instagramBusinessAccountId}/insights`,
        {
          metric: "impressions,reach,profile_views",
          period: "day"
        }
      );

      if (!insightsResponse.data?.data) {
        return this.createErrorResult(
          "FETCH_METRICS",
          "Failed to fetch insights data"
        );
      }

      const insightsData = insightsResponse.data as InstagramInsightsResponse;

      // Calculate engagement metrics
      const impressions = this.getMetricValue(insightsData, "impressions") || 0;
      const reach = this.getMetricValue(insightsData, "reach") || 0;
      const profileViews = this.getMetricValue(insightsData, "profile_views") || 0;
      
      // Calculate estimated engagement rate (as a percentage of followers)
      // This is approximate since we don't have exact like/comment counts from the API
      const followers = userData.followers_count || 0;
      const engagement = followers > 0 ? (impressions / followers) * 100 : 0;

      // Compile stats
      const stats: EngagementStats = {
        followers,
        followersChange: 0, // Need historical data to calculate this
        engagement,
        impressions,
        reach,
        profileViews,
        mediaCount: userData.media_count || 0,
        timestamp: new Date()
      };

      return this.createSuccessResult(
        "FETCH_METRICS",
        undefined,
        stats
      );
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? `Instagram API error: ${error.response?.data?.error?.message || error.message}`
        : error instanceof Error 
          ? error.message 
          : "Unknown error fetching Instagram metrics";
      
      return this.createErrorResult(
        "FETCH_METRICS",
        errorMessage
      );
    }
  }

  /**
   * Fetch followers for an Instagram business account
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
          throw new Error(`Failed to initialize Instagram adapter for platform ${accountId}`);
        }
      }

      // Get the Instagram business account ID
      const businessAccountId = this.instagramBusinessAccountId;
      if (!businessAccountId) {
        throw new Error("Instagram business account ID not available");
      }

      // Note: Instagram Graph API doesn't provide direct access to followers list
      // for privacy reasons. This is a limitation of the platform.
      // We can only get follower count from the business insights API.
      // 
      // For demonstration purposes, we'll create a simulated list with placeholder data
      // In a real app, you would need to use alternative methods like:
      // 1. Using Instagram Private API (against ToS, not recommended)
      // 2. Using Instagram Basic Display API for user-authorized data
      // 3. Using webhook events for real-time follower notifications
      
      // Get user profile to at least get the follower count
      const userResponse = await this.apiRequest(
        "GET",
        `/${businessAccountId}`,
        {
          fields: "id,username,followers_count"
        }
      );

      if (!userResponse.success || !userResponse.data?.id) {
        throw new Error(`Failed to fetch Instagram profile: ${userResponse.error?.message || "Unknown error"}`);
      }

      // For demonstration, create a simulated list
      // In production, we would need a different approach
      const followerCount = userResponse.data.followers_count || 0;
      
      // Return a placeholder/simulated list for now
      // In reality, this data would not be accurate for Instagram due to API limitations
      const placeholderFollowers: PlatformFollower[] = [];
      
      // We'll log the limitation
      console.warn(`Instagram API limitation: Cannot fetch actual follower list from Instagram. Only follower count (${followerCount}) is available.`);
      
      return placeholderFollowers;
    } catch (error) {
      console.error("Error fetching Instagram followers:", error);
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
      const url = `${this.apiBaseUrl}/${this.apiVersion}${endpoint}`;
      const config: AxiosRequestConfig = {
        method,
        url,
        ...(method === "GET" 
          ? { 
              params: { 
                ...params, 
                access_token: this.accessToken 
              } 
            } 
          : { 
              data: { 
                ...params, 
                access_token: this.accessToken 
              } 
            }
        )
      };

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle rate limiting
        if (error.response?.status === 429 && retryCount < this.maxRetries) {
          // Calculate backoff time: 2^retryCount * 1000ms (exponential backoff)
          const backoffTime = Math.pow(2, retryCount) * 1000;
          console.log(`Rate limited, retrying in ${backoffTime}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return this.apiRequest(method, endpoint, params, retryCount + 1);
        }
        
        return { 
          success: false, 
          error: error.response?.data?.error || { message: error.message } 
        };
      }
      
      return { success: false, error: { message: "Unknown error" } };
    }
  }

  private getMetricValue(insights: InstagramInsightsResponse, metricName: string): number | null {
    const metric = insights.data.find(item => item.name === metricName);
    if (!metric || !metric.values.length) {
      return null;
    }
    return metric.values[0].value;
  }
} 