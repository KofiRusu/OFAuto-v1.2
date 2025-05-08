/**
 * OnlyFans Post Automation
 * 
 * Handles creation and publishing of posts including:
 * - Text/caption posts
 * - Image uploads
 * - Video uploads
 * - Scheduled posting
 * - Tier-specific access control
 */

import path from 'path';
import { Browser, Page } from 'puppeteer';
import { 
  initSessionBrowser, 
  validateSession,
  captureDebugScreenshot,
  humanType
} from './utils/session';

/**
 * OnlyFans post selectors
 * These are subject to change if OnlyFans updates their UI
 */
const SELECTORS = {
  // Post creation
  NEW_POST_BUTTON: '.g-btn.m-rounded.m-with-icon.m-space',
  POST_TEXTAREA: '.b-new-post__input textarea',
  MEDIA_UPLOAD_INPUT: 'input[type="file"]',
  MEDIA_PREVIEW: '.b-new-post__media-grid .b-photos__item',
  
  // Media upload status
  UPLOAD_PROGRESS: '.b-new-post__upload-progress',
  UPLOAD_COMPLETE: '.b-new-post__media-grid .b-photos__item:not(.m-loading)',
  
  // Price and access controls
  PRICE_BUTTON: '.b-new-post__price button',
  PRICE_INPUT: '.b-new-post__price-form input',
  PRICE_SAVE: '.b-new-post__price-form .g-btn',
  ACCESS_BUTTON: '.b-new-post__access button',
  
  // Tiers and access settings
  FREE_ACCESS_BUTTON: '.b-new-post__access-list-item:nth-child(1)',
  PAID_ACCESS_BUTTON: '.b-new-post__access-list-item:nth-child(2)',
  TIER_ITEM: '.b-new-post__access-list-item', // Will need additional filtering for specific tiers
  
  // Scheduling
  SCHEDULE_BUTTON: '.b-new-post__schedule button',
  SCHEDULE_DATE_INPUT: '.b-new-post__schedule-form input[type="date"]',
  SCHEDULE_TIME_INPUT: '.b-new-post__schedule-form input[type="time"]',
  SCHEDULE_SAVE: '.b-new-post__schedule-form .g-btn',
  
  // Submit and confirmations
  SUBMIT_BUTTON: '.b-new-post__submit .g-btn',
  SUCCESS_NOTIFICATION: '.b-toast.m-success',
  
  // Post type selection (free/paid)
  POST_TYPE_FREE: '.b-new-post__price-form-option:nth-child(1)',
  POST_TYPE_PAID: '.b-new-post__price-form-option:nth-child(2)',
};

/**
 * Post configuration interface
 */
export interface PostConfig {
  caption: string;
  mediaPath?: string;  // Local path to image/video file
  price?: number;      // Set price for paid posts (in USD)
  scheduledTime?: Date; // Scheduled posting time
  isPublic?: boolean;  // Public or tier-specific visibility
  tier?: string;       // Tier ID or name (for tier-specific posts)
  accountId?: string;  // Optional account ID for multi-account support
}

/**
 * Post result interface
 */
export interface PostResult {
  success: boolean;
  error?: string;
  postId?: string;
  scheduledFor?: Date;
  mediaUploaded?: boolean;
  screenshotPath?: string;
}

/**
 * Create and publish an OnlyFans post
 */
