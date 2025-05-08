/**
 * OnlyFans Session Management Utilities
 * Handles reading, writing, and validating session data
 */

import fs from 'fs/promises';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export interface OnlyFansSession {
  cookies: any[];
  localStorage: Record<string, string>;
  userAgent: string;
  timestamp: number; // When the session was saved
  accountId?: string; // Optional identifier for multi-account support
}

/**
 * Path to store session files, supporting multiple accounts
 * @param accountId Optional account identifier for multi-account support
 */
export function getSessionPath(accountId?: string): string {
  const fileName = accountId ? `session_${accountId}.json` : 'session.json';
  return path.join(__dirname, '..', fileName);
}

/**
 * Save OnlyFans session data to a file
 */
export async function saveSession(
  sessionData: OnlyFansSession,
  accountId?: string
): Promise<void> {
  try {
    const sessionPath = getSessionPath(accountId);
    
    // Add timestamp for expiration checks
    const dataToSave = {
      ...sessionData,
      timestamp: Date.now(),
      accountId
    };
    
    await fs.writeFile(sessionPath, JSON.stringify(dataToSave, null, 2));
    console.log(`✅ Session saved to ${sessionPath}`);
    return;
  } catch (error) {
    console.error('❌ Failed to save session:', error);
    throw new Error(`Failed to save OnlyFans session: ${error.message}`);
  }
}

/**
 * Load OnlyFans session data from a file
 */
export async function loadSession(accountId?: string): Promise<OnlyFansSession | null> {
  try {
    const sessionPath = getSessionPath(accountId);
    const data = await fs.readFile(sessionPath, 'utf-8');
    return JSON.parse(data) as OnlyFansSession;
  } catch (error) {
    console.error(`❌ Failed to load session: ${error.message}`);
    return null;
  }
}

/**
 * Check if a session file exists
 */
export async function sessionExists(accountId?: string): Promise<boolean> {
  try {
    const sessionPath = getSessionPath(accountId);
    await fs.access(sessionPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a session is expired (older than maxAgeDays)
 */
export function isSessionExpired(
  session: OnlyFansSession,
  maxAgeDays: number = 7
): boolean {
  if (!session.timestamp) return true;
  
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return now - session.timestamp > maxAgeMs;
}

/**
 * Initialize a browser with saved OnlyFans session
 */
export async function initSessionBrowser(
  accountId?: string,
  headless: boolean = true
): Promise<{ browser: Browser; page: Page } | null> {
  try {
    // Load saved session data
    const sessionData = await loadSession(accountId);
    if (!sessionData) {
      console.error('❌ No session data found. Please run loginAndSaveSession first.');
      return null;
    }
    
    if (isSessionExpired(sessionData)) {
      console.warn('⚠️ Session appears to be expired. You may need to log in again.');
    }
    
    const browser = await puppeteer.launch({ 
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--user-agent=${sessionData.userAgent}`
      ]
    });
    
    // Create new page and restore session
    const page = await browser.newPage();
    await page.setUserAgent(sessionData.userAgent);
    
    if (sessionData.cookies && sessionData.cookies.length > 0) {
      await page.setCookie(...sessionData.cookies);
    }
    
    // Set local storage from session data
    if (sessionData.localStorage) {
      await page.evaluateOnNewDocument((storageData) => {
        for (const [key, value] of Object.entries(storageData)) {
          localStorage.setItem(key, value);
        }
      }, sessionData.localStorage);
    }
    
    return { browser, page };
  } catch (error) {
    console.error('❌ Failed to initialize session browser:', error);
    return null;
  }
}

/**
 * Verify if the session is valid by checking login status
 */
export async function validateSession(
  accountId?: string
): Promise<boolean> {
  const session = await initSessionBrowser(accountId);
  if (!session) return false;

  const { browser, page } = session;
  
  try {
    // Navigate to OnlyFans and check if logged in
    await page.goto('https://onlyfans.com', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Check for selectors that indicate the user is logged in
    const isLoggedIn = await page.evaluate(() => {
      // Avatar, username dropdown, or feed elements that appear only for logged-in users
      return !!(
        document.querySelector('.b-header__user') ||
        document.querySelector('div[data-v-7a7aefb2].g-avatar__container') ||
        document.querySelector('.g-user-name') ||
        document.querySelector('.g-page__feed')
      );
    });
    
    return isLoggedIn;
  } catch (error) {
    console.error('❌ Error validating session:', error);
    return false;
  } finally {
    await browser.close();
  }
}

/**
 * Capture a screenshot for debugging purposes
 */
export async function captureDebugScreenshot(
  page: Page,
  fileName: string = 'debug-screenshot.png'
): Promise<string> {
  const screenshotPath = path.join(__dirname, '..', fileName);
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Debug screenshot saved to: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Simulate human-like typing with random delays
 */
export async function humanType(
  page: Page,
  selector: string,
  text: string,
  options = { delay: { min: 50, max: 150 } }
): Promise<void> {
  await page.focus(selector);
  
  for (const char of text) {
    const delay = Math.floor(
      Math.random() * (options.delay.max - options.delay.min) + options.delay.min
    );
    await page.keyboard.type(char, { delay });
  }
} 