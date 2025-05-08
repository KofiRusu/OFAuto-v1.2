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

// Schema for retry request
const retryTaskSchema = z.object({
  taskId: z.string(),
});

// POST /api/queue/retry - Retry a failed task
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse and validate the request body
    const json = await req.json();
    const result = retryTaskSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { taskId } = result.data;
    
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
    
    // Check if the task can be retried (must be in FAILED status)
    if (task.status !== 'FAILED') {
      return serverErrorResponse('Only failed tasks can be retried');
    }
    
    // Update the task status to PENDING to retry it
    const updatedTask = await prisma.executionTask.update({
      where: {
        id: taskId,
      },
      data: {
        status: 'PENDING',
        updatedAt: new Date(),
        // Reset any error-related fields
        result: {
          ...task.result,
          error: null,
          retryCount: ((task.result as any)?.retryCount || 0) + 1,
          retryTimestamp: new Date().toISOString(),
        },
      },
    });
    
    return successResponse(updatedTask);
  } catch (error) {
    console.error('Error retrying task:', error);
    return serverErrorResponse();
  }
} 