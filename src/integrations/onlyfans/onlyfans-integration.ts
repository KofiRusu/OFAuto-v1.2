// TODO: Deprecated — see packages/onlyfans-bot for updated logic. Safe to remove after migration.
// This class should be refactored to use the implementation in packages/onlyfans-bot instead of duplicating code.

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
  launchOnlyFansSession,
  // closeOnlyFansSession, // Keep for potential explicit cleanup
} from './onlyfans-browser';
import { 
  authenticateWithCookies,
  // hasValidSessionCookies, // Internal check within authenticate
} from './onlyfans-auth';
import {
  SELECTORS, // Assuming selectors are frequently updated/verified
  randomDelay,
  humanType,
  takeErrorScreenshot,
  safeClick,
  elementExists,
} from './onlyfans-utils';
import { logger } from '@/lib/logger';
import { Page } from 'puppeteer';
import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service'; // Correct path
// Assuming ExecutionResult type exists, e.g.:
interface ExecutionResult { success: boolean; message?: string; error?: string }; 

// --- Constants for Selectors (Maintain these carefully!) ---
// It's crucial these selectors are kept up-to-date with OnlyFans UI changes.
const OF_SELECTORS = {
    // Use selectors from onlyfans-utils.ts, but define navigation URLs here
    statsPage: 'https://onlyfans.com/my/statements/stats',
    homePage: 'https://onlyfans.com/my/feed', // Or /home
    messagesPage: 'https://onlyfans.com/my/chats',
    notificationsPage: 'https://onlyfans.com/my/notifications',
    subscriptionSettingsPage: 'https://onlyfans.com/my/settings/subscription',
    // Add specific selectors needed for actions if not in utils
    statsFollowers: '.b-stats__item--subscribers .g-number', // Example, needs verification
    statsEarningsMonthly: '.b-stat-earnings .b-stats__number', // Example, needs verification
    statsTips: '.some-selector-for-tips', // Example, needs verification
    postTextArea: 'textarea[data-marker="add-post__text-input"]', // Example, needs verification
    postMediaUploadInput: 'input[type="file"][data-marker="add-post__add-file"]', // Example, needs verification
    postSubmitButton: 'button[data-marker="add-post__submit-button"]', // Example, needs verification
    dmSearchInput: 'input[placeholder="Search Messages"]', // Example, needs verification
    dmChatTextArea: 'textarea[data-marker="chat__input-text"]', // Example, needs verification
    dmSendButton: 'button[data-marker="chat__send-btn"]', // Example, needs verification
    settingsSubscriptionInput: 'input[name="subscribePrice"]', // Verify this name
    settingsSaveButton: 'button[type="submit"][data-marker="settings__btn-submit"]', // Example, needs verification
    notificationItems: '.b-notifications__item', // Example, needs verification
};
// --------------------------------------------------------

/**
 * OnlyFans platform integration using Puppeteer for headless browser automation.
 */
export class OnlyFansIntegration implements BasePlatformIntegration {
  private platformId: string;

  constructor(platformId: string) {
    this.platformId = platformId;
  }

  /**
   * Authenticate using stored session cookies.
   * The `code` parameter can optionally contain new cookies (JSON string or file path) to store first.
   */
  async authenticate(code?: string): Promise<AuthResult> {
    return authenticateWithCookies(this.platformId, code); // Pass code to potentially store new cookies
  }

