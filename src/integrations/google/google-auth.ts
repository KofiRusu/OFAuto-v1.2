import { google } from 'googleapis';
import { AuthResult } from '../BasePlatformIntegration'; // Reuse AuthResult type
import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import { logger } from '@/lib/logger';

const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly', // Read-only access to Drive files
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
];

const getOAuthConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        logger.error('Google OAuth credentials not configured in environment variables');
        throw new Error('Google OAuth credentials not configured');
    }
    return {
        clientId,
        clientSecret,
        redirectUri,
    };
};

const getOAuth2Client = () => {
    const { clientId, clientSecret, redirectUri } = getOAuthConfig();
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Generates the Google OAuth2 authorization URL.
 */
export const generateGoogleAuthUrl = (platformId: string): string => {
    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: GOOGLE_SCOPES,
        prompt: 'consent', // Ensure refresh token is always sent
        state: JSON.stringify({ platformId }), // Pass platformId through state
    });
    logger.info('Generated Google Auth URL', { platformId });
    return authUrl;
};

/**
 * Exchanges an authorization code for Google access and refresh tokens.
 */
export const exchangeGoogleCodeForToken = async (code: string, platformId: string): Promise<AuthResult> => {
    const oauth2Client = getOAuth2Client();
    try {
        logger.info('Exchanging Google auth code for tokens', { platformId });
        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error('Failed to retrieve access or refresh token from Google');
        }

        const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

        // Store credentials securely
        const credentialService = CredentialService.getInstance();
        await credentialService.storeCredentials(platformId, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenScope: tokens.scope || GOOGLE_SCOPES.join(' '),
            googleTokenExpiresAt: expiresAt?.toISOString() || '',
        });

        logger.info('Successfully exchanged code and stored Google tokens', { platformId });
        return {
            accessToken: tokens.access_token, // Not strictly needed by caller, but follows pattern
            refreshToken: tokens.refresh_token,
            expiresAt,
            scope: tokens.scope?.split(' '),
            successful: true,
        };

    } catch (error: any) {
        logger.error('Error exchanging Google code for token', { error: error.message, platformId });
        return {
            accessToken: '',
            successful: false,
            error: `Google token exchange failed: ${error.message}`,
        };
    }
};

/**
 * Refreshes an expired Google access token using the refresh token.
 */
const refreshGoogleAccessToken = async (platformId: string, refreshToken: string): Promise<string | null> => {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    try {
        logger.info('Refreshing Google access token', { platformId });
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        if (!credentials.access_token) {
            throw new Error('Failed to refresh Google access token');
        }

        const expiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : undefined;

        // Store the updated credentials (new access token, same refresh token)
        const credentialService = CredentialService.getInstance();
        await credentialService.storeCredentials(platformId, {
            googleAccessToken: credentials.access_token,
            googleRefreshToken: refreshToken, // Refresh token usually persists
            googleTokenScope: credentials.scope || GOOGLE_SCOPES.join(' '),
            googleTokenExpiresAt: expiresAt?.toISOString() || '',
        });
        logger.info('Successfully refreshed and stored Google access token', { platformId });
        return credentials.access_token;

    } catch (error: any) {
        logger.error('Error refreshing Google access token', { error: error.message, platformId });
        // If refresh fails (e.g., revoked access), clear the tokens?
        // await CredentialService.getInstance().deleteCredentials(platformId); // Consider this
        return null;
    }
};

/**
 * Retrieves a valid Google access token, refreshing if necessary.
 */
export const getValidGoogleAccessToken = async (platformId: string): Promise<string | null> => {
    const credentialService = CredentialService.getInstance();
    try {
        const credentials = await credentialService.getCredentials(platformId);
        const accessToken = credentials.googleAccessToken;
        const refreshToken = credentials.googleRefreshToken;
        const expiresAtISO = credentials.googleTokenExpiresAt;

        if (!accessToken || !refreshToken) {
            logger.warn('Missing Google access or refresh token', { platformId });
            return null;
        }

        if (expiresAtISO) {
            const expiresAt = new Date(expiresAtISO);
            const now = new Date();
            // Refresh if expired or within 5 minutes of expiry
            if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
                logger.info('Google access token expired or nearing expiry, attempting refresh', { platformId });
                return await refreshGoogleAccessToken(platformId, refreshToken);
            }
        }
        // Token exists and is not expired
        return accessToken;

    } catch (error) {
        logger.error('Error getting valid Google access token', { error, platformId });
        return null;
    }
}; 