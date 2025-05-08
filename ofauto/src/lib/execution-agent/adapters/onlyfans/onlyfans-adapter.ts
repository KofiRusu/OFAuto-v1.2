// TODO: Deprecated — see packages/onlyfans-bot for updated logic. Safe to remove after migration.
// This file should be refactored to use the implementation in packages/onlyfans-bot instead of duplicating code.

import { BasePlatformAdapter } from "../../base-adapter";
import {
  PlatformType,
  TaskPayload,
  ExecutionResult,
} from "../../types";
import puppeteer, { Browser, Page } from "puppeteer";

// Interfaces for OnlyFans-specific payloads
interface OnlyFansSession {
  browser: Browser;
  page: Page;
}

interface PriceChangePayload {
  newPrice: number;
  subscriptionType: "regular" | "promoOffer";
  discountPercentage?: number;
  discountDuration?: number;
}

interface DirectMessagePayload {
  recipientUsername: string;
  message: string;
  mediaUrls?: string[];
  isPPV?: boolean;
  price?: number;
}

export class OnlyFansAdapter extends BasePlatformAdapter {
  public readonly platformType: PlatformType = "ONLYFANS";
  private sessions: Map<string, OnlyFansSession> = new Map();
  private readonly ONLYFANS_BASE_URL = "https://onlyfans.com";
  private readonly DEFAULT_NAVIGATION_TIMEOUT = 30000;
  private readonly SELECTOR_WAIT_TIMEOUT = 10000;

  constructor() {
    super();
  }

  public getCredentialRequirements(): string[] {
    return ["onlyfansSessionCookies", "onlyfansProfileUrl", "onlyfansUsername", "onlyfansPassword", "userAgent"];
  }

  public async validateCredentials(credentials: Record<string, string>): Promise<boolean> {
    const requiredCredentials = this.getCredentialRequirements();
    for (const cred of requiredCredentials) {
      if (!credentials[cred]) {
        return false;
      }
    }

    try {
      // We'll do a lightweight validation by checking if the session cookies can be parsed
      const cookiesJson = credentials.onlyfansSessionCookies;
      JSON.parse(cookiesJson); // This will throw if invalid JSON
      return true;
    } catch (error) {
      console.error("OnlyFans credential validation error:", error);
      return false;
    }
  }

  public async initialize(config: any): Promise<boolean> {
    const result = await super.initialize(config);
    
    if (result) {
      // We don't immediately launch browsers, we'll do this on-demand to save resources
      console.log("OnlyFans adapter initialized successfully");
    }
    
    return result;
  }

