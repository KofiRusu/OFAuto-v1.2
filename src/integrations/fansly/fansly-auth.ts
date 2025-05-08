import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import { createFanslyApiClient, isAuthError } from './fansly-utils';
import { logger } from '@/lib/logger';
import { AuthResult } from '../BasePlatformIntegration';

interface FanslyAuthTokens {
  sessionToken: string;
  xbc?: string; // Optional cookie token sometimes required
  userAgent?: string;
}

// Fansly API endpoints (Assuming v1, adjust if needed)
const API_BASE = '/api/v1'; // Use constant for base path
const AUTH_ENDPOINTS = {
  // LOGIN: `${API_BASE}/auth/login`, // Placeholder, use session token instead
  CHECK_SESSION: `${API_BASE}/account`,
};

/**
 * Store Fansly session token (and potentially related info) in credential service
 */
export const storeSessionToken = async (
  platformId: string,
  sessionToken: string,
  // Allow storing other relevant data like user agent if needed
  otherData: Omit<FanslyAuthTokens, 'sessionToken'> = {}
): Promise<void> => {
  try {
    const dataToStore: FanslyAuthTokens = {
      sessionToken,
      ...otherData,
    };
    await CredentialService.getInstance().storeCredentials(platformId, {
      fanslySession: JSON.stringify(dataToStore),
    });
    logger.info('Stored Fansly session token', { platformId });
  } catch (error) {
    logger.error('Failed to store Fansly session token', { error, platformId });
    throw new Error('Failed to store Fansly session token');
  }
};

/**
 * Retrieve Fansly session token details from credential service
 */
export const getSessionTokenDetails = async (
  platformId: string
): Promise<FanslyAuthTokens | null> => {
  try {
    const credentials = await CredentialService.getInstance().getCredentials(platformId);
    const sessionJson = credentials.fanslySession;
    if (!sessionJson) {
      return null;
    }
    
    return JSON.parse(sessionJson);
  } catch (error) {
    logger.error('Failed to retrieve Fansly session details', { error, platformId });
    return null;
  }
};

/**
 * Validate the stored Fansly session token by making a test request.
 */
export const hasValidSession = async (platformId: string): Promise<boolean> => {
  try {
    const tokens = await getSessionTokenDetails(platformId);
    if (!tokens || !tokens.sessionToken) {
      return false;
    }
    
    // Validate the token by making a test request
    const client = createFanslyApiClient(tokens.sessionToken);
    // Use the CHECK_SESSION endpoint
    const response = await client.get(AUTH_ENDPOINTS.CHECK_SESSION);
    
    return response.status === 200;
  } catch (error) {
    if (isAuthError(error)) {
        logger.warn('Fansly session token is invalid or expired', { platformId });
    } else {
        logger.debug('Fansly session validation failed (non-auth error)', { error });
    }
    return false;
  }
};

/**
 * Authenticates using a provided session token.
 * Validates the token and stores it if valid.
 */
export const authenticateWithSession = async (
  sessionToken: string,
  platformId: string
): Promise<AuthResult> => {
  try {
    if (!sessionToken) {
      return { successful: false, error: 'Session token is required', accessToken: '' };
    }
    
    // Validate the provided token by making a test request
    const client = createFanslyApiClient(sessionToken);
    await client.get(AUTH_ENDPOINTS.CHECK_SESSION); // Throws error if invalid
    
    // If validation passes, store the token
    await storeSessionToken(platformId, sessionToken);
    
    return {
      accessToken: sessionToken, // Return the validated token
      successful: true,
    };
  } catch (error) {
    logger.error('Fansly session token validation/authentication failed', { error, platformId });
    const errorMessage = isAuthError(error) ? 'Invalid or expired session token' : 'Failed to validate session token';
    return {
      successful: false,
      error: errorMessage,
      accessToken: '',
    };
  }
};

/**
 * Retrieve the currently valid session token, checking its validity.
 * Fansly sessions don't have standard refresh, rely on stored token validity.
 */
export const getValidSessionToken = async (
  platformId: string
): Promise<string | null> => {
  try {
    const tokens = await getSessionTokenDetails(platformId);
    if (!tokens || !tokens.sessionToken) {
        logger.debug('No stored Fansly session token found', { platformId });
      return null;
    }
    
    // Check if the stored token is still valid
    const client = createFanslyApiClient(tokens.sessionToken);
    await client.get(AUTH_ENDPOINTS.CHECK_SESSION); // This will throw if invalid
    
    // If the check passes, return the token
    return tokens.sessionToken;
    
  } catch (error) {
    if (isAuthError(error)) {
        logger.warn('Stored Fansly session token is invalid/expired.', { platformId });
    } else {
        logger.error('Error checking validity of Fansly session token', { error, platformId });
    }
    // If validation fails or any other error occurs, return null
    return null;
  }
}; 