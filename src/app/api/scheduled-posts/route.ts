import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledPosts } from '@/shared/schema';
import { insertScheduledPostSchema } from '@/shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { z } from 'zod';

// Get all scheduled posts, optionally filtered by date, clientId, or platform
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    const platform = url.searchParams.get('platform');
    const fromDate = url.searchParams.get('fromDate');
    const status = url.searchParams.get('status');
    
    let query = db.select().from(scheduledPosts);
    
    // Apply filters if provided
    if (clientId) {
      query = query.where(eq(scheduledPosts.clientId, clientId));
    }
    
    if (platform) {
      // This assumes platforms is an array field
      // For Postgres with Drizzle, we'd need to use array contains operator
      // This might need adjustment based on how platforms are stored
      query = query.where(eq(scheduledPosts.platforms, platform));
    }
    
    if (fromDate) {
      query = query.where(gte(scheduledPosts.scheduledFor, new Date(fromDate)));
    }
    
    if (status) {
      query = query.where(eq(scheduledPosts.status, status));
    }
    
    const posts = await query;
    
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

// Create a new scheduled post
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = insertScheduledPostSchema.parse(body);
    
    // Insert post into database
    const [newPost] = await db.insert(scheduledPosts)
      .values(validatedData)
      .returning();
    
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    
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
      { message: 'Failed to create scheduled post' }, 
      { status: 500 }
    );
  }
} 