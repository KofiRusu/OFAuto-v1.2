import { Platform, SocialMediaAccount, ContentItem } from '@prisma/client';
import { PlatformFactory } from './platform-factory';
import { prisma } from '@/lib/db/prisma';

/**
 * Service for managing social media operations across platforms
 */
export class SocialMediaService {
  /**
   * Post content to a specific social media account
   */
  async postContent(
    accountId: string,
    content: {
      title?: string;
      description?: string;
      mediaUrls?: string[];
      scheduledAt?: Date;
    }
  ): Promise<{ success: boolean; contentId?: string; error?: string }> {
    try {
      // Get the account from the database
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return { success: false, error: 'Social media account not found' };
      }

      // Get platform instance
      const platform = PlatformFactory.getPlatform(accountId, account.platform);

      // Post the content
      const result = await platform.postContent({
        text: content.description,
        mediaUrls: content.mediaUrls,
        scheduledTime: content.scheduledAt,
      });

      if (result.success && result.id) {
        // Save the content item to the database
        const contentItem = await prisma.contentItem.create({
          data: {
            title: content.title,
            description: content.description,
            contentType: determineContentType(content.mediaUrls),
            mediaUrl: content.mediaUrls?.join(','),
            scheduledAt: content.scheduledAt,
            publishedAt: content.scheduledAt ? undefined : new Date(),
            status: content.scheduledAt ? 'SCHEDULED' : 'PUBLISHED',
            socialAccountId: accountId,
            clientId: account.clientId,
          },
        });

        return {
          success: true,
          contentId: contentItem.id,
        };
      }

      return {
        success: false,
        error: result.error || 'Failed to post content',
      };
    } catch (error: any) {
      console.error('Error in SocialMediaService.postContent:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Post the same content to multiple social media accounts
   */
  async postContentToMultipleAccounts(
    accountIds: string[],
    content: {
      title?: string;
      description?: string;
      mediaUrls?: string[];
      scheduledAt?: Date;
    }
  ): Promise<{
    overallSuccess: boolean;
    results: { accountId: string; success: boolean; contentId?: string; error?: string }[];
  }> {
    const results = [];

    for (const accountId of accountIds) {
      const result = await this.postContent(accountId, content);
      results.push({
        accountId,
        success: result.success,
        contentId: result.contentId,
        error: result.error,
      });
    }

    const overallSuccess = results.some((result) => result.success);
    return {
      overallSuccess,
      results,
    };
  }

  /**
   * Get direct messages for a social media account
   */
  async getDirectMessages(
    accountId: string,
    limit: number = 20,
    before?: string
  ): Promise<{
    success: boolean;
    messages?: any[];
    nextCursor?: string;
    error?: string;
  }> {
    try {
      // Get the account from the database
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return { success: false, error: 'Social media account not found' };
      }

      // Get platform instance
      const platform = PlatformFactory.getPlatform(accountId, account.platform);

      // Get the messages
      const result = await platform.getDirectMessages(limit, before);

      // Store the messages in the database
      for (const message of result.messages) {
        await prisma.directMessage.upsert({
          where: {
            id: message.id,
          },
          update: {
            isRead: message.isRead,
          },
          create: {
            id: message.id,
            senderId: message.senderId,
            senderUsername: message.senderUsername,
            recipientId: message.recipientId,
            recipientUsername: message.recipientUsername,
            content: message.content,
            attachmentUrl: message.attachmentUrl,
            sentAt: new Date(message.sentAt),
            isRead: message.isRead,
            socialAccountId: accountId,
          },
        });
      }

      return {
        success: true,
        messages: result.messages,
        nextCursor: result.nextCursor,
      };
    } catch (error: any) {
      console.error('Error in SocialMediaService.getDirectMessages:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Send a direct message from a social media account
   */
  async sendDirectMessage(
    accountId: string,
    recipientId: string,
    message: string,
    attachmentUrl?: string,
    isAiGenerated: boolean = false,
    aiPrompt?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Get the account from the database
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return { success: false, error: 'Social media account not found' };
      }

      // Get platform instance
      const platform = PlatformFactory.getPlatform(accountId, account.platform);

      // Send the message
      const result = await platform.sendDirectMessage(recipientId, message, attachmentUrl);

      if (result.success && result.id) {
        // Save the message to the database
        const savedMessage = await prisma.directMessage.create({
          data: {
            id: result.id,
            senderId: account.username,
            recipientId: recipientId,
            content: message,
            attachmentUrl: attachmentUrl,
            sentAt: new Date(),
            isRead: true,
            socialAccountId: accountId,
            aiGenerated: isAiGenerated,
            aiPrompt: aiPrompt,
          },
        });

        return {
          success: true,
          messageId: savedMessage.id,
        };
      }

      return {
        success: false,
        error: result.error || 'Failed to send message',
      };
    } catch (error: any) {
      console.error('Error in SocialMediaService.sendDirectMessage:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get metrics for a social media account
   */
  async getAccountMetrics(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    success: boolean;
    metrics?: any;
    error?: string;
  }> {
    try {
      // Get the account from the database
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return { success: false, error: 'Social media account not found' };
      }

      // Get platform instance
      const platform = PlatformFactory.getPlatform(accountId, account.platform);

      // Get the analytics
      const analytics = await platform.getAnalytics(startDate, endDate);

      // Get engagement metrics from the database
      const engagementMetrics = await prisma.engagementMetric.findMany({
        where: {
          socialAccountId: accountId,
          recordedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Combine platform analytics with stored metrics
      const metrics = {
        ...analytics,
        engagementHistory: engagementMetrics,
      };

      return {
        success: true,
        metrics,
      };
    } catch (error: any) {
      console.error('Error in SocialMediaService.getAccountMetrics:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update content metrics for all content items of an account
   */
  async updateContentMetrics(accountId: string): Promise<{
    success: boolean;
    updatedCount: number;
    error?: string;
  }> {
    try {
      // Get the account from the database
      const account = await prisma.socialMediaAccount.findUnique({
        where: { id: accountId },
        include: {
          contentItems: {
            where: {
              status: 'PUBLISHED',
            },
          },
        },
      });

      if (!account) {
        return { success: false, error: 'Social media account not found', updatedCount: 0 };
      }

      // Get platform instance
      const platform = PlatformFactory.getPlatform(accountId, account.platform);

      let updatedCount = 0;

      // Update metrics for each content item
      for (const content of account.contentItems) {
        try {
          const metrics = await platform.getContentMetrics(content.id);
          
          // Store the metrics in the database
          await prisma.engagementMetric.create({
            data: {
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              views: metrics.views,
              contentId: content.id,
              socialAccountId: accountId,
              clientId: account.clientId,
            },
          });
          
          updatedCount++;
        } catch (error) {
          console.error(`Error updating metrics for content ${content.id}:`, error);
          // Continue with the next content item
        }
      }

      return {
        success: updatedCount > 0,
        updatedCount,
      };
    } catch (error: any) {
      console.error('Error in SocialMediaService.updateContentMetrics:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        updatedCount: 0,
      };
    }
  }
}

/**
 * Helper function to determine content type based on media URLs
 */
function determineContentType(mediaUrls?: string[]): 'IMAGE' | 'VIDEO' | 'TEXT' {
  if (!mediaUrls || mediaUrls.length === 0) {
    return 'TEXT';
  }

  const firstMediaUrl = mediaUrls[0].toLowerCase();
  if (
    firstMediaUrl.endsWith('.mp4') ||
    firstMediaUrl.endsWith('.mov') ||
    firstMediaUrl.endsWith('.avi') ||
    firstMediaUrl.endsWith('.wmv')
  ) {
    return 'VIDEO';
  }

  return 'IMAGE';
} 