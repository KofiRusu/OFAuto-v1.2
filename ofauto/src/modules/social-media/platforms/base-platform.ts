import { Platform } from '@prisma/client';

/**
 * Abstract base class for all social media platform integrations
 */
export abstract class BasePlatform {
  constructor(protected accountId: string, protected platform: Platform) {}

  /**
   * Authenticate with the platform
   */
  abstract authenticate(accessToken: string, refreshToken?: string): Promise<boolean>;

  /**
   * Refresh authentication token
   */
  abstract refreshToken(): Promise<string | null>;

  /**
   * Get user profile data
   */
  abstract getProfile(): Promise<any>;

  /**
   * Post content to the platform
   */
  abstract postContent(content: {
    text?: string;
    mediaUrls?: string[];
    scheduledTime?: Date;
  }): Promise<{ success: boolean; id?: string; error?: string }>;

  /**
   * Get engagement metrics for a content item
   */
  abstract getContentMetrics(contentId: string): Promise<{
    likes: number;
    comments: number;
    shares: number;
    views: number;
    [key: string]: any;
  }>;

  /**
   * Get direct messages
   */
  abstract getDirectMessages(
    limit: number,
    before?: string
  ): Promise<{ messages: any[]; nextCursor?: string }>;

  /**
   * Send direct message
   */
  abstract sendDirectMessage(
    recipientId: string,
    message: string,
    attachmentUrl?: string
  ): Promise<{ success: boolean; id?: string; error?: string }>;

  /**
   * Get comments on a content item
   */
  abstract getComments(
    contentId: string,
    limit: number,
    before?: string
  ): Promise<{ comments: any[]; nextCursor?: string }>;

  /**
   * Post a comment on a content item
   */
  abstract postComment(
    contentId: string,
    comment: string
  ): Promise<{ success: boolean; id?: string; error?: string }>;

  /**
   * Get platform-specific analytics
   */
  abstract getAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{ [key: string]: any }>;

  /**
   * Check if the platform API is available
   */
  abstract checkApiStatus(): Promise<boolean>;
} 