  /**
   * Helper method to launch a browser session for OnlyFans
   */
  private async launchOnlyFansSession(platformId: string): Promise<OnlyFansSession | null> {
    try {
      // Check if we already have an active session
      if (this.sessions.has(platformId)) {
        const session = this.sessions.get(platformId)!;
        
        // Check if the session is still valid
        try {
          await session.page.evaluate(() => document.title);
          return session;
        } catch (error) {
          // Session is no longer valid, close it
          console.log("Closing invalid session and creating a new one");
          await this.closeSession(platformId);
        }
      }

      if (!this.config || !this.config.credentials) {
        throw new Error("Adapter not properly initialized with credentials");
      }

      // Launch a new browser instance
      const browser = await puppeteer.launch({
        headless: "new", // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ],
        defaultViewport: {
          width: 1280,
          height: 800
        }
      });

      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent(this.config.credentials.userAgent || 
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
      
      // Set navigation timeout
      page.setDefaultNavigationTimeout(this.DEFAULT_NAVIGATION_TIMEOUT);

      // Parse and set cookies from the stored session
      const cookiesJson = this.config.credentials.onlyfansSessionCookies;
      const cookies = JSON.parse(cookiesJson);
      await page.setCookie(...cookies);

      // Navigate to OnlyFans
      await page.goto(this.ONLYFANS_BASE_URL);

      // Check if we're logged in
      const isLoggedIn = await this.isLoggedIn(page);
      if (!isLoggedIn) {
        console.log("Session cookies are invalid, attempting login");
        const loginSuccess = await this.performLogin(page);
        if (!loginSuccess) {
          throw new Error("Failed to log in to OnlyFans with provided credentials");
        }
      }

      // Store the session
      const session = { browser, page };
      this.sessions.set(platformId, session);
      
      return session;
    } catch (error) {
      console.error("Error launching OnlyFans session:", error);
      return null;
    }
  }

  /**
   * Helper method to check if the page is logged in
   */
  private async isLoggedIn(page: Page): Promise<boolean> {
    try {
      // Check for elements that would indicate we're logged in
      const userMenuElement = await page.$('.g-user-name, .b-username');
      return !!userMenuElement;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper method to perform login if cookies are invalid
   */
  private async performLogin(page: Page): Promise<boolean> {
    try {
      if (!this.config || !this.config.credentials) {
        return false;
      }

      // Navigate to login page if not already there
      if (!page.url().includes('login')) {
        await page.goto(`${this.ONLYFANS_BASE_URL}/login`);
      }

      // Wait for login form
      await page.waitForSelector('input[name="email"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
      await page.waitForSelector('input[name="password"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });

      // Fill login form
      await page.type('input[name="email"]', this.config.credentials.onlyfansUsername);
      await page.type('input[name="password"]', this.config.credentials.onlyfansPassword);

      // Click login button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button[type="submit"]')
      ]);

      // Check if login was successful
      return await this.isLoggedIn(page);
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  }

  /**
   * Helper method to close a browser session
   */
  private async closeSession(platformId: string): Promise<void> {
    const session = this.sessions.get(platformId);
    if (session) {
      try {
        await session.browser.close();
      } catch (error) {
        console.error("Error closing browser session:", error);
      }
      this.sessions.delete(platformId);
    }
  }

  public async postContent(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("POST_CONTENT");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "POST_CONTENT", ["content"]);
    if (validationError) return validationError;

    let session: OnlyFansSession | null = null;

    try {
      // Launch a browser session
      session = await this.launchOnlyFansSession(task.platformId);
      if (!session) {
        return this.createErrorResult(
          "POST_CONTENT",
          "Failed to launch OnlyFans browser session"
        );
      }

      const { page } = session;

      // Navigate to the content creation page
      await page.goto(`${this.ONLYFANS_BASE_URL}/my/posts/new`);
      
      // Wait for the post creation form to load
      await page.waitForSelector('textarea[placeholder], div[role="textbox"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
      
      // Add caption/text
      const captionSelector = await page.$('textarea[placeholder], div[role="textbox"]');
      if (captionSelector) {
        await captionSelector.type(task.content);
      } else {
        throw new Error("Could not find caption input field");
      }

      // Handle media upload if provided
      if (task.mediaUrls && task.mediaUrls.length > 0) {
        // In a real implementation, we would:
        // 1. Look for file input and upload the media
        // 2. Wait for upload to complete
        
        // Placeholder for media upload (would use page.waitForSelector and file input in a real implementation)
        console.log(`Would upload media: ${task.mediaUrls.join(', ')}`);
      }

      // Set pricing if applicable
      if (task.pricingData && task.pricingData.newPrice) {
        // Click on the pricing option toggle
        const pricingToggle = await page.$('.b-post__price-toggle, input[type="checkbox"][name="isPaid"]');
        if (pricingToggle) {
          await pricingToggle.click();
          
          // Wait for price input field to appear
          await page.waitForSelector('input[name="price"], input[type="number"][placeholder*="price"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
          
          // Enter price
          const priceInput = await page.$('input[name="price"], input[type="number"][placeholder*="price"]');
          if (priceInput) {
            await priceInput.click({ clickCount: 3 }); // Select all existing text
            await priceInput.type(task.pricingData.newPrice.toString());
          }
        }
      }

      // Click post button
      const postButton = await page.$('button[type="submit"], button:contains("Post")');
      if (postButton) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          postButton.click()
        ]);
      } else {
        throw new Error("Could not find post button");
      }

      // Check for success indicators
      const successIndicator = await page.$('.g-toast--success, .toast-success, div:contains("successfully")');
      if (!successIndicator) {
        throw new Error("Post may not have been submitted successfully");
      }

      // Return success
      return this.createSuccessResult(
        "POST_CONTENT",
        undefined,
        {
          status: "posted",
          content: task.content,
          timestamp: new Date()
        }
      );
    } catch (error) {
      // Take screenshot of error for debugging
      if (session?.page) {
        try {
          await session.page.screenshot({ path: `onlyfans-error-${new Date().getTime()}.png` });
        } catch (screenshotError) {
          console.error("Failed to capture error screenshot:", screenshotError);
        }
      }

      return this.createErrorResult(
        "POST_CONTENT",
        error instanceof Error ? error.message : "Unknown error posting to OnlyFans"
      );
    } finally {
      // Close the session to save resources
      if (session) {
        await this.closeSession(task.platformId);
      }
    }
  }

  public async sendDM(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("SEND_DM");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "SEND_DM", ["content", "recipients"]);
    if (validationError) return validationError;

    let session: OnlyFansSession | null = null;

    try {
      // Launch a browser session
      session = await this.launchOnlyFansSession(task.platformId);
      if (!session) {
        return this.createErrorResult(
          "SEND_DM",
          "Failed to launch OnlyFans browser session"
        );
      }

      const { page } = session;

      // Navigate to messages
      await page.goto(`${this.ONLYFANS_BASE_URL}/my/chats`);
      
      // For each recipient, send the message
      const results = [];
      
      for (const recipient of task.recipients || []) {
        try {
          // Search for the recipient
          await page.waitForSelector('input[placeholder*="Search"], input[type="search"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
          const searchInput = await page.$('input[placeholder*="Search"], input[type="search"]');
          if (searchInput) {
            await searchInput.click({ clickCount: 3 }); // Select all text
            await searchInput.type(recipient);
            await page.waitForTimeout(1000); // Wait for search results
          }

          // Click on the first search result
          const searchResults = await page.$('.g-user-username:contains("' + recipient + '"), .username:contains("' + recipient + '")');
          if (searchResults) {
            await searchResults.click();
            await page.waitForTimeout(1000);
          } else {
            throw new Error(`Recipient "${recipient}" not found`);
          }

          // Wait for the message input field
          await page.waitForSelector('textarea[placeholder*="message"], div[role="textbox"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
          
          // Enter message text
          const messageInput = await page.$('textarea[placeholder*="message"], div[role="textbox"]');
          if (messageInput) {
            await messageInput.type(task.content);
          } else {
            throw new Error("Could not find message input field");
          }

          // Handle media attachment if provided
          if (task.mediaUrls && task.mediaUrls.length > 0) {
            // In a real implementation, we would:
            // 1. Look for file input and upload the media
            // 2. Wait for upload to complete
            
            // Placeholder for media upload
            console.log(`Would upload media to DM: ${task.mediaUrls.join(', ')}`);
          }

          // Handle PPV message if specified
          if (task.pricingData && task.pricingData.newPrice) {
            // Click on the PPV toggle
            const ppvToggle = await page.$('.b-chat__price-toggle, button:contains("Price")');
            if (ppvToggle) {
              await ppvToggle.click();
              
              // Wait for price input
              await page.waitForSelector('input[name="price"], input[type="number"][placeholder*="price"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
              
              // Enter price
              const priceInput = await page.$('input[name="price"], input[type="number"][placeholder*="price"]');
              if (priceInput) {
                await priceInput.click({ clickCount: 3 });
                await priceInput.type(task.pricingData.newPrice.toString());
              }
            }
          }

          // Click send button
          const sendButton = await page.$('button[type="submit"], button:contains("Send")');
          if (sendButton) {
            await sendButton.click();
            await page.waitForTimeout(1000);
          } else {
            throw new Error("Could not find send button");
          }

          // Check for message sent indicator
          const messageSent = await page.$('.g-chat-message--outgoing, .sent-message');
          if (!messageSent) {
            throw new Error("Message may not have been sent successfully");
          }

          results.push({
            recipient,
            status: "sent",
            timestamp: new Date()
          });
        } catch (error) {
          results.push({
            recipient,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      return this.createSuccessResult(
        "SEND_DM",
        undefined,
        {
          recipients: results,
          content: task.content,
          successCount: results.filter(r => r.status === "sent").length,
          failureCount: results.filter(r => r.status === "failed").length
        }
      );
    } catch (error) {
      // Take screenshot of error for debugging
      if (session?.page) {
        try {
          await session.page.screenshot({ path: `onlyfans-dm-error-${new Date().getTime()}.png` });
        } catch (screenshotError) {
          console.error("Failed to capture error screenshot:", screenshotError);
        }
      }

      return this.createErrorResult(
        "SEND_DM",
        error instanceof Error ? error.message : "Unknown error sending OnlyFans DM"
      );
    } finally {
      // Close the session to save resources
      if (session) {
        await this.closeSession(task.platformId);
      }
    }
  }

  public async adjustPricing(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("ADJUST_PRICING");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "ADJUST_PRICING", ["pricingData"]);
    if (validationError) return validationError;

    let session: OnlyFansSession | null = null;

    try {
      // Launch a browser session
      session = await this.launchOnlyFansSession(task.platformId);
      if (!session) {
        return this.createErrorResult(
          "ADJUST_PRICING",
          "Failed to launch OnlyFans browser session"
        );
      }

      const { page } = session;

      // Navigate to subscription settings
      await page.goto(`${this.ONLYFANS_BASE_URL}/my/settings/subscription`);
      
      // Wait for the pricing settings page to load
      await page.waitForSelector('input[name="subscriptionPrice"], input[placeholder*="price"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
      
      // Enter new subscription price
      if (task.pricingData?.newPrice) {
        const priceInput = await page.$('input[name="subscriptionPrice"], input[placeholder*="price"]');
        if (priceInput) {
          await priceInput.click({ clickCount: 3 }); // Select all text
          await priceInput.type(task.pricingData.newPrice.toString());
        } else {
          throw new Error("Could not find subscription price input field");
        }
      }

      // Handle promotional offers if specified
      if (task.pricingData?.subscriptionTiers) {
        // Toggle promotional offer switch if needed
        const promoToggle = await page.$('input[name="hasPromotion"], .b-switch');
        if (promoToggle) {
          const isChecked = await page.evaluate(el => el.checked, promoToggle);
          if (!isChecked) {
            await promoToggle.click();
            await page.waitForTimeout(500);
          }
        }

        // Fill in promotion details
        for (const tier of task.pricingData.subscriptionTiers) {
          // This would be a complex implementation in reality, simplifying for demo
          console.log(`Would set up subscription tier: ${tier.price} with benefits: ${tier.benefits.join(', ')}`);
        }
      }

      // Click save button
      const saveButton = await page.$('button[type="submit"], button:contains("Save")');
      if (saveButton) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          saveButton.click()
        ]);
      } else {
        throw new Error("Could not find save button");
      }

      // Check for success indicators
      const successIndicator = await page.$('.g-toast--success, .toast-success, div:contains("successfully")');
      if (!successIndicator) {
        throw new Error("Pricing changes may not have been saved successfully");
      }

      return this.createSuccessResult(
        "ADJUST_PRICING",
        undefined,
        {
          status: "updated",
          newPrice: task.pricingData?.newPrice,
          timestamp: new Date()
        }
      );
    } catch (error) {
      // Take screenshot of error for debugging
      if (session?.page) {
        try {
          await session.page.screenshot({ path: `onlyfans-pricing-error-${new Date().getTime()}.png` });
        } catch (screenshotError) {
          console.error("Failed to capture error screenshot:", screenshotError);
        }
      }

      return this.createErrorResult(
        "ADJUST_PRICING",
        error instanceof Error ? error.message : "Unknown error adjusting OnlyFans pricing"
      );
    } finally {
      // Close the session to save resources
      if (session) {
        await this.closeSession(task.platformId);
      }
    }
  }

  public async schedulePost(task: TaskPayload): Promise<ExecutionResult> {
    const initError = this.checkInitialized("SCHEDULE_POST");
    if (initError) return initError;

    const validationError = this.validateTaskPayload(task, "SCHEDULE_POST", ["content", "scheduledFor"]);
    if (validationError) return validationError;

    let session: OnlyFansSession | null = null;

    try {
      // Launch a browser session
      session = await this.launchOnlyFansSession(task.platformId);
      if (!session) {
        return this.createErrorResult(
          "SCHEDULE_POST",
          "Failed to launch OnlyFans browser session"
        );
      }

      const { page } = session;

      // Navigate to the content creation page
      await page.goto(`${this.ONLYFANS_BASE_URL}/my/posts/new`);
      
      // Follow similar steps as postContent, with scheduling options
      await page.waitForSelector('textarea[placeholder], div[role="textbox"]', { timeout: this.SELECTOR_WAIT_TIMEOUT });
      
      // Add caption/text
      const captionSelector = await page.$('textarea[placeholder], div[role="textbox"]');
      if (captionSelector) {
        await captionSelector.type(task.content);
      }

      // Handle media upload placeholder
      if (task.mediaUrls && task.mediaUrls.length > 0) {
        console.log(`Would upload media: ${task.mediaUrls.join(', ')}`);
      }

      // Click on schedule toggle
      const scheduleToggle = await page.$('.b-post__schedule-toggle, button:contains("Schedule")');
      if (scheduleToggle) {
        await scheduleToggle.click();
        await page.waitForTimeout(500);
      }

      // Set scheduled date and time
      if (task.scheduledFor) {
        const scheduledDate = new Date(task.scheduledFor);
        
        // Format date for input fields
        const formattedDate = scheduledDate.toISOString().split('T')[0];
        const formattedTime = scheduledDate.toTimeString().split(' ')[0].substring(0, 5);
        
        // Find and fill date input
        const dateInput = await page.$('input[type="date"]');
        if (dateInput) {
          await dateInput.click({ clickCount: 3 });
          await dateInput.type(formattedDate);
        }
        
        // Find and fill time input
        const timeInput = await page.$('input[type="time"]');
        if (timeInput) {
          await timeInput.click({ clickCount: 3 });
          await timeInput.type(formattedTime);
        }
      }

      // Click schedule button
      const scheduleButton = await page.$('button[type="submit"], button:contains("Schedule")');
      if (scheduleButton) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          scheduleButton.click()
        ]);
      }

      return this.createSuccessResult(
        "SCHEDULE_POST",
        undefined,
        {
          status: "scheduled",
          content: task.content,
          scheduledFor: task.scheduledFor,
          timestamp: new Date()
        }
      );
    } catch (error) {
      // Take screenshot of error for debugging
      if (session?.page) {
        try {
          await session.page.screenshot({ path: `onlyfans-schedule-error-${new Date().getTime()}.png` });
        } catch (screenshotError) {
          console.error("Failed to capture error screenshot:", screenshotError);
        }
      }

      return this.createErrorResult(
        "SCHEDULE_POST",
        error instanceof Error ? error.message : "Unknown error scheduling OnlyFans post"
      );
    } finally {
      // Close the session to save resources
      if (session) {
        await this.closeSession(task.platformId);
      }
    }
  }

  public async fetchMetrics(task: TaskPayload): Promise<ExecutionResult> {
    // OnlyFans doesn't have a direct metrics API, so we'll scrape the dashboard
    const initError = this.checkInitialized("FETCH_METRICS");
    if (initError) return initError;

    let session: OnlyFansSession | null = null;

    try {
      // Launch a browser session
      session = await this.launchOnlyFansSession(task.platformId);
      if (!session) {
        return this.createErrorResult(
          "FETCH_METRICS",
          "Failed to launch OnlyFans browser session"
        );
      }

      const { page } = session;

      // Navigate to the dashboard
      await page.goto(`${this.ONLYFANS_BASE_URL}/my/stats`);
      
      // Wait for stats to load
      await page.waitForSelector('.b-stats, .stats-container', { timeout: this.SELECTOR_WAIT_TIMEOUT });
      
      // Extract metrics (this would be customized based on actual page structure)
      const metrics = await page.evaluate(() => {
        // This is a placeholder; actual implementation would parse DOM elements
        const getValue = (selector: string) => {
          const el = document.querySelector(selector);
          return el ? parseInt(el.textContent?.replace(/[^0-9]/g, '') || '0', 10) : 0;
        };
        
        return {
          subscribers: getValue('.subscribers-count, [data-name="subscribers"] .value'),
          earnings: getValue('.earnings-count, [data-name="earnings"] .value'),
          messages: getValue('.messages-count, [data-name="messages"] .value'),
          likes: getValue('.likes-count, [data-name="likes"] .value'),
          tips: getValue('.tips-count, [data-name="tips"] .value')
        };
      });

      return this.createSuccessResult(
        "FETCH_METRICS",
        undefined,
        {
          ...metrics,
          timestamp: new Date()
        }
      );
    } catch (error) {
      // Take screenshot of error for debugging
      if (session?.page) {
        try {
          await session.page.screenshot({ path: `onlyfans-metrics-error-${new Date().getTime()}.png` });
        } catch (screenshotError) {
          console.error("Failed to capture error screenshot:", screenshotError);
        }
      }

      return this.createErrorResult(
        "FETCH_METRICS",
        error instanceof Error ? error.message : "Unknown error fetching OnlyFans metrics"
      );
    } finally {
      // Close the session to save resources
      if (session) {
        await this.closeSession(task.platformId);
      }
    }
  }

  // Clean up any active browser sessions when the adapter is no longer needed
  public async cleanup(): Promise<void> {
    for (const platformId of this.sessions.keys()) {
      await this.closeSession(platformId);
    }
  }
} 