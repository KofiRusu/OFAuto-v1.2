import { 
  AuthResult, 
  AnalyticsResult, 
  PostPayload, 
  PostResult, 
  DMResult,
  ActivityResult,
  BasePlatformIntegration
} from '../../integrations/BasePlatformIntegration';

/**
 * Base class for all mock platform integrations
 * Implements the BasePlatformIntegration interface with fake data
 */
export class BaseMockPlatform implements BasePlatformIntegration {
  protected platformId: string;
  protected platformType: string;
  protected fakeDelay: number = 1000; // ms

  constructor(platformId: string, platformType: string) {
    this.platformId = platformId;
    this.platformType = platformType;
  }

  /**
   * Simulate a network delay
   */
  protected async delay(ms: number = this.fakeDelay): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simulate a random chance of failure
   */
  protected simulateRandomFailure(failureRate: number = 0.1): void {
    if (Math.random() < failureRate) {
      throw new Error(`Simulated ${this.platformType} API failure`);
    }
  }

  /**
   * Authenticate with the platform
   */
  async authenticate(code: string): Promise<AuthResult> {
    await this.delay();
    this.simulateRandomFailure(0.05);

    return {
      accessToken: `mock_${this.platformType.toLowerCase()}_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      tokenType: 'Bearer',
      scope: ['read', 'write', 'dm'],
      successful: true
    };
  }

  /**
   * Fetch analytics from the platform
   */
  async fetchStats(): Promise<AnalyticsResult> {
    await this.delay();
    this.simulateRandomFailure(0.05);

    return {
      followers: Math.floor(Math.random() * 10000) + 500,
      totalIncome: Math.floor(Math.random() * 5000) + 100,
      currency: 'USD',
      tierBreakdown: [
        {
          tierId: 'tier-1',
          tierName: 'Basic',
          tierAmount: 4.99,
          supporterCount: Math.floor(Math.random() * 200) + 50
        },
        {
          tierId: 'tier-2',
          tierName: 'Premium',
          tierAmount: 9.99,
          supporterCount: Math.floor(Math.random() * 100) + 20
        },
        {
          tierId: 'tier-3',
          tierName: 'VIP',
          tierAmount: 19.99,
          supporterCount: Math.floor(Math.random() * 50) + 5
        }
      ],
      lastUpdated: new Date()
    };
  }

  /**
   * Create a post on the platform
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    await this.delay();
    this.simulateRandomFailure(0.1);

    return {
      postId: `mock_post_${Date.now()}`,
      url: `https://${this.platformType.toLowerCase()}.com/post/mock_${Date.now()}`,
      successful: true,
      scheduledFor: payload.scheduledFor
    };
  }

  /**
   * Send a direct message on the platform
   */
  async sendDM(recipientId: string, message: string): Promise<DMResult> {
    await this.delay();
    this.simulateRandomFailure(0.1);

    return {
      messageId: `mock_dm_${Date.now()}`,
      successful: true
    };
  }

  /**
   * Poll for new activity on the platform
   */
  async pollNewActivity(): Promise<ActivityResult[]> {
    await this.delay();
    this.simulateRandomFailure(0.05);

    const activities: ActivityResult[] = [];
    
    // Generate 0-5 random activities
    const activityCount = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < activityCount; i++) {
      const types: ActivityResult['type'][] = ['new_pledge', 'deleted_pledge', 'updated_pledge', 'new_message', 'other'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      activities.push({
        type: randomType,
        userId: `mock_user_${Math.floor(Math.random() * 1000)}`,
        username: `mock_username_${Math.floor(Math.random() * 1000)}`,
        amount: randomType.includes('pledge') ? Math.floor(Math.random() * 50) + 5 : undefined,
        tierId: randomType.includes('pledge') ? `tier-${Math.floor(Math.random() * 3) + 1}` : undefined,
        tierName: randomType.includes('pledge') ? ['Basic', 'Premium', 'VIP'][Math.floor(Math.random() * 3)] : undefined,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)), // Random time in last 24h
        metadata: {
          source: 'mock',
          platform: this.platformType
        }
      });
    }
    
    return activities;
  }
} 