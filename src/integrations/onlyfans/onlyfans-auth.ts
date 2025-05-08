import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import { launchOnlyFansSession } from './onlyfans-browser';
import { elementExists, SELECTORS, randomDelay, takeErrorScreenshot } from './onlyfans-utils';
import { logger } from '@/lib/logger';
import { AuthResult } from '../BasePlatformIntegration';

interface OnlyFansSessionCookies {
  cookies: any[];
  userAgent: string;
}

/**
 * Stores OnlyFans session cookies securely.
 */
export const storeSessionCookies = async (
  platformId: string,
  cookiesJson: string // Expect JSON string or path to file
): Promise<void> => {
  try {
    let cookies: any[];
    let userAgent: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'; // Default UA

    // Basic check if it's a JSON string vs file path (improve as needed)
    if (cookiesJson.trim().startsWith('[')) {
        cookies = JSON.parse(cookiesJson);
        // Try to find User-Agent from cookies if available (less common)
        const uaCookie = cookies.find(c => c.name === 'ua');
        if (uaCookie) userAgent = uaCookie.value;
    } else {
        // Assume it's a file path - basic implementation
        // In production, use secure file handling
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync(cookiesJson, 'utf-8'));
        if (!data.cookies) throw new Error('Cookie file missing "cookies" array');
        cookies = data.cookies;
        userAgent = data.userAgent || userAgent; // Use UA from file if present
    }

    if (!cookies || cookies.length === 0) {
      throw new Error('Valid cookies array is required');
    }
    const sessionData: OnlyFansSessionCookies = { cookies, userAgent };
    await CredentialService.getInstance().storeCredentials(platformId, {
        onlyfansSessionCookies: JSON.stringify(sessionData),
    });
    logger.info('Stored OnlyFans session cookies', { platformId });
  } catch (error) {
    logger.error('Failed to store OnlyFans session cookies', { error, platformId });
    throw new Error('Failed to store/parse OnlyFans session cookies');
  }
};

/**
 * Retrieves OnlyFans session cookies.
 */
export const getSessionCookies = async (
  platformId: string
): Promise<OnlyFansSessionCookies | null> => {
  try {
    const credentials = await CredentialService.getInstance().getCredentials(platformId);
    const sessionJson = credentials.onlyfansSessionCookies;
    if (!sessionJson) return null;
    return JSON.parse(sessionJson);
  } catch (error) {
    logger.error('Failed to retrieve OnlyFans session cookies', { error, platformId });
    return null;
  }
};

/**
 * Checks if valid session cookies exist for the platform.
 */
export const hasValidSessionCookies = async (platformId: string): Promise<boolean> => {
  const cookies = await getSessionCookies(platformId);
  return !!cookies && Array.isArray(cookies.cookies) && cookies.cookies.length > 0 && !!cookies.userAgent;
};

/**
 * Authenticates by verifying the stored session cookies are still valid.
 * Navigates to the settings page and checks for a specific element.
 * The `code` parameter is the JSON string or file path for the cookies.
 */
export const authenticateWithCookies = async (
    platformId: string,
    cookiesJsonOrPath?: string // Optional: If provided, store first
): Promise<AuthResult> => {
  logger.info('Authenticating OnlyFans session using stored cookies', { platformId });
  
  if (cookiesJsonOrPath) {
      try {
          logger.info('Storing new OnlyFans cookies before authentication', { platformId });
          await storeSessionCookies(platformId, cookiesJsonOrPath);
      } catch(storeError) {
          logger.error('Failed to store provided OnlyFans cookies', { storeError, platformId });
          return { successful: false, error: 'Failed to store provided session cookies', accessToken: 'n/a' };
      }
  }

  try {
    if (!await hasValidSessionCookies(platformId)) {
      return {
        successful: false,
        error: 'Missing or invalid OnlyFans session cookies in storage',
        accessToken: 'n/a',
      };
    }

    const session = await launchOnlyFansSession(platformId);
    if (!session) {
      return {
        successful: false,
        error: 'Failed to launch browser session for validation',
        accessToken: 'n/a',
      };
    }

    const { page, browser } = session;
    let isAuthenticated = false;
    const validationUrl = 'https://onlyfans.com/my/settings/profile'; // Navigate to profile settings

    try {
      logger.debug(`Navigating to ${validationUrl} for session check`, { platformId });
      await page.goto(validationUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      await randomDelay(2000, 4000); // Wait for dynamic content

      // More reliable check: look for a specific element within the logged-in settings page
      // Example: Find the input field for the username or display name
      const profileNameInputSelector = 'input#username'; // Adjust selector based on actual OF structure
      isAuthenticated = await elementExists(page, profileNameInputSelector);
      
      if (!isAuthenticated) {
          logger.warn(`Authentication check failed: Element ${profileNameInputSelector} not found on settings page.`, { platformId });
          // Fallback check: Did we land on the login page?
          const onLoginPage = await elementExists(page, SELECTORS.loginUsername);
          if (onLoginPage) {
              logger.warn('Redirected to login page - OnlyFans session cookies are invalid or expired', { platformId });
              throw new Error('Session cookies invalid or expired - redirected to login');
          } else {
               logger.warn('Could not confirm logged-in state on settings page.', { platformId });
               await takeErrorScreenshot(page, `of-auth-check-failed-${platformId}`);
               // Consider throwing an error or returning false based on desired strictness
               throw new Error('Could not confirm logged-in state');
          }
      } else {
           logger.info(`Authentication check passed: Element ${profileNameInputSelector} found.`, { platformId });
      }

    } catch (validationError) {
      logger.error('Error validating OnlyFans session via settings page', { platformId, validationError });
      await takeErrorScreenshot(page, `of-auth-validation-error-${platformId}`);
      throw validationError; // Rethrow to be caught by outer try-catch
    } finally {
      await page.close();
      // Keep browser open for potential reuse by other operations
    }

    // Update Credential Service with last validation time? (Optional)
    // await CredentialService.getInstance().storeCredentials(platformId, { lastValidated: new Date().toISOString() });

    logger.info('OnlyFans session cookies validated successfully', { platformId });
    return {
      successful: true,
      accessToken: 'n/a', // Representing successful cookie auth
    };

  } catch (error) {
    logger.error('OnlyFans authentication with cookies failed', { error, platformId });
    return {
      successful: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      accessToken: 'n/a',
    };
  }
};

// Add a function to specifically test/validate cookies without storing
export const testSessionCookies = async (
    platformId: string,
    cookiesJsonOrPath: string
): Promise<{valid: boolean; error?: string}> => {
     logger.info('Testing OnlyFans session cookies without storing', { platformId });
     // Temporarily store (or just parse) to use launchOnlyFansSession logic
     // This is a simplified approach; ideally, launchOnlyFansSession could accept cookies directly
     const tempPlatformId = `test-${platformId}-${Date.now()}`; // Use a temporary ID
     try {
         await storeSessionCookies(tempPlatformId, cookiesJsonOrPath);
         const authResult = await authenticateWithCookies(tempPlatformId); // Authenticate using the temp store
         // Clean up temporary credentials
         await CredentialService.getInstance().deleteCredentials(tempPlatformId);
         return { valid: authResult.successful, error: authResult.error };
     } catch (error) {
         // Clean up temporary credentials on error
          await CredentialService.getInstance().deleteCredentials(tempPlatformId).catch(cleanupErr => logger.error('Failed to cleanup temp credentials', { cleanupErr }));
          logger.error('Error during temporary cookie test', { error, platformId });
         return { valid: false, error: error instanceof Error ? error.message : 'Failed to test cookies' };
     }
} 