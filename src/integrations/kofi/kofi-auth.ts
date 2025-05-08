import { AuthResult } from '../BasePlatformIntegration';
import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import { createKofiApiClient, logApiError } from './kofi-utils';
import { logger } from '@/lib/logger';

/**
 * Store the Ko-fi API key securely in the credential service
 * @param platformId The platform ID to store the key for
 * @param apiKey The Ko-fi API key
 * @returns AuthResult indicating success or failure
 */
export async function storeApiKey(
  platformId: string,
  apiKey: string
): Promise<AuthResult> {
  try {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Store the API key securely
    const credentialService = CredentialService.getInstance();
    await credentialService.storeCredentials(platformId, {
      apiKey,
    });

    logger.info('Stored Ko-fi API key', { platformId });
    return {
      accessToken: apiKey, // For Ko-fi, the API key is the access token
      successful: true,
    };
  } catch (error) {
    logger.error('Error storing Ko-fi API key', { error, platformId });
    return {
      accessToken: '',
      successful: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the stored Ko-fi API key
 * @param platformId The platform ID to get the key for
 * @returns The API key or null if not found
 */
export async function getApiKey(platformId: string): Promise<string | null> {
  try {
    const credentialService = CredentialService.getInstance();
    const credentials = await credentialService.getCredentials(platformId);
    
    return credentials.apiKey || null;
  } catch (error) {
    logger.error('Error getting Ko-fi API key', { error, platformId });
    return null;
  }
}

/**
 * Validate that a Ko-fi API key exists and is likely valid by making a test call.
 * @param platformId The platform ID to check
 * @returns True if API key exists and validation passes, false otherwise
 */
export async function hasValidApiKey(platformId: string): Promise<boolean> {
  const apiKey = await getApiKey(platformId);
  if (!apiKey) {
    return false;
  }
  // Optionally, add a validation check by calling a simple Ko-fi endpoint
  try {
    const client = createKofiApiClient(apiKey); // Get client with API key
    await client.get('/user'); // Example: fetch user data to validate key
    return true;
  } catch (error) {
    logApiError(error); // Log the validation error
    logger.warn('Ko-fi API key validation failed', { platformId });
    return false;
  }
}

/**
 * Authenticates using the stored API key. Ko-fi doesn't use OAuth.
 * The `code` parameter is the API key itself.
 */
export async function authenticateWithApiKey(apiKey: string, platformId: string): Promise<AuthResult> {
  try {
      // Validate the key first
      const client = createKofiApiClient(apiKey);
      await client.get('/user'); // Test endpoint
      
      // If validation passes, store the key
      return await storeApiKey(platformId, apiKey);
  } catch (error) {
      logger.error('Ko-fi API key validation failed during authentication', { error, platformId });
      return {
          accessToken: '',
          successful: false,
          error: 'Invalid Ko-fi API key',
      };
  }
}

/**
 * Unlike OAuth, Ko-fi uses a static API key that doesn't expire,
 * so there's no need for refreshing tokens
 */ 