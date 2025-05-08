import { BasePlatformIntegration } from '../../integrations/BasePlatformIntegration';
import { BaseMockPlatform } from './base-mock-platform';
import { TwitterMockPlatform } from './twitter-mock';
import { OnlyFansMockPlatform } from './onlyfans-mock';

/**
 * Factory to create the appropriate mock platform based on type
 */
export function createMockPlatform(platformId: string, platformType: string): BasePlatformIntegration {
  switch (platformType.toUpperCase()) {
    case 'TWITTER':
      return new TwitterMockPlatform(platformId);
    case 'ONLYFANS':
      return new OnlyFansMockPlatform(platformId);
    default:
      // For any other platform type, use the base mock
      return new BaseMockPlatform(platformId, platformType);
  }
} 