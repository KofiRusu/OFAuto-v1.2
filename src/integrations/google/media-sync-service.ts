import { listFilesInFolder, downloadFileAsBuffer, DriveFileMetadata } from './google-drive-service';
import { CredentialService } from 'ofauto/src/lib/execution-agent/credential-service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma'; // Assuming Prisma is used for local storage
import path from 'path';
import fs from 'fs/promises';

// --- Configuration ---
const SYNC_INTERVAL_MINUTES = 60; // How often to sync
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'google-drive-media'); // Where to store downloaded files
// -------------------

interface SyncedMedia {
    googleDriveFileId: string;
    platformId: string;
    folderId: string;
    fileName: string;
    mimeType: string;
    localPath: string;
    googleModifiedTime: Date;
    syncedAt: Date;
}

/**
 * Service to periodically sync media files from configured Google Drive folders.
 */
export class MediaSyncService {
    private static instance: MediaSyncService;
    private syncIntervalId: NodeJS.Timeout | null = null;

    private constructor() {
        // Ensure local storage directory exists
        fs.mkdir(LOCAL_STORAGE_PATH, { recursive: true }).catch(err => 
            logger.error('Failed to create local storage dir for GDrive sync', { err, path: LOCAL_STORAGE_PATH })
        );
    }

    public static getInstance(): MediaSyncService {
        if (!MediaSyncService.instance) {
            MediaSyncService.instance = new MediaSyncService();
        }
        return MediaSyncService.instance;
    }

    /**
     * Starts the periodic syncing process.
     */
    public startSyncing() {
        if (this.syncIntervalId) {
            logger.warn('Media sync service already running');
            return;
        }
        logger.info(`Starting Google Drive media sync service. Interval: ${SYNC_INTERVAL_MINUTES} minutes.`);
        // Run immediately first, then set interval
        this.runSyncCycle(); 
        this.syncIntervalId = setInterval(() => this.runSyncCycle(), SYNC_INTERVAL_MINUTES * 60 * 1000);
    }

    /**
     * Stops the periodic syncing process.
     */
    public stopSyncing() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
            logger.info('Stopped Google Drive media sync service.');
        }
    }

    /**
     * Runs a single sync cycle for all configured Google Drive integrations.
     */
    private async runSyncCycle() {
        logger.info('Starting Google Drive sync cycle...');
        try {
            // 1. Get all platform configurations that have Google Drive enabled and a folder ID set
            //    (Requires fetching platform settings from DB - placeholder implementation)
            const platformsToSync = await this.getPlatformsToSync(); // Replace with actual DB query

            for (const platform of platformsToSync) {
                logger.info(`Syncing Google Drive for platform: ${platform.platformId}`, { folderId: platform.googleDriveFolderId });
                await this.syncPlatformFolder(platform.platformId, platform.googleDriveFolderId);
            }

            logger.info('Google Drive sync cycle finished.');
        } catch (error) {
            logger.error('Error during Google Drive sync cycle', { error });
        }
    }

    /**
     * Syncs a specific folder for a given platform.
     */
    private async syncPlatformFolder(platformId: string, folderId: string) {
        try {
            let nextPageToken: string | undefined = undefined;
            do {
                const result = await listFilesInFolder(platformId, folderId, nextPageToken);
                if (!result) {
                    logger.warn('Failed to list files for folder, skipping sync for now', { platformId, folderId });
                    break; // Stop pagination if listing fails
                }

                for (const file of result.files) {
                    await this.processDriveFile(platformId, folderId, file);
                }

                nextPageToken = result.nextPageToken;
            } while (nextPageToken);
        } catch (error) {
            logger.error('Error syncing platform folder', { error, platformId, folderId });
        }
    }

    /**
     * Processes a single file from Google Drive: checks if it needs download/update.
     */
    private async processDriveFile(platformId: string, folderId: string, file: DriveFileMetadata) {
        try {
            // Check local database (e.g., Prisma SyncedMedia model)
            const existingRecord = await prisma.syncedMedia.findUnique({
                where: { googleDriveFileId_platformId: { googleDriveFileId: file.id, platformId } },
            });

            const driveModifiedTime = new Date(file.modifiedTime);

            if (existingRecord && existingRecord.googleModifiedTime >= driveModifiedTime) {
                // File exists locally and hasn't been modified in Drive, skip.
                logger.debug(`File already synced and up-to-date: ${file.name}`, { platformId, fileId: file.id });
                return;
            }

            // Download needed (new file or updated file)
            logger.info(`Downloading ${existingRecord ? 'updated' : 'new'} file: ${file.name}`, { platformId, fileId: file.id });
            const fileBuffer = await downloadFileAsBuffer(platformId, file.id);
            if (!fileBuffer) {
                logger.error('Failed to download file buffer', { platformId, fileId: file.id, fileName: file.name });
                return; // Skip this file if download fails
            }

            // Save buffer to local storage
            // Use Drive ID to ensure unique filenames locally, handle potential name collisions
            const localFileName = `${file.id}-${file.name}`;
            const localPath = path.join(LOCAL_STORAGE_PATH, localFileName);
            await fs.writeFile(localPath, fileBuffer);
            logger.info(`Saved file locally: ${localPath}`, { platformId, fileId: file.id });

            // Update database record (upsert)
            await prisma.syncedMedia.upsert({
                where: { googleDriveFileId_platformId: { googleDriveFileId: file.id, platformId } },
                update: {
                    folderId,
                    fileName: file.name,
                    mimeType: file.mimeType,
                    localPath: localPath, // Store relative or absolute path based on need
                    googleModifiedTime: driveModifiedTime,
                    syncedAt: new Date(),
                },
                create: {
                    googleDriveFileId: file.id,
                    platformId,
                    folderId,
                    fileName: file.name,
                    mimeType: file.mimeType,
                    localPath: localPath,
                    googleModifiedTime: driveModifiedTime,
                    syncedAt: new Date(),
                },
            });

        } catch (error) {
            logger.error('Error processing Google Drive file', { error, platformId, fileId: file.id, fileName: file.name });
        }
    }

    /**
     * Placeholder function to get platform configurations needing sync.
     * Replace with actual database query based on your Platform/Settings model.
     */
    private async getPlatformsToSync(): Promise<{ platformId: string; googleDriveFolderId: string }[]> {
        // Example: Fetch platforms where googleDriveSyncEnabled is true and googleDriveFolderId is set
        // const platforms = await prisma.platformSettings.findMany({
        //     where: { googleDriveSyncEnabled: true, googleDriveFolderId: { not: null } },
        //     select: { platformId: true, googleDriveFolderId: true },
        // });
        // return platforms.map(p => ({ platformId: p.platformId, googleDriveFolderId: p.googleDriveFolderId! }));
        
        logger.warn('getPlatformsToSync needs implementation based on DB schema!');
        return []; // Return empty array until implemented
    }
}

// Optional: Initialize and start the service if needed globally
// const mediaSyncService = MediaSyncService.getInstance();
// mediaSyncService.startSyncing(); 