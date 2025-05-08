import {
  BasePlatformIntegration,
  AuthResult,
  AnalyticsResult,
  PostPayload,
  PostResult,
  ActivityResult,
} from '../BasePlatformIntegration';
import { CredentialService } from '@/lib/execution-agent/credential-service';
import {
  exchangeCodeForToken,
  getValidAccessToken,
} from './patreon-auth';
import {
  axiosWithRetry,
  PATREON_API_BASE_URL,
  extractCampaignId,
  parsePatrons,
  formatDateForPatreon,
} from './patreon-utils';
import { logger } from '@/lib/logger';
import axios from 'axios';

/**
 * Patreon platform integration.
 * Implements BasePlatformIntegration for Patreon's API.
 */
export class PatreonIntegration implements BasePlatformIntegration {
  private platformId: string;
  private campaignId: string | null = null;

  constructor(platformId: string) {
    this.platformId = platformId;
  }

  /**
   * Initialize the integration by loading campaign ID
   */
  public async initialize(): Promise<boolean> {
    try {
      // Get campaign ID if we don't have it already
      if (!this.campaignId) {
        await this.fetchCampaignId();
      }
      
      return !!this.campaignId;
    } catch (error) {
      console.error('Error initializing Patreon integration:', error);
      return false;
    }
  }

