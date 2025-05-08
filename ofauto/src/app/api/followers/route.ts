import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// GET /api/followers - Get followers data with optional filtering
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const status = url.searchParams.get('status'); // 'all', 'active', 'inactive'
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get platforms for the current user
    const platforms = await prisma.platform.findMany({
      where: {
        userId: user.id,
        ...(platform ? { platformType: platform } : {}),
      },
      select: {
        id: true,
        platformType: true,
        username: true,
      },
    });
    
    if (platforms.length === 0) {
      return successResponse({
        followers: [],
        total: 0,
        platforms: [],
      });
    }
    
    // Extract platform IDs and types
    const platformIds = platforms.map(p => p.id);
    const platformTypes = platforms.map(p => p.platformType);
    
    // Query follower interactions
    const where: any = {
      platformAccountId: { in: platformIds },
    };
    
    if (search) {
      where.OR = [
        { followerId: { contains: search, mode: 'insensitive' } },
        { followerUsername: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Define the include object for the query
    const include = {
      // Any related models we want to include
    };
    
    // Fetch followers
    const [followers, total] = await Promise.all([
      prisma.followerInteraction.findMany({
        where,
        orderBy: {
          messageSentAt: 'desc',
        },
        take: limit,
        skip: offset,
        include,
      }),
      prisma.followerInteraction.count({ where }),
    ]);
    
    // Group followers by unique ID to get latest interaction
    const uniqueFollowers = followers.reduce((acc, follower) => {
      const key = `${follower.platform}-${follower.followerId}`;
      if (!acc[key] || new Date(follower.messageSentAt) > new Date(acc[key].messageSentAt)) {
        acc[key] = follower;
      }
      return acc;
    }, {});
    
    return successResponse({
      followers: Object.values(uniqueFollowers),
      total,
      platforms: platformTypes,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return serverErrorResponse();
  }
} 