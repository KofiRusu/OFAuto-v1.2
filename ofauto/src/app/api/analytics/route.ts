import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// GET /api/analytics - Get analytics data with optional filtering
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const period = url.searchParams.get('period') || 'daily';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const clientId = url.searchParams.get('clientId');
    
    // Build the query
    const where: any = {};
    
    // Only fetch for the current user's clients
    const userClients = await prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    
    const clientIds = userClients.map(c => c.id);
    
    if (clientIds.length === 0) {
      // User has no clients yet
      return successResponse({
        metrics: [],
        summary: {
          totalRevenue: 0,
          totalEngagement: 0,
          totalFollowers: 0,
          engagementRate: 0,
        },
      });
    }
    
    where.clientId = { in: clientIds };
    
    // Apply optional filters
    if (clientId && clientIds.includes(clientId)) {
      where.clientId = clientId;
    }
    
    if (period) {
      where.period = period;
    }
    
    if (startDate) {
      where.date = {
        ...(where.date || {}),
        gte: new Date(startDate),
      };
    }
    
    if (endDate) {
      where.date = {
        ...(where.date || {}),
        lte: new Date(endDate),
      };
    }
    
    // Get dashboard metrics
    const metrics = await prisma.dashboardMetric.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // Calculate summary figures
    const summary = metrics.reduce(
      (acc, metric) => {
        acc.totalRevenue += Number(metric.totalRevenue);
        acc.totalEngagement += metric.totalEngagement;
        acc.totalFollowers = Math.max(acc.totalFollowers, metric.totalFollowers);
        return acc;
      },
      {
        totalRevenue: 0,
        totalEngagement: 0,
        totalFollowers: 0,
        engagementRate: 0,
      }
    );
    
    // Calculate overall engagement rate
    if (summary.totalFollowers > 0) {
      summary.engagementRate = (summary.totalEngagement / summary.totalFollowers) * 100;
    }
    
    // If platform filter is applied, get platform-specific engagement metrics
    let engagementMetrics = [];
    if (platform) {
      const platforms = await prisma.platform.findMany({
        where: {
          userId: user.id,
          platformType: platform,
          clientId: { in: clientIds },
        },
        select: { id: true },
      });
      
      const platformIds = platforms.map(p => p.id);
      
      if (platformIds.length > 0) {
        engagementMetrics = await prisma.engagementMetric.findMany({
          where: {
            platformId: { in: platformIds },
            ...(startDate && {
              date: {
                ...(where.date || {}),
                gte: new Date(startDate),
              },
            }),
            ...(endDate && {
              date: {
                ...(where.date || {}),
                lte: new Date(endDate),
              },
            }),
          },
          orderBy: {
            date: 'asc',
          },
          include: {
            platform: {
              select: {
                platformType: true,
                username: true,
              },
            },
          },
        });
      }
    }
    
    return successResponse({
      metrics,
      engagementMetrics: engagementMetrics.length > 0 ? engagementMetrics : undefined,
      summary,
      period,
      platform: platform || 'all',
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return serverErrorResponse();
  }
} 