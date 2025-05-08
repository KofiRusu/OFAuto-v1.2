import { google } from 'googleapis';
import { DriveCredential } from '@prisma/client';
import { env } from '@/env.mjs';
import { logger } from '@/lib/telemetry/logger';

// Configure Google OAuth
const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// Scope for Drive API access
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

/**
 * Google Drive Service
 * Handles authentication and file operations with Google Drive API
 */
export class DriveService {
  /**
   * Generate Google OAuth URL for authorization
   */
  getAuthUrl(): string {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force to get refresh_token
    });
  }

  /**
   * Exchange OAuth code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date) {
        throw new Error('Invalid tokens received from Google');
      }
      
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      };
    } catch (error) {
      logger.error('Error exchanging code for tokens', { error });
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(credential: DriveCredential) {
    try {
      oauth2Client.setCredentials({
        refresh_token: credential.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error('Invalid tokens received while refreshing');
      }
      
      return {
        accessToken: credentials.access_token,
        expiresAt: new Date(credentials.expiry_date),
      };
    } catch (error) {
      logger.error('Error refreshing tokens', { error, userId: credential.userId });
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Configure OAuth client with user credentials
   */
  private setupAuth(credential: DriveCredential) {
    oauth2Client.setCredentials({
      access_token: credential.accessToken,
      refresh_token: credential.refreshToken,
    });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  /**
   * List files from Google Drive
   */
  async listFiles(credential: DriveCredential, folderId?: string) {
    try {
      const drive = this.setupAuth(credential);
      
      const queryParams: any = {
        pageSize: 50,
        fields: 'files(id, name, mimeType, modifiedTime, iconLink, webViewLink, thumbnailLink, size)',
        orderBy: 'modifiedTime desc',
      };
      
      // If folder ID is provided, list only files in that folder
      if (folderId) {
        queryParams.q = `'${folderId}' in parents`;
      }
      
      const response = await drive.files.list(queryParams);
      return response.data.files || [];
    } catch (error) {
      logger.error('Error listing files from Drive', { error, userId: credential.userId });
      throw new Error('Failed to list files from Google Drive');
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(credential: DriveCredential, file: Buffer, name: string, mimeType?: string, folderId?: string) {
    try {
      const drive = this.setupAuth(credential);
      
      const fileMetadata: any = {
        name,
      };
      
      // If folder ID is provided, upload to that folder
      if (folderId) {
        fileMetadata.parents = [folderId];
      }
      
      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: file,
      };
      
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, mimeType, modifiedTime, iconLink, webViewLink, thumbnailLink, size',
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error uploading file to Drive', { error, userId: credential.userId });
      throw new Error('Failed to upload file to Google Drive');
    }
  }
}

// Export singleton instance
export const driveService = new DriveService(); 