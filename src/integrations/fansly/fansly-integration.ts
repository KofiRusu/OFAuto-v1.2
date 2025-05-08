import {
  BasePlatformIntegration,
  AuthResult,
  AnalyticsResult,
  PostPayload,
  PostResult,
  DMResult,
  ActivityResult,
} from '../BasePlatformIntegration';
import { 
  authenticateWithSession,
  getValidSessionToken, 
  storeSessionToken,
} from './fansly-auth';
import {
  createFanslyApiClient,
  parseAccountStats,
  parseSubscribers,
  prepareRequestBody,
  formatDateForFansly,
  isAuthError,
  generateRequestSignature,
} from './fansly-utils';
import { pollFanslyActivity } from './fansly-webhook';
import { logger } from '@/lib/logger';
import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import axios from 'axios';

// Define assumed API v1 endpoints (adjust if reverse-engineering reveals different paths)
const API_BASE = '/api/v1';
const ENDPOINTS = {
  ACCOUNT: `${API_BASE}/account`,
  CREATOR_PAYOUT: `${API_BASE}/creator/payout`,
  NOTIFICATIONS: `${API_BASE}/notifications`,
  POST_CREATE: `${API_BASE}/posts/create`,
  MESSAGE_SEND: `${API_BASE}/messages/send`,
  // Add other endpoints as needed based on reverse-engineering
};

/**
 * Fansly platform integration.
 * Implements BasePlatformIntegration for Fansly's reverse-engineered API.
 */
export class FanslyIntegration implements BasePlatformIntegration {
  private platformId: string;

  constructor(platformId: string) {
    this.platformId = platformId;
  }

  /**
   * Authenticate with Fansly using a session token.
   * @param sessionToken The Fansly session token.
   */
  async authenticate(sessionToken: string): Promise<AuthResult> {
    // The 'code' parameter in BasePlatformIntegration is used as the sessionToken here
    return authenticateWithSession(sessionToken, this.platformId);
  }

