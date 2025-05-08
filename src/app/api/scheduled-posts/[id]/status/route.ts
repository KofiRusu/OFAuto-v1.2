import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledPosts } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Define status update schema
const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'processing', 'published', 'failed']),
});

// Update a post's status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Validate request body
    const { status } = statusUpdateSchema.parse(body);
    
    // Check if post exists
    const existingPost = await db.query.scheduledPosts.findFirst({
      where: eq(scheduledPosts.id, id)
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { message: 'Scheduled post not found' },
        { status: 404 }
      );
    }
    
    // Update post status
    const [updatedPost] = await db.update(scheduledPosts)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(scheduledPosts.id, id))
      .returning();
    
    // Notify all subscribers of the status change via WebSocket
    // @ts-ignore - req.emitScheduledPostUpdate exists but isn't typed in the Request
    if (req.emitScheduledPostUpdate) {
      // @ts-ignore
      req.emitScheduledPostUpdate({
        postId: updatedPost.id,
        status: updatedPost.status,
        title: updatedPost.title,
        userId: updatedPost.userId,
        clientId: updatedPost.clientId
      });
    }
    
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post status:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Validation error', 
          errors: error.errors 
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to update post status' },
      { status: 500 }
    );
  }
} 