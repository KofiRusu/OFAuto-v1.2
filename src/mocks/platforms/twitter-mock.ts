import { BaseMockPlatform } from './base-mock-platform';
import { PostPayload, PostResult } from '../../integrations/BasePlatformIntegration';

export class TwitterMockPlatform extends BaseMockPlatform {
  constructor(platformId: string) {
    super(platformId, 'TWITTER');
  }

  /**
   * Override createPost to add Twitter-specific behavior
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    // Twitter has a character limit
    if (payload.content.length > 280) {
      return {
        successful: false,
        error: 'Tweet exceeds 280 character limit'
      };
    }

    // Default implementation from base class
    return super.createPost(payload);
  }
} 