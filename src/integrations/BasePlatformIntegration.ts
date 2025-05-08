/**
 * Base interface for platform integrations (Patreon, Ko-fi, Fansly, OnlyFans)
 * Defines the common methods that all platform integrations must implement
 */

/**
 * Authentication result from a platform
 */
export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string[];
  successful: boolean;
  error?: string;
}

/**
 * Analytics result from a platform
 */
export interface AnalyticsResult {
  followers: number;
  totalIncome: number;
  currency: string;
  tierBreakdown: {
    tierId: string;
    tierName: string;
    tierAmount: number;
    supporterCount: number;
  }[];
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

/**
 * Payload for creating a post
 */
export interface PostPayload {
  content: string;
  scheduledFor?: Date;
  media?: {
    url: string;
    type: 'image' | 'video';
    altText?: string;
  }[];
}

/**
 * Result from creating a post
 */
export interface PostResult {
  postId?: string;
  url?: string;
  successful: boolean;
  error?: string;
  scheduledFor?: Date;
}

/**
 * Result from sending a direct message
 */
export interface DMResult {
  messageId?: string;
  successful: boolean;
  error?: string;
}

/**
 * Result from polling for new activity
 */
export interface ActivityResult {
  type: 'new_pledge' | 'deleted_pledge' | 'updated_pledge' | 'new_message' | 'other';
  userId: string;
  username: string;
  amount?: number;
  tierId?: string;
  tierName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Base interface for all platform integrations
 */
export interface BasePlatformIntegration {
  /**
   * Authenticate with the platform using OAuth2 or other method
   * @param code Authorization code from OAuth flow
   */
  authenticate(code: string): Promise<AuthResult>;
  
  /**
   * Fetch stats from the platform (followers, income, etc.)
   */
  fetchStats(): Promise<AnalyticsResult>;
  
  /**
   * Create a post on the platform
   * @param payload Post content and settings
   */
  createPost(payload: PostPayload): Promise<PostResult>;
  
  /**
   * Send a direct message to a user (if supported)
   * @param recipientId ID of the user to message
   * @param message Content of the message
   */
  sendDM(recipientId: string, message: string): Promise<DMResult>;
  
  /**
   * Poll for new activity (pledges, messages, etc.)
   */
  pollNewActivity(): Promise<ActivityResult[]>;
} 