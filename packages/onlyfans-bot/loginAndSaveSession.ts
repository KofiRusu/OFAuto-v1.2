/**
 * OnlyFans Login and Session Saver
 * 
 * This script launches a browser for manual login to OnlyFans.
 * After login, it captures and saves cookies and other session data.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { OnlyFansSession, saveSession } from './utils/session';
import path from 'path';

// Apply stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Login selector targets for OnlyFans
 * Note: These may change if OnlyFans updates their UI
 */
const SELECTORS = {
  // Login confirmation indicators
  AVATAR: '.b-header__user',
  AVATAR_ALT: 'div[data-v-7a7aefb2].g-avatar__container',
  USER_NAME: '.g-user-name',
  FEED: '.g-page__feed',
  
  // Common nav elements
  NAV_MENU: '.g-page__header .g-menu',
};

/**
 * Main function to login and save session
 */
async function loginAndSaveSession(accountId?: string) {
  console.log('🚀 Launching browser for OnlyFans login...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null, // Use default viewport for better visibility
    args: [
      '--start-maximized', // Start with a maximized window
      '--disable-notifications', // Disable notifications
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console log capture from the browser
    page.on('console', (msg) => console.log('Browser console:', msg.text()));
    
    // Get current user agent and set it (for later reuse)
    const userAgent = await browser.userAgent();
    await page.setUserAgent(userAgent);
    
    // Navigate to OnlyFans login page
    console.log('🌐 Navigating to OnlyFans login page...');
    await page.goto('https://onlyfans.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('👤 Please log in manually in the browser window.');
    console.log('⏳ Waiting for login to complete...');
    
    // Wait for user to manually login
    // First, wait for navigation after login form submission
    await page.waitForNavigation({ 
      waitUntil: 'networkidle2',
      timeout: 300000 // 5 minutes timeout to allow manual login
    }).catch(() => console.log('Navigation timeout - continuing to check for login success...'));
    
    // Then wait for avatar or other UI elements that indicate successful login
    await Promise.race([
      page.waitForSelector(SELECTORS.AVATAR, { timeout: 120000 }),
      page.waitForSelector(SELECTORS.AVATAR_ALT, { timeout: 120000 }),
      page.waitForSelector(SELECTORS.USER_NAME, { timeout: 120000 }),
      page.waitForSelector(SELECTORS.FEED, { timeout: 120000 })
    ]);
    
    console.log('✅ Login detected! Capturing session data...');
    
    // Take screenshot to confirm
    const screenshotPath = path.join(__dirname, 'login-success.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Login screenshot saved to: ${screenshotPath}`);
    
    // Extract cookies
    const cookies = await page.cookies();
    
    // Extract localStorage
    const localStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
    
    // Save session data
    const sessionData: OnlyFansSession = {
      cookies,
      localStorage,
      userAgent,
      timestamp: Date.now(),
      accountId
    };
    
    await saveSession(sessionData, accountId);
    
    console.log('🎉 Session capture complete. You can close the browser.');
    console.log('The session will be used for automated tasks.');
  } catch (error) {
    console.error('❌ Error during login session capture:', error);
    // Take error screenshot
    try {
      const errorPage = (await browser.pages())[0];
      await errorPage.screenshot({ path: path.join(__dirname, 'login-error.png') });
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError);
    }
  } finally {
    // Keep browser open for manual inspection
    // User can close it when ready
    console.log('Press Ctrl+C to exit when finished.');
  }
}

// CLI entry point
if (require.main === module) {
  const accountId = process.argv[2]; // Optional account ID as first argument
  loginAndSaveSession(accountId)
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default loginAndSaveSession; 