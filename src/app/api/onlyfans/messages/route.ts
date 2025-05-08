import { NextRequest, NextResponse } from 'next/server';
import { handleDMs, ChatConfig, ChatResult } from '../../../../../packages/onlyfans-bot/chatAutomation';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const { 
      message,
      recipients,
      responseDelay,
      price,
      mediaBase64,
      mediaFileName,
      mediaType,
      persona
    } = await req.json();
    
    // Process media if included
    let mediaPath: string | undefined = undefined;
    
    if (mediaBase64) {
      // Create a temp directory for media files if it doesn't exist
      const tempDir = path.join(os.tmpdir(), 'ofauto-dm-media');
      try {
        await fs.mkdir(tempDir, { recursive: true });
      } catch (err) {
        console.error('Error creating temp directory:', err);
      }
      
      // Save the base64 file to disk
      const base64Data = mediaBase64.replace(/^data:image\/\w+;base64,/, '');
      mediaPath = path.join(tempDir, mediaFileName || `upload-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`);
      
      await fs.writeFile(mediaPath, Buffer.from(base64Data, 'base64'));
    }
    
    // If we have a list of recipients, we need to handle each individually
    const results: Array<ChatResult & { recipientId?: string }> = [];
    
    if (recipients && recipients.length > 0) {
      for (const recipientId of recipients) {
        // Configure the chat parameters for this recipient
        const chatConfig: ChatConfig = {
          recipientId,
          message,
          ...(mediaPath && { mediaPath }),
          ...(responseDelay && { responseDelay }),
          ...(price && { price: Number(price) }),
          ...(persona && { persona })
        };
        
        try {
          // Handle the DM
          const result = await handleDMs(chatConfig);
          results.push({ ...result, recipientId });
        } catch (error) {
          console.error(`Error sending message to recipient ${recipientId}:`, error);
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            messagesRead: 0,
            messagesReplied: 0,
            usersProcessed: 0,
            recipientId 
          });
        }
      }
    } else {
      // Just handle generic DMs without specific recipients
      const chatConfig: ChatConfig = {
        message,
        ...(mediaPath && { mediaPath }),
        ...(responseDelay && { responseDelay }),
        ...(price && { price: Number(price) }),
        ...(persona && { persona })
      };
      
      const result = await handleDMs(chatConfig);
      results.push(result);
    }
    
    // Clean up the temporary file if it exists
    if (mediaPath && mediaPath.includes(os.tmpdir())) {
      try {
        await fs.unlink(mediaPath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
    
    // Calculate summary statistics
    const allSucceeded = results.every(r => r.success);
    const totalMessagesRead = results.reduce((sum, r) => sum + r.messagesRead, 0);
    const totalMessagesReplied = results.reduce((sum, r) => sum + r.messagesReplied, 0);
    const totalUsersProcessed = results.reduce((sum, r) => sum + r.usersProcessed, 0);
    
    // Return the results
    return NextResponse.json({
      success: allSucceeded,
      summary: {
        totalRecipients: recipients?.length || 0,
        successfulRecipients: results.filter(r => r.success).length,
        failedRecipients: results.filter(r => !r.success).length,
        totalMessagesRead,
        totalMessagesReplied,
        totalUsersProcessed
      },
      results
    });
  } catch (error) {
    console.error('Error in OnlyFans messages API route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 