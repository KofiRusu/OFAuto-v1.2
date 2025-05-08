import { Platform } from '@prisma/client';
import { BasePlatform } from './platforms/base-platform';
import { OnlyFansPlatform } from './platforms/onlyfans';

/**
 * Factory class for creating platform-specific instances
 */
export class PlatformFactory {
  private static instances: Map<string, BasePlatform> = new Map();

  /**
   * Get a platform instance for a specific account.
   * Reuses existing instances when possible.
   */
  static getPlatform(accountId: string, platform: Platform): BasePlatform {
    const key = `${platform}-${accountId}`;
    
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let instance: BasePlatform;

    switch (platform) {
      case Platform.ONLYFANS:
        instance = new OnlyFansPlatform(accountId);
        break;
      // Add more platform implementations as they become available
      // case Platform.INSTAGRAM:
      //   instance = new InstagramPlatform(accountId);
      //   break;
      // case Platform.TWITTER:
      //   instance = new TwitterPlatform(accountId);
      //   break;
      default:
        throw new Error(`Platform ${platform} is not supported yet`);
    }

    this.instances.set(key, instance);
    return instance;
  }

  /**
   * Clear a specific platform instance from the cache
   */
  static clearPlatform(accountId: string, platform: Platform): void {
    const key = `${platform}-${accountId}`;
    this.instances.delete(key);
  }

  /**
   * Clear all platform instances from the cache
   */
  static clearAllPlatforms(): void {
    this.instances.clear();
  }
} 