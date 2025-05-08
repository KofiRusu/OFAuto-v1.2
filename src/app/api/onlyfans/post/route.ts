import { NextRequest, NextResponse } from 'next/server';
import { createPost, PostConfig } from '../../../../../packages/onlyfans-bot/onlyfansAutomation';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const postConfig: PostConfig = await req.json();
    
    // Handle file uploads if there's a base64 encoded file in the request
    if (postConfig.mediaBase64) {
      const { mediaBase64, mediaFileName, mediaType } = postConfig;
      
      // Remove these from the config as they're not part of the actual PostConfig
      delete postConfig.mediaBase64;
      delete postConfig.mediaFileName;
      delete postConfig.mediaType;
      
      // Create a temp directory for media files if it doesn't exist
      const tempDir = path.join(os.tmpdir(), 'ofauto-media');
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (err) {
        console.error('Error creating temp directory:', err);
      }
      
      // Save the base64 file to disk
      const base64Data = mediaBase64.replace(/^data:image\/\w+;base64,/, '');
      const mediaPath = path.join(tempDir, mediaFileName || `upload-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`);
      
      await fs.writeFile(mediaPath, Buffer.from(base64Data, 'base64'));
      
      // Update the config with the file path
      postConfig.mediaPath = mediaPath;
    }
    
    // Log the configuration (remove this in production)
    console.log('Creating post with config:', {
      ...postConfig,
      // Don't log the full media path for security
      mediaPath: postConfig.mediaPath ? `[File: ${path.basename(postConfig.mediaPath)}]` : undefined,
    });
    
    // Call the createPost function from the onlyfans-bot package
    const result = await createPost(postConfig);
    
    // Clean up the temporary file if it exists
    if (postConfig.mediaPath && postConfig.mediaPath.includes(os.tmpdir())) {
      try {
        await fs.unlink(postConfig.mediaPath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
    
    if (result.success) {
      return NextResponse.json({ success: true, ...result }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in OnlyFans post API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Handle file uploads with FormData
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 