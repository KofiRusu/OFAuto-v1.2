import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// Schema for cancel request
const cancelTaskSchema = z.object({
  taskId: z.string(),
  reason: z.string().optional(),
});

// POST /api/queue/cancel - Cancel a pending task
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse and validate the request body
    const json = await req.json();
    const result = cancelTaskSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { taskId, reason } = result.data;
    
    // Find the task
    const task = await prisma.executionTask.findUnique({
      where: {
        id: taskId,
      },
    });
    
    if (!task) {
      return notFoundResponse('Task not found');
    }
    
    // Check if the task belongs to one of the user's platforms
    const platform = await prisma.platform.findFirst({
      where: {
        id: task.platformId,
        userId: user.id,
      },
    });
    
    if (!platform) {
      return unauthorizedResponse('You do not have access to this task');
    }
    
    // Check if the task can be cancelled (must be in PENDING or IN_PROGRESS status)
    if (task.status !== 'PENDING' && task.status !== 'IN_PROGRESS') {
      return serverErrorResponse('Only pending or in-progress tasks can be cancelled');
    }
    
    // Update the task status to CANCELLED
    const updatedTask = await prisma.executionTask.update({
      where: {
        id: taskId,
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
        result: {
          ...task.result,
          cancelReason: reason || 'Cancelled by user',
          cancelledAt: new Date().toISOString(),
        },
      },
    });
    
    // If there's a related scheduled task, also mark it as cancelled
    if (task.strategyId) {
      await prisma.scheduledTask.updateMany({
        where: {
          id: task.strategyId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
          errorMessage: reason || 'Cancelled by user',
        },
      });
    }
    
    return successResponse(updatedTask);
  } catch (error) {
    console.error('Error cancelling task:', error);
    return serverErrorResponse();
  }
} 