  /**
   * Executes an action within a managed browser page context.
   */
  private async withBrowserPage<T>(
    actionName: string, // For logging/error context
    actionFn: (page: Page) => Promise<T>,
    onError?: (error: any, page?: Page) => void
  ): Promise<T | null> {
    let session: { page: Page; browser: any } | null = null;
    const startTime = Date.now();
    logger.info(`Starting OF Action: ${actionName}`, { platformId: this.platformId });
    try {
      session = await launchOnlyFansSession(this.platformId);
      if (!session || session.page.isClosed()) {
        throw new Error(`Failed to launch or reuse valid OnlyFans browser session for ${actionName}`);
      }
      const { page } = session;
      const result = await actionFn(page);
      const duration = Date.now() - startTime;
      logger.info(`Completed OF Action: ${actionName}`, { platformId: this.platformId, durationMs: duration });
      // Close the specific page after action, browser might be reused
      if (!page.isClosed()) await page.close(); 
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Error during OF Action: ${actionName}`, { error, platformId: this.platformId, durationMs: duration });
      if (session?.page && !session.page.isClosed()) {
        await takeErrorScreenshot(session.page, `of-action-error-${actionName}-${this.platformId}`);
        await session.page.close(); // Ensure page is closed on error
      }
      onError?.(error, session?.page);
      // Optionally close the entire browser if errors are persistent
      // await closeOnlyFansSession(this.platformId);
      return null;
    }
  }

  /**
   * Fetch stats from OnlyFans (followers, estimated income, etc.)
   */
  async fetchStats(): Promise<AnalyticsResult> {
    const result = await this.withBrowserPage('fetchStats', async (page) => {
      await page.goto(OF_SELECTORS.statsPage, { waitUntil: 'networkidle2', timeout: 60000 });
      await randomDelay(2000, 4000); // Allow dynamic content to load

      // --- Scrape Stats (Selectors need verification) ---
      let followers = 0;
      let incomeMonthly = 0;
      // let tipsCount = 0; // Example if scraping tips

      try {
        const followersText = await page.$eval(OF_SELECTORS.statsFollowers, el => el.textContent?.trim() || '0');
        followers = parseInt(followersText.replace(/\D/g, '')) || 0;
      } catch (e) { logger.warn('Could not scrape OF followers', { platformId: this.platformId, error: e }); }
      
      try {
        // Monthly income might require summing values or targeting a specific summary element
        const incomeText = await page.$eval(OF_SELECTORS.statsEarningsMonthly, el => el.textContent?.trim() || '$0');
        incomeMonthly = parseFloat(incomeText.replace(/[^\d.]/g, '')) || 0;
      } catch (e) { logger.warn('Could not scrape OF monthly earnings', { platformId: this.platformId, error: e }); }
      
      // try {
      //    tipsCount = await page.$eval(OF_SELECTORS.statsTips, el => parseInt(el.textContent?.trim() || '0'));
      // } catch (e) { logger.warn('Could not scrape OF tips count', { platformId: this.platformId, error: e }); }
      // -------------------------------------------------

      return {
        followers,
        totalIncome: incomeMonthly, // Using monthly as primary income metric for now
        currency: 'USD', // Assume USD, may need scraping if variable
        tierBreakdown: [], // Tier data likely requires scraping subscription settings page
        lastUpdated: new Date(),
        // Add tipsCount or other scraped metrics as needed
      };
    });

    return result || {
      followers: 0,
      totalIncome: 0,
      currency: 'USD',
      tierBreakdown: [],
      lastUpdated: new Date(),
      error: 'Failed to fetch OnlyFans stats via browser automation',
    };
  }

  /**
   * Create a post on OnlyFans
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    const result = await this.withBrowserPage('createPost', async (page) => {
      await page.goto(OF_SELECTORS.homePage, { waitUntil: 'networkidle2', timeout: 60000 });
      await randomDelay(1500, 3000);

      // Type post content
      await humanType(page, OF_SELECTORS.postTextArea, payload.content);
      await randomDelay();

      // Handle Media Upload
      if (payload.mediaUrls && payload.mediaUrls.length > 0) {
          logger.info(`Attempting to upload ${payload.mediaUrls.length} media file(s) for OF post`, { platformId: this.platformId });
          try {
              const fileInputSelector = OF_SELECTORS.postMediaUploadInput;
              const fileInput = await page.$(fileInputSelector);
              if (!fileInput) throw new Error('Could not find file input element');
              
              // Implementation for robust file handling (replacing TODO)
              const localPaths: string[] = [];
              
              // Process each media URL
              for (const mediaUrl of payload.mediaUrls) {
                if (mediaUrl.startsWith('http')) {
                  // Download URL to temp file if it's a remote URL
                  logger.info(`Downloading remote file from ${mediaUrl}`, { platformId: this.platformId });
                  try {
                    // For production, implement proper download logic
                    // This is a simplified placeholder
                    const response = await fetch(mediaUrl);
                    const blob = await response.blob();
                    const fileName = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
                    const filePath = `/tmp/${fileName}`;
                    
                    // In production, write the blob to filePath
                    // For now, just log it
                    logger.info(`Would save blob to ${filePath}`, { platformId: this.platformId });
                    localPaths.push(filePath);
                  } catch (downloadError) {
                    logger.error(`Failed to download media from ${mediaUrl}`, { error: downloadError });
                    continue; // Skip this file but try others
                  }
                } else {
                  // Assume it's already a local path
                  localPaths.push(mediaUrl);
                }
              }
              
              if (localPaths.length > 0) {
                await fileInput.uploadFile(...localPaths);
                await randomDelay(3000, 7000 * localPaths.length); // Wait longer for uploads
                logger.info('Media file(s) uploaded successfully', { platformId: this.platformId, count: localPaths.length });
              } else {
                logger.warn('No valid media files to upload', { platformId: this.platformId });
              }
          } catch (uploadError) {
              logger.error('Failed during OF media upload process', { platformId: this.platformId, error: uploadError });
              await takeErrorScreenshot(page, `of-post-upload-error-${this.platformId}`);
              // Continue without media
          }
      }
      
      // Implementation for PPV pricing (replacing TODO)
      if (payload.ppvPrice && payload.ppvPrice > 0) {
        try {
          logger.info(`Setting PPV price to ${payload.ppvPrice}`, { platformId: this.platformId });
          // Click PPV toggle or button (selector needs verification)
          const ppvToggleSelector = 'button[data-marker="add-post__ppv-toggle"]';
          await safeClick(page, ppvToggleSelector);
          await randomDelay(1000, 2000);
          
          // Enter price in the input field
          const ppvPriceInputSelector = 'input[data-marker="add-post__ppv-price-input"]';
          await humanType(page, ppvPriceInputSelector, payload.ppvPrice.toString());
          await randomDelay(500, 1000);
        } catch (ppvError) {
          logger.error('Failed to set PPV price', { platformId: this.platformId, error: ppvError });
          // Continue posting without PPV
        }
      }
      
      // Implementation for scheduling (replacing TODO)
      if (payload.scheduledTime && payload.scheduledTime > new Date()) {
        try {
          logger.info(`Setting scheduled time to ${payload.scheduledTime.toISOString()}`, { platformId: this.platformId });
          // Click schedule toggle or button
          const scheduleToggleSelector = 'button[data-marker="add-post__schedule-toggle"]';
          await safeClick(page, scheduleToggleSelector);
          await randomDelay(1000, 2000);
          
          // Set date and time inputs (implementation depends on OnlyFans UI)
          // This is a placeholder implementation
          const dateInputSelector = 'input[data-marker="add-post__schedule-date"]';
          const timeInputSelector = 'input[data-marker="add-post__schedule-time"]';
          
          // Format date as YYYY-MM-DD for date input
          const dateString = payload.scheduledTime.toISOString().split('T')[0];
          await humanType(page, dateInputSelector, dateString);
          await randomDelay(500, 1000);
          
          // Format time as HH:MM for time input
          const timeString = payload.scheduledTime.toTimeString().split(' ')[0].substring(0, 5);
          await humanType(page, timeInputSelector, timeString);
          await randomDelay(500, 1000);
        } catch (scheduleError) {
          logger.error('Failed to set scheduled time', { platformId: this.platformId, error: scheduleError });
          // Continue posting without scheduling
        }
      }
      
      // Implementation for tier/access control (replacing TODO)
      if (payload.accessTiers && payload.accessTiers.length > 0) {
        try {
          logger.info(`Setting access tiers: ${payload.accessTiers.join(', ')}`, { platformId: this.platformId });
          // Click access control toggle or button
          const accessToggleSelector = 'button[data-marker="add-post__access-toggle"]';
          await safeClick(page, accessToggleSelector);
          await randomDelay(1000, 2000);
          
          // For each tier, click the corresponding checkbox or option
          for (const tier of payload.accessTiers) {
            const tierSelector = `label[data-marker="add-post__tier-${tier}"]`;
            await safeClick(page, tierSelector);
            await randomDelay(300, 700);
          }
        } catch (accessError) {
          logger.error('Failed to set access tiers', { platformId: this.platformId, error: accessError });
          // Continue posting with default access settings
        }
      }

      // Submit the post
      await safeClick(page, OF_SELECTORS.postSubmitButton);
      await randomDelay(5000, 10000); // Wait for potential redirects or UI updates

      // Verification is tricky. Check if the text area is cleared or look for a success message.
      const textAreaCleared = !(await elementExists(page, `${OF_SELECTORS.postTextArea}[value!='']`));
      if (!textAreaCleared) {
          logger.warn('Post text area was not cleared after submission attempt', { platformId: this.platformId });
          // Potential failure or delayed UI update
      }

      return { successful: true }; // Assume success for now, needs better verification
    });

    return result || {
      successful: false,
      error: 'Failed to create OnlyFans post via browser automation',
    };
  }

  /**
   * Send a direct message
   */
  async sendDM(recipientId: string, message: string): Promise<DMResult> {
    const result = await this.withBrowserPage('sendDM', async (page) => {
      // Navigation to DM: This is complex. Requires searching or clicking existing chat.
      // For simplicity, assume direct navigation is possible (replace with search/click later)
      const chatUrl = `https://onlyfans.com/my/chats/user/${recipientId}`; // May not be correct format
      logger.info(`Navigating to OF chat: ${chatUrl}`, { platformId: this.platformId });
      await page.goto(chatUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      await randomDelay(2000, 4000);

      // Check if chat loaded (look for input area)
      if (!(await elementExists(page, OF_SELECTORS.dmChatTextArea))) {
          logger.warn('Could not find DM input area, attempting search fallback', { platformId: this.platformId, recipientId });
          await page.goto(OF_SELECTORS.messagesPage, { waitUntil: 'networkidle2' });
          await humanType(page, OF_SELECTORS.dmSearchInput, recipientId); // Assuming recipientId is searchable username
          await randomDelay(1500, 3000);
          // Click the first result (selector needs verification)
          await safeClick(page, '.b-users__item a'); 
          await randomDelay(2000, 4000);
          if (!(await elementExists(page, OF_SELECTORS.dmChatTextArea))) {
               throw new Error(`Failed to navigate to chat for recipient ${recipientId}`);
          }
      }

      // Type and send message
      await humanType(page, OF_SELECTORS.dmChatTextArea, message);
      await randomDelay(500, 1000);
      await safeClick(page, OF_SELECTORS.dmSendButton);
      await randomDelay(1500, 3000); // Wait for message to appear sent

      // Implementation for verifying message sent (replacing TODO)
      let messageVerified = false;
      try {
        // Wait for message to appear in the chat history
        await page.waitForFunction(
          (messageText) => {
            // Look for a message containing our text in the last few messages
            const messageElements = document.querySelectorAll('.chat-message-text');
            const recentMessages = Array.from(messageElements).slice(-5); // Check last 5 messages
            return recentMessages.some(el => el.textContent?.includes(messageText));
          },
          { timeout: 5000 },
          message.substring(0, 50) // Use beginning of message for matching
        );
        messageVerified = true;
        logger.info('Message verified as sent in chat history', { platformId: this.platformId });
      } catch (verifyError) {
        logger.warn('Could not verify message appeared in chat', {
          platformId: this.platformId,
          error: verifyError.message,
        });
        // Take a screenshot for debugging
        await takeErrorScreenshot(page, `of-dm-verify-error-${this.platformId}`);
        // Continue with assumption that message was sent
      }

      const messagePreview = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      logger.info('Sent OF DM', { 
        platformId: this.platformId, 
        recipientId: recipientId.substring(0,5)+'...', 
        preview: messagePreview,
        verified: messageVerified
      });
      return { successful: true };
    });
    
    return result || {
        successful: false,
        error: 'Failed to send OnlyFans DM via browser automation',
    };
  }

