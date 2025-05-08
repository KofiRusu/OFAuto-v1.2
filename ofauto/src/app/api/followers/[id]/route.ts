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

// Update schema
const updateFollowerSchema = z.object({
  handled: z.boolean().optional(),
  notes: z.string().optional(),
});

// PATCH /api/followers/[id] - Update follower status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Find the follower
    const follower = await prisma.followerInteraction.findUnique({
      where: {
        id: params.id,
      },
      include: {
        // Include platform to check if it belongs to the user
      },
    });
    
    if (!follower) {
      return notFoundResponse('Follower not found');
    }
    
    // Ensure user has access to this platform
    const platform = await prisma.platform.findFirst({
      where: {
        id: follower.platformAccountId,
        userId: user.id,
      },
    });
    
    if (!platform) {
      return unauthorizedResponse('You do not have access to this platform');
    }
    
    // Parse and validate the request body
    const json = await req.json();
    const result = updateFollowerSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    // Update the follower interaction
    const updatedFollower = await prisma.followerInteraction.update({
      where: {
        id: params.id,
      },
      data: result.data,
    });
    
    return successResponse(updatedFollower);
  } catch (error) {
    console.error('Error updating follower:', error);
    return serverErrorResponse();
  }
} 