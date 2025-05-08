import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// Schema for sending a message
const sendMessageSchema = z.object({
  platformId: z.string(),
  followerId: z.string(),
  content: z.string().min(1, 'Message content is required'),
  personaId: z.string().optional(),
});

// GET /api/messages - Get messages for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const platformId = url.searchParams.get('platformId');
    const followerId = url.searchParams.get('followerId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Basic validation
    if (!platformId || !followerId) {
      return serverErrorResponse('platformId and followerId are required');
    }
    
    // Ensure user has access to this platform
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        userId: user.id,
      },
    });
    
    if (!platform) {
      return unauthorizedResponse('You do not have access to this platform');
    }
    
    // Query for messages
    const messages = await prisma.followerInteraction.findMany({
      where: {
        platformAccountId: platformId,
        followerId: followerId,
      },
      orderBy: {
        messageSentAt: 'asc',
      },
      take: limit,
      skip: offset,
    });
    
    // Get follower details
    const follower = await prisma.followerInteraction.findFirst({
      where: {
        platformAccountId: platformId,
        followerId: followerId,
      },
      orderBy: {
        messageSentAt: 'desc',
      },
      select: {
        followerUsername: true,
        followerId: true,
        platform: true,
      },
    });
    
    return successResponse({
      messages,
      follower,
      total: messages.length,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return serverErrorResponse();
  }
}

// POST /api/messages - Send a new message
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse and validate the request body
    const json = await req.json();
    const result = sendMessageSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { platformId, followerId, content, personaId } = result.data;
    
    // Ensure user has access to this platform
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        userId: user.id,
      },
    });
    
    if (!platform) {
      return unauthorizedResponse('You do not have access to this platform');
    }
    
    // Get follower details to ensure they exist
    const follower = await prisma.followerInteraction.findFirst({
      where: {
        platformAccountId: platformId,
        followerId: followerId,
      },
      orderBy: {
        messageSentAt: 'desc',
      },
    });
    
    if (!follower) {
      return serverErrorResponse('Follower not found');
    }
    
    // Create the message
    const message = await prisma.followerInteraction.create({
      data: {
        platform: platform.platformType,
        platformAccountId: platformId,
        followerId: followerId,
        followerUsername: follower.followerUsername,
        messageSentAt: new Date(),
        messageTemplateUsed: content,
      },
    });
    
    // If a persona was used, record feedback data
    if (personaId) {
      await prisma.chatbotMessageFeedback.create({
        data: {
          userId: user.id,
          personaId: personaId,
          messageId: message.id,
          messageText: content,
          feedback: 'neutral', // Default feedback
          source: 'automated',
        },
      });
    }
    
    return createdResponse(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return serverErrorResponse();
  }
} 