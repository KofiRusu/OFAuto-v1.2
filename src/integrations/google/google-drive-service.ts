import { google, drive_v3 } from 'googleapis';
import { getValidGoogleAccessToken } from './google-auth';
import { logger } from '@/lib/logger';
import { Readable } from 'stream';

// Allowed MIME types for media files
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime', // .mov
    'video/webm',
];

// Helper function to get authenticated Drive API client
const getDriveClient = async (platformId: string): Promise<drive_v3.Drive | null> => {
    const accessToken = await getValidGoogleAccessToken(platformId);
    if (!accessToken) {
        logger.error('Failed to get valid Google access token for Drive service', { platformId });
        return null;
    }
    // Create an OAuth2 client with the access token
    // Note: We don't need client ID/secret here if we have a valid token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    return google.drive({ version: 'v3', auth: oauth2Client });
};

export interface DriveFileMetadata {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    thumbnailLink?: string;
    webContentLink?: string; // Link for browser download (requires different scope?)
    webViewLink?: string; // Link to view in Google Drive
    size?: string;
}

/**
 * Lists files within a specific Google Drive folder, filtering for allowed media types.
 */
export const listFilesInFolder = async (
    platformId: string,
    folderId: string,
    pageToken?: string
): Promise<{ files: DriveFileMetadata[]; nextPageToken?: string } | null> => {
    const drive = await getDriveClient(platformId);
    if (!drive) return null;

    try {
        logger.info('Listing files in Google Drive folder', { platformId, folderId });
        const response = await drive.files.list({
            q: `'${folderId}' in parents and (${ALLOWED_MIME_TYPES.map(type => `mimeType='${type}'`).join(' or ')}) and trashed = false`,
            fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, thumbnailLink, webContentLink, webViewLink, size)',
            spaces: 'drive',
            pageSize: 100, // Adjust page size as needed
            pageToken: pageToken,
        });

        const files = (response.data.files || []).map(file => ({
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            modifiedTime: file.modifiedTime!,
            thumbnailLink: file.thumbnailLink,
            webContentLink: file.webContentLink,
            webViewLink: file.webViewLink,
            size: file.size,
        }));

        logger.info(`Found ${files.length} media files in folder`, { platformId, folderId });
        return {
            files,
            nextPageToken: response.data.nextPageToken || undefined,
        };

    } catch (error: any) {
        logger.error('Error listing files in Google Drive folder', { error: error.message, platformId, folderId });
        return null;
    }
};

/**
 * Downloads a file from Google Drive as a Buffer.
 */
export const downloadFileAsBuffer = async (
    platformId: string,
    fileId: string
): Promise<Buffer | null> => {
    const drive = await getDriveClient(platformId);
    if (!drive) return null;

    try {
        logger.info('Downloading file from Google Drive', { platformId, fileId });
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'arraybuffer' } // Request response as ArrayBuffer
        );
        
        // Axios response data for arraybuffer is directly the buffer
        const buffer = Buffer.from(response.data as ArrayBuffer);
        logger.info(`Successfully downloaded file ${fileId} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`, { platformId });
        return buffer;

    } catch (error: any) {
        logger.error('Error downloading file from Google Drive', { error: error.message, platformId, fileId });
        return null;
    }
};

/**
 * Gets metadata for a specific file.
 */
export const getFileMetadata = async (
    platformId: string,
    fileId: string
): Promise<DriveFileMetadata | null> => {
     const drive = await getDriveClient(platformId);
    if (!drive) return null;

    try {
        logger.debug('Getting file metadata from Google Drive', { platformId, fileId });
        const response = await drive.files.get({
             fileId: fileId,
             fields: 'id, name, mimeType, modifiedTime, thumbnailLink, webContentLink, webViewLink, size',
        });

        const file = response.data;
        if (!file || !file.id || !file.name || !file.mimeType || !file.modifiedTime) {
            throw new Error('Incomplete metadata received from Google Drive API');
        }

        return {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            thumbnailLink: file.thumbnailLink,
            webContentLink: file.webContentLink,
            webViewLink: file.webViewLink,
            size: file.size,
        };
    } catch (error: any) {
         logger.error('Error getting file metadata from Google Drive', { error: error.message, platformId, fileId });
        return null;
    }
}

// Potential future function: Download as Stream
/*
export const downloadFileAsStream = async (
    platformId: string,
    fileId: string
): Promise<Readable | null> => {
    const drive = await getDriveClient(platformId);
    if (!drive) return null;

    try {
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return response.data as Readable;
    } catch (error: any) {
        logger.error('Error downloading file stream from Google Drive', { error: error.message, platformId, fileId });
        return null;
    }
};
*/ 