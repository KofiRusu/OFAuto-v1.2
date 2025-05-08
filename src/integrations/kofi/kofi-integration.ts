import {
  BasePlatformIntegration,
  AuthResult,
  AnalyticsResult,
  PostPayload,
  PostResult,
  ActivityResult,
} from '../BasePlatformIntegration';
import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import {
  authenticateWithApiKey,
  getApiKey,
  hasValidApiKey,
} from './kofi-auth';
import {
  createKofiApiClient,
  KOFI_API_BASE_URL,
  parseDonations,
  parseShopOrders,
  formatDateForKofi,
  logApiError,
} from './kofi-utils';
import { logger } from '@/lib/logger';

/**
 * Ko-fi platform integration.
 * Implements BasePlatformIntegration for Ko-fi's API.
 */
export class KofiIntegration implements BasePlatformIntegration {
  private platformId: string;

  constructor(platformId: string) {
    this.platformId = platformId;
  }

  /**
   * Initialize the integration by checking for a valid API key.
   */
  public async initialize(): Promise<boolean> {
    try {
      return await hasValidApiKey(this.platformId);
    } catch (error) {
      logger.error('Error initializing Ko-fi integration', { error, platformId: this.platformId });
      return false;
    }
  }

  /**
   * Authenticate with Ko-fi using the provided API key.
   * @param apiKey Ko-fi API key
   */
  public async authenticate(apiKey: string): Promise<AuthResult> {
    return authenticateWithApiKey(apiKey, this.platformId);
  }

  /**
   * Fetch stats from Ko-fi (supporters, donations, etc.)
   */
  public async fetchStats(): Promise<AnalyticsResult> {
    try {
      logger.info('Fetching Ko-fi stats', { platformId: this.platformId });
      
      const apiKey = await getApiKey(this.platformId);
      if (!apiKey) {
        throw new Error('Ko-fi API key not available');
      }
      
      const client = createKofiApiClient(apiKey);

      // Fetch user data (includes supporter count)
      const userResponse = await client.get('/user');
      const userData = userResponse.data;
      const followers = userData?.supporter_count || 0;

      // Fetch recent donations to estimate monthly/lifetime income
      // Ko-fi API doesn't provide direct monthly/lifetime totals
      // We fetch recent donations and calculate based on them
      // Note: This might not be perfectly accurate for true "lifetime" or exact "monthly"
      const donationsResponse = await client.get('/donations', {
        params: {
          limit: 1000, // Fetch a larger number to estimate lifetime
        },
      });
      const donations = parseDonations(donationsResponse.data);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let incomeMonthly = 0;
      let incomeLifetime = 0;
      
      donations.forEach(donation => {
        incomeLifetime += donation.amount;
        if (donation.timestamp >= thirtyDaysAgo) {
          incomeMonthly += donation.amount;
        }
      });
      
      // Ko-fi doesn't have explicit tiers in the same way as Patreon via API
      // We can potentially derive some info from subscription payments if needed later.
      const tierBreakdown: AnalyticsResult['tierBreakdown'] = [];

      const result: AnalyticsResult = {
        followers,
        totalIncome: incomeLifetime, // Reporting lifetime as totalIncome
        currency: donations[0]?.currency || 'USD', // Guess currency from first donation
        tierBreakdown, // Ko-fi API doesn't provide this directly
        lastUpdated: new Date(),
        // Add monthly income as metadata if needed, or adjust primary field
        // monthlyIncome: incomeMonthly 
      };

      logger.info('Successfully fetched Ko-fi stats', { platformId: this.platformId, ...result });
      return result;

    } catch (error) {
      logger.error('Error fetching Ko-fi stats', { error, platformId: this.platformId });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logApiError(error); // Use the utility logger
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: `Failed to fetch Ko-fi stats: ${errorMessage}`,
      };
    }
  }

  /**
   * Create a post on Ko-fi (Not Supported)
   */
  public async createPost(payload: PostPayload): Promise<PostResult> {
    logger.warn('Ko-fi API does not support post creation. Skipping.', { platformId: this.platformId });
    return {
      successful: false,
      error: 'Ko-fi API does not support post creation currently',
    };
  }

  /**
   * Poll for new Ko-fi donations and subscriptions
   */
  public async pollNewActivity(): Promise<ActivityResult[]> {
    try {
      logger.info('Polling Ko-fi activity', { platformId: this.platformId });
      
      const apiKey = await getApiKey(this.platformId);
      if (!apiKey) {
        throw new Error('Ko-fi API key not available for polling');
      }

      // Get last check time
      const credentialService = CredentialService.getInstance();
      const credentials = await credentialService.getCredentials(this.platformId);
      const lastCheckTimeISO = credentials.lastKofiActivityPoll;
      const lastCheckTime = lastCheckTimeISO ? new Date(lastCheckTimeISO) : new Date(Date.now() - 5 * 60 * 1000); // Default to 5 minutes ago

      logger.debug('Ko-fi poll details', { platformId: this.platformId, lastCheckTime });

      // Save current time for next check BEFORE making the API call
      const currentTime = new Date();
      await credentialService.storeCredentials(this.platformId, {
        ...credentials,
        lastKofiActivityPoll: currentTime.toISOString(),
      });

      const client = createKofiApiClient(apiKey);
      const notificationsResponse = await client.get('/notifications', {
          params: {
              since: formatDateForKofi(lastCheckTime) // Use ISO string format
          }
      });

      const notifications = notificationsResponse.data?.notifications || [];
      const activities: ActivityResult[] = [];
      
      // Use parseDonations which handles various fields
      const parsedActivities = parseDonations(notifications);

      for (const activityData of parsedActivities) {
          // Ensure timestamp is valid and after last check
          if (!activityData.timestamp || activityData.timestamp <= lastCheckTime) {
              continue;
          }
          
          let activityType: ActivityResult['type'] = 'other';
          if (activityData.isSubscription) {
              // Could differentiate between first and recurring if needed
              activityType = 'new_pledge'; // Treat subscription payments as pledges
          } else if (activityData.amount > 0) {
              // Treat one-off donations as pledges too, or classify differently if needed
               activityType = 'new_pledge';
          } // Add cases for shop orders etc. if polling those too

          activities.push({
              type: activityType,
              userId: activityData.supporterEmail || activityData.supporterName, // Use email or name as ID
              username: activityData.supporterName,
              amount: activityData.amount,
              tierId: activityData.tier, // If available from subscription
              tierName: activityData.tier,
              timestamp: activityData.timestamp,
              metadata: {
                  message: activityData.message,
                  currency: activityData.currency,
                  isSubscription: activityData.isSubscription,
                  kofiTransactionId: activityData.id,
              },
          });
      }

      logger.info(`Processed ${activities.length} new Ko-fi activities`, { platformId: this.platformId });
      return activities;

    } catch (error) {
      logger.error('Error polling Ko-fi activity', { error, platformId: this.platformId });
      logApiError(error); // Log the error
      // Do not reset poll time on error
      return [];
    }
  }
} 