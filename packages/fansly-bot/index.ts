import path from 'path';
import fs from 'fs/promises';
import { initFanslySession, createPost } from './fanslyAutomation';

/**
 * Fansly Automation Module for OFAuto
 * Provides browser-based automation for Fansly using Puppeteer
 */

interface FanslyTaskConfig {
  platformId: string;
  caption: string;
  mediaUrls?: string[];
  scheduledFor?: Date;
  tiers?: string[];
}

/**
 * Check if the session file exists
 */
export async function hasValidSession(platformId: string): Promise<boolean> {
  try {
    const sessionFile = path.join(__dirname, 'session.json');
    await fs.access(sessionFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a post on Fansly
 * This is the main function that OFAuto will call
 */
export async function createFanslyPost(config: FanslyTaskConfig): Promise<{ 
  success: boolean;
  error?: string;
  postId?: string;
}> {
  try {
    if (!await hasValidSession(config.platformId)) {
      return {
        success: false,
        error: 'No valid Fansly session found. Please run the loginAndSaveSession script first.'
      };
    }

    // Handle downloading remote media if needed
    let localMediaPath: string | undefined;
    if (config.mediaUrls && config.mediaUrls.length > 0) {
      // In a real implementation, download the remote media to a temp file
      // For simplicity, we're assuming the media is already local
      localMediaPath = config.mediaUrls[0]; // In real implementation, download this
    }

    const result = await createPost({
      caption: config.caption,
      mediaPath: localMediaPath || '',
      scheduledTime: config.scheduledFor,
      tiers: config.tiers
    });

    return {
      success: result.success,
      error: result.error,
      // In a real implementation, you would get the post ID from Fansly's response
      postId: result.success ? `fansly-post-${Date.now()}` : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create Fansly post: ${error.message}`
    };
  }
}

// Export main functions
export default {
  hasValidSession,
  createFanslyPost
}; 