import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledPosts } from '@/shared/schema';
import { insertScheduledPostSchema } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Get a single scheduled post by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const post = await db.query.scheduledPosts.findFirst({
      where: eq(scheduledPosts.id, id)
    });
    
    if (!post) {
      return NextResponse.json(
        { message: 'Scheduled post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching scheduled post:', error);
    return NextResponse.json(
      { message: 'Failed to fetch scheduled post' },
      { status: 500 }
    );
  }
}

// Update a scheduled post
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Validate request body
    const validatedData = insertScheduledPostSchema.partial().parse(body);
    
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
    
    // Update post
    const [updatedPost] = await db.update(scheduledPosts)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(scheduledPosts.id, id))
      .returning();
    
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    
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
      { message: 'Failed to update scheduled post' },
      { status: 500 }
    );
  }
}

// Delete a scheduled post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
    
    // Delete post
    await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
    
    return NextResponse.json(
      { message: 'Scheduled post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json(
      { message: 'Failed to delete scheduled post' },
      { status: 500 }
    );
  }
} 