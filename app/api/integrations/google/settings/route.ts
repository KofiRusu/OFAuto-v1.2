import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';

/**
 * API route to save Google Drive integration settings (folder ID, enabled status).
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { platformId, folderId, isEnabled } = body;
        
        if (!platformId) {
            return NextResponse.json(
                { success: false, error: 'Missing platformId parameter' },
                { status: 400 }
            );
        }
        // folderId can be empty if disabling, isEnabled should be boolean
        if (typeof isEnabled !== 'boolean') {
            return NextResponse.json({ error: 'Missing or invalid isEnabled flag' }, { status: 400 });
        }
        if (isEnabled && !folderId) {
            return NextResponse.json({ error: 'folderId is required when enabling Google Drive sync' }, { status: 400 });
        }

        logger.info('Updating Google Drive settings', { 
            platformId, 
            folderId, 
            isEnabled 
        });
        
        // TODO: Add validation here to check if the folderId is valid and accessible
        // This might involve a quick call to drive.files.get(fileId: folderId)
        // For now, we assume the folderId provided by the user is correct.

        // Add some artificial delay to simulate database operation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully',
            settings: {
                platformId,
                folderId,
                isEnabled,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error updating Google Drive settings', { error });
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platformId = searchParams.get('platformId');
        
        if (!platformId) {
            return NextResponse.json(
                { success: false, error: 'Missing platformId parameter' },
                { status: 400 }
            );
        }
        
        logger.info('Fetching Google Drive settings', { platformId });
        
        // In a real implementation, this would fetch settings from a database
        
        // Return mock settings
        return NextResponse.json({
            success: true,
            settings: {
                platformId,
                folderId: 'mock-folder-id',
                isEnabled: true,
                updatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error fetching Google Drive settings', { error });
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
} 