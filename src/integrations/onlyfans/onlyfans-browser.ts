// TODO: Deprecated — see packages/onlyfans-bot for updated logic. Safe to remove after migration.
// This file contains duplicate functionality that has been moved to the packages/onlyfans-bot directory.

import puppeteer, { Browser, Page } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { CredentialService } from '@/lib/execution-agent/credential-service';
import { proxyService, ProxyConfig } from '@/lib/proxy/proxy-service';
import { logger } from '@/lib/logger';

// Apply stealth plugin
puppeteer.use(StealthPlugin());

interface SessionData {
  cookies: any[];
  userAgent: string;
}

// Cache browser instances to reuse them
const browserCache: Record<string, Browser> = {};

/**
 * Launch or reuse a Puppeteer browser instance for a specific OnlyFans account.
 * Configures the browser with session cookies and proxy settings.
 */
export const launchOnlyFansSession = async (
  accountId: string
): Promise<{ page: Page; browser: Browser } | null> => {
  try {
    logger.info('Launching OnlyFans session', { accountId });

    // Retrieve session cookies from CredentialService
    const sessionJson = await CredentialService.getCredential(accountId, 'onlyfansSessionCookies');
    if (!sessionJson) {
      logger.error('No OnlyFans session cookies found for account', { accountId });
      throw new Error('Missing OnlyFans session cookies');
    }

    let sessionData: SessionData;
    try {
      sessionData = JSON.parse(sessionJson);
      if (!sessionData.cookies || !sessionData.userAgent) {
        throw new Error('Invalid session cookie format');
      }
    } catch (error) {
      logger.error('Failed to parse OnlyFans session cookies', { accountId, error });
      throw new Error('Invalid session cookie format');
    }

    // Get proxy configuration if enabled
    const proxy = proxyService.getNextProxy(); 
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--user-agent="' + sessionData.userAgent + '"'
    ];

    if (proxy) {
      const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      launchArgs.push(`--proxy-server=${proxyUrl}`);
      logger.info('Using proxy for OnlyFans session', { accountId, proxyHost: proxy.host });
    }
    
    // Reuse browser instance if available
    let browser = browserCache[accountId];
    if (!browser || !browser.isConnected()) {
      logger.info('Creating new browser instance for OnlyFans', { accountId });
      browser = await puppeteer.launch({
        headless: true,
        args: launchArgs,
        ignoreHTTPSErrors: true,
      });
      browserCache[accountId] = browser;

      browser.on('disconnected', () => {
        logger.warn('Browser disconnected for OnlyFans session', { accountId });
        delete browserCache[accountId];
      });
    }

    const page = await browser.newPage();
    await page.setUserAgent(sessionData.userAgent);
    await page.setCookie(...sessionData.cookies);
    
    // Set default navigation timeout
    page.setDefaultNavigationTimeout(60000); // 60 seconds

    logger.info('OnlyFans session page created successfully', { accountId });
    return { page, browser };

  } catch (error) {
    logger.error('Failed to launch OnlyFans session', { error, accountId });
    // Clean up potentially broken browser instance
    if (browserCache[accountId]) {
      await browserCache[accountId].close().catch(err => logger.error('Error closing cached browser', { err }));
      delete browserCache[accountId];
    }
    return null;
  }
};

/**
 * Close the browser instance associated with an accountId.
 */
export const closeOnlyFansSession = async (accountId: string): Promise<void> => {
  const browser = browserCache[accountId];
  if (browser) {
    logger.info('Closing OnlyFans browser session', { accountId });
    await browser.close();
    delete browserCache[accountId];
  }
};

/**
 * Close all active browser sessions.
 */
export const closeAllSessions = async (): Promise<void> => {
  logger.info('Closing all active OnlyFans browser sessions');
  for (const accountId in browserCache) {
    await closeOnlyFansSession(accountId);
  }
}; 