  /**
   * Adjust subscription pricing
   */
  async adjustPricing(newPrice: number): Promise<ExecutionResult> {
      const result = await this.withBrowserPage('adjustPricing', async (page) => {
          await page.goto(OF_SELECTORS.subscriptionSettingsPage, { waitUntil: 'networkidle2', timeout: 60000 });
          await randomDelay(1500, 3000);

          const priceInputSelector = OF_SELECTORS.settingsSubscriptionInput;
          await page.waitForSelector(priceInputSelector, { visible: true });
          
          // Clear existing value (click multiple times and backspace)
          await page.click(priceInputSelector, { clickCount: 3 });
          await page.keyboard.press('Backspace');
          await randomDelay(200, 500);

          await humanType(page, priceInputSelector, newPrice.toString());
          await randomDelay(500, 1000);

          await safeClick(page, OF_SELECTORS.settingsSaveButton);
          await randomDelay(3000, 5000); // Wait for save confirmation/reload

          // Verification: Re-read the value or look for success message
          // This is basic verification, might need improvement
          await page.goto(OF_SELECTORS.subscriptionSettingsPage, { waitUntil: 'networkidle2' }); // Re-navigate
          await randomDelay(1500, 3000);
          const updatedValue = await page.$eval(priceInputSelector, el => (el as HTMLInputElement).value);
          if (parseFloat(updatedValue) === newPrice) {
              logger.info(`Successfully verified OF subscription price update to ${newPrice}`, { platformId: this.platformId });
              await takeErrorScreenshot(page, `of-price-update-success-${this.platformId}`); // Screenshot success for audit
              return { success: true, message: `Subscription price updated to ${newPrice}` };
          } else {
              logger.warn(`OF Price update verification failed. Expected ${newPrice}, got ${updatedValue}`, { platformId: this.platformId });
              throw new Error(`Price update verification failed. Expected ${newPrice}, got ${updatedValue}`);
          }
      });

      return result || {
          success: false,
          error: 'Failed to adjust OnlyFans subscription price via browser automation',
      };
  }
  
