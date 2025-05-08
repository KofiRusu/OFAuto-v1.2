import { BaseMockPlatform } from './base-mock-platform';
import { AnalyticsResult } from '../../integrations/BasePlatformIntegration';

export class OnlyFansMockPlatform extends BaseMockPlatform {
  constructor(platformId: string) {
    super(platformId, 'ONLYFANS');
  }

  /**
   * Override fetchStats to add OnlyFans-specific analytics
   */
  async fetchStats(): Promise<AnalyticsResult> {
    const baseStats = await super.fetchStats();
    
    // Add OnlyFans-specific metrics
    return {
      ...baseStats,
      tierBreakdown: [
        {
          tierId: 'subscription',
          tierName: 'Monthly Subscription',
          tierAmount: 9.99,
          supporterCount: Math.floor(Math.random() * 500) + 100
        },
        {
          tierId: 'tips',
          tierName: 'Tips',
          tierAmount: 5.00,
          supporterCount: Math.floor(Math.random() * 200) + 50
        }
      ],
      // Add extra OF-specific fields
      metadata: {
        messagePrice: 5.00,
        tipRatio: (Math.random() * 30 + 10).toFixed(1) + '%',
        averageRebillRate: (Math.random() * 40 + 40).toFixed(1) + '%'
      }
    };
  }
} 