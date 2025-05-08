// TODO: Deprecated — see packages/onlyfans-bot for updated logic. Safe to remove after migration.
// This file contains duplicate functionality that has been moved to the packages/onlyfans-bot directory.

import { Page } from 'puppeteer';
import { logger } from '@/lib/logger';
import path from 'path';

// Define common CSS selectors for OnlyFans elements
export const SELECTORS = {
  // Login page
  loginUsername: '#username',
  loginPassword: '#password',
  loginButton: 'button[type="submit"]',
  
  // Feed / Post creation
  newPostTextArea: 'textarea[placeholder*="compose new post"]",
  postSubmitButton: 'button:has-text("Post")',
  uploadMediaButton: 'button[aria-label="Add media"]',
  priceInput: 'input[placeholder="Set price"]',
  
  // Messages
  messageInput: 'textarea[placeholder*="Write a message"]',
  sendMessageButton: 'button[type="submit"]:has-text("Send")',
  searchUserInput: 'input[placeholder="Search users"]',
  
  // Stats & Earnings
  totalEarnings: '.b-stats__item--sales .b-stats__value',
  subscriberCount: '.b-stats__item--subscribers .b-stats__value',
  
  // Pricing
  subscriptionPriceInput: 'input[name="subscribePrice"]',
  savePricingButton: 'button:has-text("Save changes")',
};

/**
 * Introduce a random delay to mimic human behavior
 */
export const randomDelay = (minMs: number = 500, maxMs: number = 2000): Promise<void> => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Type text into an input field like a human
 */
export const humanType = async (page: Page, selector: string, text: string): Promise<void> => {
  await page.waitForSelector(selector, { visible: true });
  await page.focus(selector);
  await page.keyboard.type(text, { delay: Math.floor(Math.random() * 100) + 50 }); // 50-150ms delay
  await randomDelay(100, 300);
};

/**
 * Take a screenshot and save it for debugging purposes
 */
export const takeErrorScreenshot = async (page: Page, errorName: string): Promise<void> => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const screenshotPath = path.join(
      process.cwd(), 
      'error-screenshots', 
      `${errorName}-${timestamp}.png`
    );
    
    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    // Note: In a real environment, fs.mkdirSync might need proper error handling or async version
    require('fs').mkdirSync(dir, { recursive: true }); 
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logger.info(`Error screenshot saved to: ${screenshotPath}`);
  } catch (screenshotError) {
    logger.error('Failed to take error screenshot', { screenshotError });
  }
};

/**
 * Safely click an element, waiting for it to be ready
 */
export const safeClick = async (page: Page, selector: string): Promise<void> => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 15000 });
    await randomDelay(200, 500);
    await page.click(selector);
    await randomDelay(300, 700);
  } catch (error) {
    logger.error(`Failed to click selector: ${selector}`, { error });
    await takeErrorScreenshot(page, `click-error-${selector.replace(/[^a-zA-Z0-9]/g, '_')}`);
    throw new Error(`Failed to click element with selector: ${selector}`);
  }
};

/**
 * Check if an element exists on the page
 */
export const elementExists = async (page: Page, selector: string): Promise<boolean> => {
  try {
    return await page.$(selector) !== null;
  } catch (error) {
    logger.debug(`Error checking existence of selector: ${selector}`, { error });
    return false;
  }
}; 