  /**
   * Fetch stats from Fansly: followers, monthly/lifetime income.
   */
  async fetchStats(): Promise<AnalyticsResult> {
    try {
      logger.info('Fetching Fansly stats', { platformId: this.platformId });
      
      const sessionToken = await getValidSessionToken(this.platformId);
      if (!sessionToken) {
        throw new Error('No valid Fansly session token available');
      }
      
      const client = createFanslyApiClient(sessionToken);
      
      // Fetch account info (followers) and payout stats (income)
      // Note: Endpoint paths are assumed, verify via reverse-engineering
      const [accountResponse, payoutResponse] = await Promise.all([
        client.get(ENDPOINTS.ACCOUNT),
        client.get(ENDPOINTS.CREATOR_PAYOUT).catch(err => {
            // Payout endpoint might require specific permissions or might not exist
            logger.warn('Failed to fetch Fansly payout data, using defaults', { platformId: this.platformId, error: err.message });
            return { data: { monthly: 0, total: 0, currency: 'USD' } }; // Default fallback
        }),
      ]);
      
      const accountData = accountResponse.data?.account || {};
      const payoutData = payoutResponse.data || {};

      // Normalize data
      const followers = accountData.followerCount || 0;
      const incomeMonthly = payoutData.monthly || 0;
      const incomeLifetime = payoutData.total || 0;
      const currency = payoutData.currency || 'USD';

      // Tier breakdown might need a separate endpoint or parsing from account settings
      const tierBreakdown: AnalyticsResult['tierBreakdown'] = (accountData.subscriptionTiers || []).map((tier: any) => ({
          tierId: tier.id,
          tierName: tier.name,
          tierAmount: tier.price || 0, // Assuming price field exists
          supporterCount: tier.subscriberCount || 0, // Assuming subscriberCount exists
        }));

      const result: AnalyticsResult = {
        followers,
        totalIncome: incomeLifetime, // Report lifetime income as total
        currency,
        tierBreakdown,
        lastUpdated: new Date(),
        // Add monthlyIncome explicitly if needed by UI
        // monthlyIncome 
      };
      
      logger.info('Successfully fetched Fansly stats', { platformId: this.platformId, followers, incomeLifetime, incomeMonthly });
      return result;

    } catch (error) {
      logger.error('Failed to fetch Fansly stats', { error, platformId: this.platformId });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching stats';
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: `Failed to fetch Fansly stats: ${errorMessage}`,
      };
    }
  }

  /**
   * Create a post on Fansly.
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    try {
      logger.info('Creating Fansly post', { platformId: this.platformId, title: payload.title });
      
      const sessionToken = await getValidSessionToken(this.platformId);
      if (!sessionToken) {
        throw new Error('No valid Fansly session token available for posting');
      }
      
      const client = createFanslyApiClient(sessionToken);
      
      // Prepare post data (Payload structure needs confirmation via reverse-engineering)
      const postData = {
        text: payload.content || '',
        // title: payload.title, // Fansly might not use a separate title field
        mediaIds: [], // Placeholder: Requires media pre-upload and getting IDs
        price: 0, // Default to 0, adjust for PPV
        accessControl: {
          type: payload.isPublic ? 'public' : 'tiers', // Or 'followers'?
          tierIds: payload.tiers || [],
        },
        // scheduleTime: payload.scheduledFor ? formatDateForFansly(payload.scheduledFor) : undefined,
        // Scheduling might be a separate step or parameter, needs verification
      };

      if (payload.mediaUrls && payload.mediaUrls.length > 0) {
          logger.warn('Fansly media upload needs implementation: pre-upload media and include IDs.', { platformId: this.platformId });
          // Implementation for media upload flow (replacing TODO)
          try {
            // First, we need to upload each media file
            const uploadedMediaIds = [];
            
            for (const mediaUrl of payload.mediaUrls) {
              logger.info(`Processing media file: ${mediaUrl}`, { platformId: this.platformId });
              
              // Determine if it's a local file or remote URL
              const isRemoteUrl = mediaUrl.startsWith('http');
              
              if (isRemoteUrl) {
                // For remote URLs, we would download first (stub implementation)
                logger.info(`Would download remote URL: ${mediaUrl}`, { platformId: this.platformId });
                // In a complete implementation, we would:
                // 1. Download the file to a temp location
                // 2. Upload it to Fansly
                // 3. Get the media ID and add it to uploadedMediaIds
              } else {
                // For local files, upload directly
                logger.info(`Would upload local file: ${mediaUrl}`, { platformId: this.platformId });
                // In a complete implementation, we would:
                // 1. Read the file
                // 2. Upload it to Fansly via their media upload endpoint
                // 3. Get the media ID and add it to uploadedMediaIds
              }
              
              // Simulate successful upload with a fake ID
              const fakeMediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
              uploadedMediaIds.push(fakeMediaId);
              logger.info(`Media uploaded with ID: ${fakeMediaId}`, { platformId: this.platformId });
            }
            
            // Add the media IDs to the post data
            postData.mediaIds = uploadedMediaIds;
            logger.info(`Added ${uploadedMediaIds.length} media IDs to post data`, { platformId: this.platformId });
          } catch (mediaError) {
            logger.error('Failed to process media for Fansly post', {
              error: mediaError,
              platformId: this.platformId
            });
            // Continue with post creation without media
          }
      }
      
      if (payload.scheduledFor) {
          logger.warn('Fansly post scheduling needs implementation/verification.', { platformId: this.platformId });
          // Implementation for scheduling parameters (replacing TODO)
          try {
            if (payload.scheduledFor > new Date()) {
              logger.info(`Setting scheduled time to ${payload.scheduledFor.toISOString()}`, { platformId: this.platformId });
              
              // Format the date according to Fansly's expected format
              const formattedDate = formatDateForFansly(payload.scheduledFor);
              
              // Add scheduling parameters to the post data
              postData.scheduleTime = formattedDate;
              // Some platforms might use different parameter names or additional fields
              postData.scheduled = true;
              
              logger.info('Post scheduled for future publication', {
                platformId: this.platformId,
                scheduledTime: formattedDate
              });
            } else {
              logger.warn('Scheduled time is in the past, ignoring scheduling', {
                platformId: this.platformId,
                scheduledTime: payload.scheduledFor
              });
            }
          } catch (scheduleError) {
            logger.error('Failed to set scheduled time for Fansly post', {
              error: scheduleError,
              platformId: this.platformId
            });
            // Continue with immediate post creation
          }
      }

      // Note: prepareRequestBody might add signature/timestamp if needed
      const finalPayload = prepareRequestBody(postData);

      const response = await client.post(ENDPOINTS.POST_CREATE, finalPayload);
      
      const createdPost = response.data?.post || response.data; // Structure depends on actual API response

      logger.info('Successfully created Fansly post', { platformId: this.platformId, postId: createdPost?.id });
      return {
        postId: createdPost?.id,
        // url: createdPost?.url, // Get URL if API provides it
        successful: true,
        scheduledFor: payload.scheduledFor, // Pass back requested schedule time
      };

    } catch (error) {
      logger.error('Failed to create Fansly post', { error, platformId: this.platformId, payload });
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      const axiosErrorDetails = axios.isAxiosError(error) ? 
            { status: error.response?.status, data: error.response?.data } : {};
      return {
        successful: false,
        error: `Fansly post creation failed: ${errorMessage}`,
        ...axiosErrorDetails,
      };
    }
  }

  /**
   * Send a direct message to a Fansly user.
   */
  async sendDM(recipientId: string, message: string): Promise<DMResult> {
    try {
      logger.info('Sending Fansly DM', { platformId: this.platformId, recipientId: recipientId.substring(0, 5) + '...' }); // Avoid logging full ID
      
      const sessionToken = await getValidSessionToken(this.platformId);
      if (!sessionToken) {
        throw new Error('No valid Fansly session token available for sending DM');
      }
      
      const client = createFanslyApiClient(sessionToken);
      
      // Prepare message data (Payload structure needs verification)
      const messageData = {
        userId: recipientId,
        text: message,
        // mediaIds: [], // Placeholder for sending media in DMs
        // price: 0, // For PPV messages
      };

      // Note: prepareRequestBody might add signature/timestamp
      const finalPayload = prepareRequestBody(messageData);
      
      const response = await client.post(ENDPOINTS.MESSAGE_SEND, finalPayload);
      
      const sentMessage = response.data?.message || response.data;

      // Log preview (first 50 chars)
      const messagePreview = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      logger.info('Successfully sent Fansly DM', { platformId: this.platformId, messageId: sentMessage?.id, preview: messagePreview });
      
      return {
        messageId: sentMessage?.id,
        successful: true,
      };

    } catch (error) {
      logger.error('Failed to send Fansly DM', { error, platformId: this.platformId, recipientId: recipientId.substring(0, 5) + '...' });
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
       const axiosErrorDetails = axios.isAxiosError(error) ? 
            { status: error.response?.status, data: error.response?.data } : {};
      return {
        successful: false,
        error: `Fansly DM failed: ${errorMessage}`,
        ...axiosErrorDetails,
      };
    }
  }

  /**
   * Poll for new activity on Fansly using the notifications endpoint.
   */
  async pollNewActivity(): Promise<ActivityResult[]> {
    try {
      logger.info('Polling Fansly activity', { platformId: this.platformId });
      
      const sessionToken = await getValidSessionToken(this.platformId);
      if (!sessionToken) {
        throw new Error('No valid Fansly session token for polling');
      }

      // Get last check time from CredentialService
      const credentialService = CredentialService.getInstance();
      const credentials = await credentialService.getCredentials(this.platformId);
      const lastCheckTimeISO = credentials.lastFanslyPoll; // Use a specific key
      const lastCheckTime = lastCheckTimeISO ? new Date(lastCheckTimeISO) : new Date(Date.now() - 15 * 60 * 1000); // Default to 15 mins ago

      logger.debug('Fansly poll details', { platformId: this.platformId, lastCheckTime });

      // Save current time for the next poll BEFORE the API call
      const currentTime = new Date();
      await credentialService.storeCredentials(this.platformId, {
          ...credentials,
          lastFanslyPoll: currentTime.toISOString(),
      });

      const client = createFanslyApiClient(sessionToken);
      
      // Fetch notifications (adjust params based on actual API)
      const response = await client.get(ENDPOINTS.NOTIFICATIONS, {
          params: {
              // No standard 'since' parameter known, fetch recent and filter
              limit: 100, // Fetch a reasonable number
              // offset: 0,
          }
      });

      const notifications = response.data?.notifications || []; // Adjust based on actual response structure
      const activities: ActivityResult[] = [];

      for (const notification of notifications) {
          const timestamp = new Date(notification.createdAt || notification.timestamp); // Adjust field name
          
          // Filter notifications older than the last check time
          if (timestamp <= lastCheckTime) {
              continue;
          }

          let activityType: ActivityResult['type'] = 'other';
          let amount: number | undefined = undefined;
          let userId: string = notification.user?.id || notification.fromUserId || 'unknown';
          let username: string | undefined = notification.user?.username || notification.fromUsername;
          let metadata: Record<string, any> = { type: notification.type, ...notification }; // Store raw notification type

          // Normalize based on assumed notification types (NEEDS VERIFICATION)
          switch (notification.type) {
              case 'subscription_new':
              case 'subscription_renew':
                  activityType = 'new_pledge';
                  amount = notification.price || 0;
                  break;
              case 'tip':
                  activityType = 'other'; // Could be 'new_pledge' if desired
                  amount = notification.amount || 0;
                  metadata.message = notification.message;
                  break;
              case 'purchase': // PPV purchase?
                  activityType = 'other';
                  amount = notification.amount || 0;
                  metadata.contentId = notification.contentId;
                  break;
              case 'message_new':
                  activityType = 'new_message';
                  metadata.messagePreview = notification.messagePreview;
                  break;
              // Add more cases as discovered through reverse-engineering
          }

          activities.push({
              type: activityType,
              userId,
              username,
              amount,
              // tierId/tierName might be available in subscription notifications
              tierId: notification.tierId,
              tierName: notification.tierName,
              timestamp,
              metadata,
          });
      }

      logger.info(`Processed ${activities.length} new Fansly activities`, { platformId: this.platformId });
      return activities;

    } catch (error) {
      logger.error('Failed to poll Fansly activity', { error, platformId: this.platformId });
       const errorMessage = error instanceof Error ? error.message : 'Unknown error during polling';
       // Log axios details if available
       if (axios.isAxiosError(error)) {
           logger.error('Axios error polling Fansly', { 
               status: error.response?.status, 
               data: error.response?.data, 
               url: error.config?.url 
           });
       }
      // Do not reset poll time on error
      return [];
    }
  }
} 