export async function createPost(config: PostConfig): Promise<PostResult> {
  // Validate session before attempting to post
  const isSessionValid = await validateSession(config.accountId);
  if (!isSessionValid) {
    return {
      success: false,
      error: 'Invalid or expired session. Please run loginAndSaveSession first.'
    };
  }
  
  // Initialize browser with saved session
  const session = await initSessionBrowser(config.accountId);
  if (!session) {
    return {
      success: false,
      error: 'Failed to initialize browser with saved session.'
    };
  }
  
  const { browser, page } = session;
  
  try {
    console.log('🚀 Starting OnlyFans post creation...');
    
    // Navigate to OnlyFans home page
    await page.goto('https://onlyfans.com', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Look for the new post button and click it
    console.log('📝 Opening post composer...');
    await page.waitForSelector(SELECTORS.NEW_POST_BUTTON, { timeout: 30000 });
    await page.click(SELECTORS.NEW_POST_BUTTON);
    
    // Wait for the post editor to appear
    await page.waitForSelector(SELECTORS.POST_TEXTAREA, { timeout: 30000 });
    
    // Enter caption text with human-like typing
    console.log('✍️ Entering post caption...');
    await humanType(page, SELECTORS.POST_TEXTAREA, config.caption);
    
    // Handle media upload if a path is provided
    if (config.mediaPath) {
      await uploadMedia(page, config.mediaPath);
    }
    
    // Set post price (if applicable)
    if (config.price && config.price > 0) {
      await setPricing(page, config.price);
    }
    
    // Set scheduled time (if provided)
    if (config.scheduledTime) {
      await schedulePost(page, config.scheduledTime);
    }
    
    // Set visibility/access control
    if (!config.isPublic || config.tier) {
      await setAccessControl(page, config.isPublic || false, config.tier);
    }
    
    // Take a screenshot before submitting
    const screenshotPath = await captureDebugScreenshot(page, 'pre-submission.png');
    
    // Submit the post
    console.log('📮 Submitting post...');
    await page.click(SELECTORS.SUBMIT_BUTTON);
    
    // Wait for success notification
    await page.waitForSelector(SELECTORS.SUCCESS_NOTIFICATION, { timeout: 60000 })
      .catch(async () => {
        // If success notification doesn't appear, capture a screenshot
        await captureDebugScreenshot(page, 'submission-error.png');
        throw new Error('Post submission failed. No success notification detected.');
      });
    
    console.log('✅ Post published successfully!');
    
    return {
      success: true,
      scheduledFor: config.scheduledTime,
      mediaUploaded: !!config.mediaPath,
      screenshotPath
    };
    
  } catch (error) {
    console.error('❌ Error creating post:', error);
    // Capture screenshot on error
    const errorScreenshot = await captureDebugScreenshot(page, 'post-creation-error.png');
    return {
      success: false,
      error: `Failed to create post: ${error.message}`,
      screenshotPath: errorScreenshot
    };
  } finally {
    await browser.close();
  }
}

/**
 * Upload media file to OnlyFans post
 */
async function uploadMedia(page: Page, mediaPath: string): Promise<void> {
  try {
    console.log(`🖼️ Uploading media: ${mediaPath}`);
    
    // Ensure the file exists
    // Note: This is handled by Puppeteer
    
    // Get the file upload input
    const uploadInput = await page.$(SELECTORS.MEDIA_UPLOAD_INPUT);
    if (!uploadInput) {
      throw new Error('Media upload input not found.');
    }
    
    // Upload the file
    await uploadInput.uploadFile(mediaPath);
    
    // Wait for upload to complete
    console.log('⏳ Waiting for media upload to complete...');
    
    // First wait for upload progress indicator
    await page.waitForSelector(SELECTORS.UPLOAD_PROGRESS, { timeout: 30000 })
      .catch(() => console.log('Upload progress indicator not found, continuing...'));
    
    // Then wait for upload to complete (progress indicator disappears, preview appears)
    await page.waitForSelector(SELECTORS.UPLOAD_COMPLETE, { 
      timeout: 180000, // 3 minutes timeout for media upload
      visible: true 
    });
    
    console.log('✅ Media upload complete');
  } catch (error) {
    console.error('❌ Media upload failed:', error);
    await captureDebugScreenshot(page, 'media-upload-error.png');
    throw new Error(`Failed to upload media: ${error.message}`);
  }
}

/**
 * Set post pricing
 */
async function setPricing(page: Page, price: number): Promise<void> {
  try {
    console.log(`💰 Setting post price: $${price}`);
    
    // Click the price button to open price settings
    await page.waitForSelector(SELECTORS.PRICE_BUTTON, { timeout: 30000 });
    await page.click(SELECTORS.PRICE_BUTTON);
    
    // Select paid option
    await page.waitForSelector(SELECTORS.POST_TYPE_PAID, { timeout: 30000 });
    await page.click(SELECTORS.POST_TYPE_PAID);
    
    // Enter the price
    await page.waitForSelector(SELECTORS.PRICE_INPUT, { timeout: 30000 });
    await page.focus(SELECTORS.PRICE_INPUT);
    
    // Clear any existing value
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    // Type the new price
    await page.keyboard.type(price.toString());
    
    // Save the price setting
    await page.click(SELECTORS.PRICE_SAVE);
    console.log('✅ Price set successfully');
  } catch (error) {
    console.error('❌ Failed to set post price:', error);
    await captureDebugScreenshot(page, 'price-setting-error.png');
    throw new Error(`Failed to set post price: ${error.message}`);
  }
}

/**
 * Schedule a post for later
 */
async function schedulePost(page: Page, scheduledTime: Date): Promise<void> {
  try {
    console.log(`🕒 Scheduling post for: ${scheduledTime.toLocaleString()}`);
    
    // Click the schedule button to open schedule settings
    await page.waitForSelector(SELECTORS.SCHEDULE_BUTTON, { timeout: 30000 });
    await page.click(SELECTORS.SCHEDULE_BUTTON);
    
    // Format date in YYYY-MM-DD
    const dateStr = scheduledTime.toISOString().split('T')[0];
    
    // Format time in HH:MM (24h format)
    const hours = scheduledTime.getHours().toString().padStart(2, '0');
    const minutes = scheduledTime.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // Enter the date
    await page.waitForSelector(SELECTORS.SCHEDULE_DATE_INPUT, { timeout: 30000 });
    await page.focus(SELECTORS.SCHEDULE_DATE_INPUT);
    
    // Clear any existing value
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    // Type the new date
    await page.keyboard.type(dateStr);
    
    // Enter the time
    await page.waitForSelector(SELECTORS.SCHEDULE_TIME_INPUT, { timeout: 30000 });
    await page.focus(SELECTORS.SCHEDULE_TIME_INPUT);
    
    // Clear any existing value
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    // Type the new time
    await page.keyboard.type(timeStr);
    
    // Save the schedule
    await page.click(SELECTORS.SCHEDULE_SAVE);
    console.log('✅ Post scheduled successfully');
  } catch (error) {
    console.error('❌ Failed to schedule post:', error);
    await captureDebugScreenshot(page, 'schedule-setting-error.png');
    throw new Error(`Failed to schedule post: ${error.message}`);
  }
}

/**
 * Set post access control (public, paid, or tier-specific)
 */
async function setAccessControl(page: Page, isPublic: boolean, tierId?: string): Promise<void> {
  try {
    console.log(`🔒 Setting post access: ${isPublic ? 'Public' : tierId ? `Tier: ${tierId}` : 'Paid only'}`);
    
    // Click the access button to open access settings
    await page.waitForSelector(SELECTORS.ACCESS_BUTTON, { timeout: 30000 });
    await page.click(SELECTORS.ACCESS_BUTTON);
    
    if (isPublic) {
      // Set access to public (free)
      await page.waitForSelector(SELECTORS.FREE_ACCESS_BUTTON, { timeout: 30000 });
      await page.click(SELECTORS.FREE_ACCESS_BUTTON);
    } else if (tierId) {
      // Find and select the specified tier
      // This will need custom handling based on how OnlyFans displays tiers
      // We may need to match by name or ID
      const tierSelector = `${SELECTORS.TIER_ITEM}[data-tier-id="${tierId}"]`;
      
      try {
        await page.waitForSelector(tierSelector, { timeout: 10000 });
        await page.click(tierSelector);
      } catch (tierError) {
        // If direct ID selection fails, try to find by text content
        console.log(`Could not find tier by ID: ${tierId}, trying to find by text...`);
        
        const tiers = await page.$$(SELECTORS.TIER_ITEM);
        let tierFound = false;
        
        for (const tier of tiers) {
          const tierText = await tier.evaluate(el => el.textContent);
          if (tierText && tierText.includes(tierId)) {
            await tier.click();
            tierFound = true;
            break;
          }
        }
        
        if (!tierFound) {
          throw new Error(`Could not find tier: ${tierId}`);
        }
      }
    } else {
      // Set access to paid subscribers only
      await page.waitForSelector(SELECTORS.PAID_ACCESS_BUTTON, { timeout: 30000 });
      await page.click(SELECTORS.PAID_ACCESS_BUTTON);
    }
    
    console.log('✅ Access control set successfully');
  } catch (error) {
    console.error('❌ Failed to set access control:', error);
    await captureDebugScreenshot(page, 'access-control-error.png');
    throw new Error(`Failed to set access control: ${error.message}`);
  }
}

// CLI interface for direct use
if (require.main === module) {
  const [caption, mediaPath, priceStr, scheduledTimeISO, isPublicStr, tier, accountId] = process.argv.slice(2);
  
  if (!caption) {
    console.error('Usage: node onlyfansAutomation.js "Your caption here" [/path/to/media.jpg] [price] [ISO-date-time] [isPublic] [tier] [accountId]');
    process.exit(1);
  }
  
  const config: PostConfig = {
    caption,
    mediaPath,
    price: priceStr ? parseFloat(priceStr) : undefined,
    scheduledTime: scheduledTimeISO ? new Date(scheduledTimeISO) : undefined,
    isPublic: isPublicStr ? isPublicStr.toLowerCase() === 'true' : undefined,
    tier,
    accountId
  };
  
  createPost(config)
    .then(result => {
      if (!result.success) {
        console.error('Failed to create post:', result.error);
        process.exit(1);
      }
      console.log('Post created successfully!', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 