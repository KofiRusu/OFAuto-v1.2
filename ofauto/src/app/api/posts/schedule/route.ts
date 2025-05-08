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

// Schema for scheduling a post
const schedulePostSchema = z.object({
  platformId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  personaId: z.string().optional(),
});

// POST /api/posts/schedule - Schedule a new post
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse and validate the request body
    const json = await req.json();
    const result = schedulePostSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { platformId, title, description, mediaUrls, scheduledAt, personaId } = result.data;
    
    // Ensure user has access to this platform
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        userId: user.id,
      },
      include: {
        client: {
          select: {
            id: true,
          },
        },
      },
    });
    
    if (!platform) {
      return unauthorizedResponse('You do not have access to this platform');
    }
    
    // Create the scheduled task
    const scheduledTask = await prisma.scheduledTask.create({
      data: {
        clientId: platform.client.id,
        platformId: platform.id,
        taskType: 'POST_CONTENT',
        scheduledAt: new Date(scheduledAt),
        payload: {
          title,
          description: description || '',
          mediaUrls: mediaUrls || [],
          personaId,
        },
      },
    });
    
    // Create corresponding content entry
    const content = await prisma.content.create({
      data: {
        clientId: platform.client.id,
        platformId: platform.id,
        title,
        description: description || '',
        mediaUrl: mediaUrls && mediaUrls.length > 0 ? mediaUrls[0] : null,
        status: 'scheduled',
        publishDate: new Date(scheduledAt),
      },
    });
    
    return createdResponse({
      scheduledTask,
      content,
    });
  } catch (error) {
    console.error('Error scheduling post:', error);
    return serverErrorResponse();
  }
}

// GET /api/posts/schedule - Get scheduled posts
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const platformId = url.searchParams.get('platformId');
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Build the query
    const where: any = {
      taskType: 'POST_CONTENT',
    };
    
    if (platformId) {
      where.platformId = platformId;
    } else {
      // Get all platforms for this user
      const platforms = await prisma.platform.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });
      
      where.platformId = {
        in: platforms.map(p => p.id),
      };
    }
    
    // Filter by status if provided
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    // Fetch scheduled tasks
    const [scheduledTasks, total] = await Promise.all([
      prisma.scheduledTask.findMany({
        where,
        orderBy: {
          scheduledAt: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          platform: {
            select: {
              platformType: true,
              username: true,
            },
          },
          client: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.scheduledTask.count({ where }),
    ]);
    
    return successResponse({
      scheduledTasks,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return serverErrorResponse();
  }
} 