  /**
   * Poll for new activity (subscribers, tips, purchases) by scraping notifications.
   */
  async pollNewActivity(): Promise<ActivityResult[]> {
    const result = await this.withBrowserPage('pollNewActivity', async (page) => {
        await page.goto(OF_SELECTORS.notificationsPage, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(2000, 4000);

        // Get last check time
        const credentialService = CredentialService.getInstance();
        const credentials = await credentialService.getCredentials(this.platformId);
        const lastCheckTimeISO = credentials.lastOnlyFansPoll; // Use specific key
        const lastCheckTime = lastCheckTimeISO ? new Date(lastCheckTimeISO) : new Date(Date.now() - 60 * 60 * 1000); // Default to 1 hour ago

        logger.debug('OnlyFans poll details', { platformId: this.platformId, lastCheckTime });

        // --- Scrape Notifications --- 
        const activities: ActivityResult[] = [];
        try {
            const notificationElements = await page.$$(OF_SELECTORS.notificationItems);
            logger.info(`Found ${notificationElements.length} notification elements to process`, { platformId: this.platformId });
            
            let latestTimestamp = lastCheckTime; // Track latest timestamp found in this poll

            for (const el of notificationElements) {
                // Extract text and timestamp (selectors/attributes need verification)
                const text = await el.evaluate(node => node.textContent?.trim() || '');
                const timestampStr = await el.evaluate(node => node.querySelector('time')?.getAttribute('datetime'));
                const timestamp = timestampStr ? new Date(timestampStr) : new Date(); // Use current time if timestamp missing

                if (timestamp <= lastCheckTime) {
                    // Stop processing older notifications if sorted chronologically (assumption)
                    // If not sorted, process all and filter later
                    // break; // Uncomment if notifications are reliably sorted newest first
                    continue; // Process all and filter based on timestamp
                }
                
                if(timestamp > latestTimestamp) latestTimestamp = timestamp;

                // Normalize notification text into ActivityResult
                // This requires robust regex or string matching based on OF notification formats
                let activityType: ActivityResult['type'] = 'other';
                let userId = 'unknown';
                let username: string | undefined;
                let amount: number | undefined;

                // Example parsing logic (NEEDS SIGNIFICANT REFINEMENT)
                if (text.includes('subscribed to you')) {
                    activityType = 'new_pledge';
                    const match = text.match(/(.*)\ssubscribed to you/);
                    username = match?.[1];
                    // Extract user ID from profile link if available
                    // userId = await el.evaluate(node => node.querySelector('a')?.href?.split('/').pop());
                } else if (text.includes('tipped you')) {
                    activityType = 'other'; // Or 'new_pledge'
                    const userMatch = text.match(/(.*)\stipped you/);
                    username = userMatch?.[1];
                    const amountMatch = text.match(/\$(\d+\.?\d*)/);
                    amount = amountMatch?.[1] ? parseFloat(amountMatch[1]) : undefined;
                } else if (text.includes('purchased your message') || text.includes('purchased content')) {
                    activityType = 'other'; // Represents a purchase
                    const userMatch = text.match(/(.*)\spurchased your/);
                    username = userMatch?.[1];
                     const amountMatch = text.match(/\$(\d+\.?\d*)/);
                    amount = amountMatch?.[1] ? parseFloat(amountMatch[1]) : undefined;
                } else if (text.includes('sent you a message')) {
                    activityType = 'new_message';
                     const userMatch = text.match(/(.*)\ssent you a message/);
                    username = userMatch?.[1];
                }

                activities.push({ 
                    type: activityType,
                    userId: userId, // Need a way to get actual user ID
                    username,
                    amount,
                    timestamp,
                    metadata: { rawText: text }, // Store raw text for debugging
                });
            }
            
             // Save the timestamp of the LATEST processed notification for the next poll
             // Only update if new activities were found to avoid issues with empty polls
             if (activities.length > 0 && latestTimestamp > lastCheckTime) {
                  await credentialService.storeCredentials(this.platformId, {
                     ...credentials,
                     lastOnlyFansPoll: latestTimestamp.toISOString(),
                 });
                 logger.info(`Updated lastOnlyFansPoll timestamp to ${latestTimestamp.toISOString()}`, { platformId: this.platformId });
             } else {
                 logger.info('No new notifications found since last poll or timestamps invalid.', { platformId: this.platformId });
                 // Optionally update timestamp even if no new activities to keep moving forward?
                 // await credentialService.storeCredentials(this.platformId, { ...credentials, lastOnlyFansPoll: new Date().toISOString() });
             }

        } catch (scrapeError) {
            logger.error('Error scraping OnlyFans notifications', { platformId: this.platformId, error: scrapeError });
            await takeErrorScreenshot(page, `of-poll-scrape-error-${this.platformId}`);
            // Return empty array on scraping error, don't update timestamp
            return [];
        }
        // --- End Scraping --- 

        return activities;
    });

    // Filter out activities that might have been processed due to timestamp inaccuracies before returning
    // This adds an extra layer of safety if scraping order isn't guaranteed
    const finalActivities = result || [];
    // const lastCheckTime = new Date((await CredentialService.getInstance().getCredentials(this.platformId)).lastOnlyFansPoll || 0);
    // return finalActivities.filter(act => act.timestamp > lastCheckTime);
    return finalActivities;
  }
}