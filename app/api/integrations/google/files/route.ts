import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/lib/logger';

// Mock file data
const mockFiles = [
  {
    id: 'file1',
    name: 'campaign-photos.zip',
    mimeType: 'application/zip',
    size: 1024000,
    createdTime: '2023-10-15T14:22:31Z',
    webViewLink: 'https://drive.google.com/file/d/file1/view'
  },
  {
    id: 'file2',
    name: 'subscriber-analysis.pdf',
    mimeType: 'application/pdf',
    size: 542000,
    createdTime: '2023-10-20T09:15:22Z',
    webViewLink: 'https://drive.google.com/file/d/file2/view'
  },
  {
    id: 'file3',
    name: 'marketing-images',
    mimeType: 'application/vnd.google-apps.folder',
    size: 0,
    createdTime: '2023-09-05T11:30:45Z',
    webViewLink: 'https://drive.google.com/drive/folders/file3'
  }
];

/**
 * API route to list files from the configured Google Drive folder.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId');
    const folderId = searchParams.get('folderId');
    
    if (!platformId) {
      return NextResponse.json(
        { success: false, error: 'Missing platformId parameter' },
        { status: 400 }
      );
    }
    
    logger.info('Fetching Google Drive files', { platformId, folderId });
    
    // In a real implementation, this would fetch files from Google Drive
    // for the specified account and folder
    
    // Add some artificial delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      files: mockFiles,
      nextPageToken: null // No pagination in this mock implementation
    });
  } catch (error) {
    logger.error('Error fetching Google Drive files', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 