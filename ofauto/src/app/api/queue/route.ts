import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// GET /api/queue - Get automation queue status
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const taskType = url.searchParams.get('taskType');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get all platforms for this user
    const platforms = await prisma.platform.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });
    
    if (platforms.length === 0) {
      return successResponse({
        tasks: [],
        total: 0,
      });
    }
    
    // Build the query
    const where: any = {
      platformId: {
        in: platforms.map(p => p.id),
      },
    };
    
    // Apply filters
    if (status) {
      where.status = status.toUpperCase();
    }
    
    if (taskType) {
      where.taskType = taskType.toUpperCase();
    }
    
    // Fetch tasks and total count
    const [tasks, total] = await Promise.all([
      prisma.executionTask.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // PENDING first, then IN_PROGRESS, then COMPLETED/FAILED
          { createdAt: 'desc' }, // Most recent first
        ],
        take: limit,
        skip: offset,
        include: {
          // Include related data
        },
      }),
      prisma.executionTask.count({ where }),
    ]);
    
    // Get summary statistics
    const pendingCount = await prisma.executionTask.count({
      where: {
        ...where,
        status: 'PENDING',
      },
    });
    
    const inProgressCount = await prisma.executionTask.count({
      where: {
        ...where,
        status: 'IN_PROGRESS',
      },
    });
    
    const completedCount = await prisma.executionTask.count({
      where: {
        ...where,
        status: 'COMPLETED',
      },
    });
    
    const failedCount = await prisma.executionTask.count({
      where: {
        ...where,
        status: 'FAILED',
      },
    });
    
    return successResponse({
      tasks,
      total,
      summary: {
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        failed: failedCount,
      },
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching automation queue:', error);
    return serverErrorResponse();
  }
} 