  /**
   * Authenticate with Patreon using the authorization code from OAuth flow
   * @param code Authorization code from OAuth flow
   */
  public async authenticate(code: string): Promise<AuthResult> {
    try {
      // Exchange code for tokens and store them
      const authResult = await exchangeCodeForToken(code, this.platformId);
      
      if (authResult.successful) {
        // Initialize to get campaign ID
        await this.initialize();
      }
      
      return authResult;
    } catch (error) {
      console.error('Error authenticating with Patreon:', error);
      return {
        accessToken: '',
        successful: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch campaign ID for this creator
   */
  private async fetchCampaignId(): Promise<string | null> {
    try {
      const accessToken = await getValidAccessToken(this.platformId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const response = await axiosWithRetry.get('/campaigns', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      this.campaignId = extractCampaignId(response.data);
      return this.campaignId;
    } catch (error) {
      console.error('Error fetching Patreon campaign ID:', error);
      return null;
    }
  }

  /**
   * Fetch stats from Patreon (patrons, pledges, etc.)
   */
  public async fetchStats(): Promise<AnalyticsResult> {
    try {
      logger.info('Fetching Patreon stats', { platformId: this.platformId });
      if (!await this.initialize()) {
        throw new Error('Failed to initialize Patreon integration');
      }

      const accessToken = await getValidAccessToken(this.platformId);
      if (!accessToken || !this.campaignId) {
        throw new Error('No valid access token or campaign ID available');
      }

      // Fetch campaign details including patron count and pledge sum
      const campaignResponse = await axiosWithRetry.get(`/campaigns/${this.campaignId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          'include': 'tiers',
          'fields[campaign]': 'patron_count,pledge_sum,created_at', // Request needed fields
          'fields[tier]': 'title,amount_cents,patron_count,published,description',
          'json-api-use-default-includes': false,
        },
      });

      const campaignData = campaignResponse.data.data;
      const attributes = campaignData.attributes || {};
      const includedTiers = campaignResponse.data.included?.filter((inc: any) => inc.type === 'tier') || [];

      // Calculate monthly income (pledge_sum is in cents)
      const incomeMonthly = (attributes.pledge_sum || 0) / 100;
      
      // Note: Patreon API v2 doesn't directly provide lifetime earnings easily.
      // It might require iterating through all members or historical pledge events.
      // For now, we'll omit incomeLifetime.

      // Format tier breakdown
      const tierBreakdown = includedTiers
        .filter((tier: any) => tier.attributes?.published !== false)
        .map((tier: any) => ({
          tierId: tier.id,
          tierName: tier.attributes?.title || 'Unknown Tier',
          tierAmount: (tier.attributes?.amount_cents || 0) / 100, // Convert cents
          supporterCount: tier.attributes?.patron_count || 0,
        }));

      const result: AnalyticsResult = {
        followers: attributes.patron_count || 0,
        totalIncome: incomeMonthly, // Using monthly income as total for now
        currency: 'USD', // Patreon API v2 primarily uses USD
        tierBreakdown,
        lastUpdated: new Date(),
        // incomeLifetime: undefined, // Explicitly undefined as we can't easily get it
      };

      logger.info('Successfully fetched Patreon stats', { platformId: this.platformId, followers: result.followers, monthlyIncome: result.totalIncome });
      return result;
      
    } catch (error) {
      logger.error('Error fetching Patreon stats', { error, platformId: this.platformId });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during fetchStats';
      // Check for specific API errors if needed
      // if (axios.isAxiosError(error) && error.response?.status === 401) { ... }
      return {
        followers: 0,
        totalIncome: 0,
        currency: 'USD',
        tierBreakdown: [],
        lastUpdated: new Date(),
        error: `Failed to fetch Patreon stats: ${errorMessage}`,
      };
    }
  }

  /**
   * Create a post on Patreon
   * @param payload Post data
   */
  public async createPost(payload: PostPayload): Promise<PostResult> {
    try {
      logger.info('Attempting to create Patreon post', { platformId: this.platformId, title: payload.title });
      if (!await this.initialize()) {
        throw new Error('Failed to initialize Patreon integration for createPost');
      }

      const accessToken = await getValidAccessToken(this.platformId);
      if (!accessToken || !this.campaignId) {
        throw new Error('No valid access token or campaign ID available for createPost');
      }

      // Prepare the base post data
      const postData: any = {
        data: {
          type: 'post',
          attributes: {
            title: payload.title,
            content: payload.content || '', // Ensure content is at least an empty string
            is_public: payload.isPublic === true,
            // Patreon API v2 uses 'publish' or 'draft' for post_type, defaults to publish if not set
            // For scheduled posts, it needs to be explicitly set
          },
          relationships: {
            campaign: {
              data: {
                type: 'campaign',
                id: this.campaignId,
              },
            },
          },
        },
      };

      // Handle scheduling
      if (payload.scheduledFor && payload.scheduledFor > new Date()) {
        postData.data.attributes.scheduled_for = formatDateForPatreon(payload.scheduledFor);
        // Scheduled posts might require a specific post_type, check Patreon docs if needed
        // postData.data.attributes.post_type = 'scheduled'; // Example if needed
        logger.info('Scheduling Patreon post', { platformId: this.platformId, scheduleTime: payload.scheduledFor });
      }

      // Handle tier access (if not public)
      if (!payload.isPublic && payload.tiers && payload.tiers.length > 0) {
        postData.data.relationships.access_rules = {
            data: [
                { type: 'access-rule', attributes: { access_rule_type: 'tier', amount_cents: 0 } }
            ]
        };
        postData.data.relationships.tiers = {
          data: payload.tiers.map(tierId => ({
            type: 'tier',
            id: tierId,
          })),
        };
         postData.data.attributes.post_metadata = { tier_ids: payload.tiers }; // Some API versions might prefer this
      } else if (!payload.isPublic) {
          // Default to patron-only if not public and no specific tiers given
          postData.data.relationships.access_rules = {
              data: [
                  { type: 'access-rule', attributes: { access_rule_type: 'patron', amount_cents: 0 } }
              ]
          };
      }
      
      // Handle Media Upload (Stubbed)
      if (payload.mediaUrls && payload.mediaUrls.length > 0) {
        logger.warn('Patreon media upload via URL is not directly supported by API v2. Media needs pre-uploading.', { platformId: this.platformId });
        // In a real implementation: 
        // 1. Upload media to a suitable storage (e.g., S3)
        // 2. Get Patreon upload URLs via their API
        // 3. Upload to Patreon's storage
        // 4. Attach media IDs to the post request
        // For now, we skip this and just create the text post.
      }

      // Create the post
      const response = await axiosWithRetry.post('/posts', postData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.api+json', // Use JSON:API content type
        },
      });

      const createdPost = response.data?.data;
      const postId = createdPost?.id;
      const postUrl = createdPost?.attributes?.url;

      logger.info('Successfully created Patreon post', { platformId: this.platformId, postId, postUrl });
      return {
        postId,
        url: postUrl,
        successful: true,
        scheduledFor: payload.scheduledFor,
      };
    } catch (error) {
      logger.error('Error creating Patreon post', { error, platformId: this.platformId, payload });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during createPost';
      // Further error details if AxiosError
      const axiosErrorDetails = axios.isAxiosError(error) ? 
            { status: error.response?.status, data: error.response?.data } : {};
            
      return {
        successful: false,
        error: `Failed to create Patreon post: ${errorMessage}`, 
        ...axiosErrorDetails // Include status/data if available
      };
    }
  }

  /**
   * Poll for new patrons and pledge changes
   */
  public async pollNewActivity(): Promise<ActivityResult[]> {
    try {
      logger.info(`Polling Patreon activity for platform: ${this.platformId}`);
      if (!await this.initialize()) {
        throw new Error('Failed to initialize Patreon integration for polling');
      }

      const accessToken = await getValidAccessToken(this.platformId);
      if (!accessToken || !this.campaignId) {
        throw new Error('No valid access token or campaign ID available for polling');
      }

      // Get last check time
      const credentialService = CredentialService.getInstance();
      const credentials = await credentialService.getCredentials(this.platformId);
      // Use a dedicated key for polling timestamp
      const lastCheckTimeISO = credentials.lastPatreonActivityPoll;
      const lastCheckTime = lastCheckTimeISO ? new Date(lastCheckTimeISO) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago if first time

      logger.debug('Patreon poll details', { platformId: this.platformId, lastCheckTime });
      
      // Save current time for next check BEFORE making the API call
      const currentTime = new Date();
      await credentialService.storeCredentials(this.platformId, {
        ...credentials, // Keep existing credentials
        lastPatreonActivityPoll: currentTime.toISOString(),
      });

      // Get members updated since the last check time
      // Patreon API uses `last_charge_date` or relationship start for filtering, 
      // but there isn't a perfect `updated_since` filter for general member changes.
      // We fetch recent members and filter client-side based on pledge start/update times if needed.
      // The most reliable way might be webhooks, but polling requires fetching members.
      const membersResponse = await axiosWithRetry.get(`/campaigns/${this.campaignId}/members`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          'include': 'currently_entitled_tiers,user', // Include user data and tiers
          'fields[member]': 'patron_status,last_charge_status,pledge_relationship_start,email,full_name,last_charge_date', 
          'fields[tier]': 'title,amount_cents',
          'fields[user]': 'full_name,email', // Request user fields
          'page[count]': 200, // Fetch a reasonable number of recent members
          'sort': '-last_charge_date', // Sort by recent charge date might catch updates
        },
      });

      // Parse members and included data
      const patrons = parsePatrons(membersResponse.data);
      logger.info(`Fetched ${patrons.length} patrons potentially updated since ${lastCheckTime.toISOString()}`, { platformId: this.platformId });

      const activities: ActivityResult[] = [];
      
      for (const patron of patrons) {
          // Determine activity timestamp (use charge date or pledge start)
          const activityTimestamp = patron.lastChargeDate ? new Date(patron.lastChargeDate) : (patron.joinedAt ? new Date(patron.joinedAt) : new Date());
          
          // Only process activities that occurred *after* the last check time
          if (activityTimestamp <= lastCheckTime) {
              continue; // Skip activities already processed
          }

          let activityType: ActivityResult['type'] = 'other';
          
          // Refined logic based on status and timing
          if (patron.patronStatus === 'active_patron') {
              const joinedDate = patron.joinedAt ? new Date(patron.joinedAt) : null;
              // Consider it a new pledge if joinedAt is after lastCheckTime
              if (joinedDate && joinedDate > lastCheckTime) {
                  activityType = 'new_pledge';
              } else {
                  // Otherwise, consider it an update (e.g., tier change, payment)
                  activityType = 'updated_pledge';
              }
          } else if (patron.patronStatus === 'former_patron' || patron.patronStatus === 'declined_patron') {
              activityType = 'deleted_pledge'; // Or potentially 'updated_pledge' if just declined
          }

          activities.push({
              type: activityType,
              userId: patron.id, // Member ID
              username: patron.fullName || patron.email, // Use name, fallback to email
              amount: patron.pledgeAmount ? patron.pledgeAmount / 100 : 0, // Convert cents
              tierId: patron.tierId,
              tierName: patron.tierTitle,
              timestamp: activityTimestamp,
              metadata: { 
                  patronStatus: patron.patronStatus,
                  isFollower: patron.isFollower,
                  lastChargeStatus: patron.lastChargeStatus,
                  email: patron.email // Include email if available
              },
          });
      }
      
      logger.info(`Processed ${activities.length} new Patreon activities`, { platformId: this.platformId });
      return activities;

    } catch (error) {
      logger.error('Error polling Patreon activity', { error, platformId: this.platformId });
       const errorMessage = error instanceof Error ? error.message : 'Unknown error during pollNewActivity';
       // Log axios details if available
       if (axios.isAxiosError(error)) {
           logger.error('Axios error details', { 
               status: error.response?.status, 
               data: error.response?.data, 
               url: error.config?.url 
           });
       }
      // Do not reset the poll time on error, try again later
      return [];
    }
  }
} 