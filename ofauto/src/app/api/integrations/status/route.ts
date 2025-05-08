import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// GET /api/integrations/status - Get status of all platform integrations
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Get all platforms for the user
    const platforms = await prisma.platform.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        platformType: true,
        username: true,
        isActive: true,
        lastFollowerCheckAt: true,
        updatedAt: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Transform to a more frontend-friendly format
    const integrationStatus = platforms.map(platform => ({
      id: platform.id,
      platform: platform.platformType,
      username: platform.username,
      status: platform.isActive ? 'active' : 'inactive',
      client: platform.client,
      lastSync: platform.lastFollowerCheckAt,
      connectedAt: platform.createdAt,
      updatedAt: platform.updatedAt,
    }));
    
    return successResponse({
      integrations: integrationStatus,
      platforms: integrationStatus.map(i => i.platform),
      connectedCount: integrationStatus.length,
      activeCount: integrationStatus.filter(i => i.status === 'active').length,
    });
  } catch (error) {
    console.error('Error fetching integration status:', error);
    return serverErrorResponse();
  }
} 