import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/shared/schema';
import { eq, and, desc, asc, gte, lte, like, or } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/middlewares/authenticateRequest';

// GET /api/automations/tasks - Get all automation tasks with filtering options
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const automationId = url.searchParams.get('automationId');
    const status = url.searchParams.get('status');
    const platform = url.searchParams.get('platform');
    const actionType = url.searchParams.get('actionType');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const searchTerm = url.searchParams.get('searchTerm');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Build the base query
    let query = db.select().from(tasks);
    const conditions = [];
    
    // Apply filters
    if (automationId) {
      conditions.push(eq(tasks.automationId, automationId));
    }
    
    if (status) {
      conditions.push(eq(tasks.status, status));
    }
    
    if (platform) {
      conditions.push(eq(tasks.platform, platform));
    }
    
    if (actionType) {
      conditions.push(eq(tasks.actionType, actionType));
    }
    
    if (fromDate) {
      conditions.push(gte(tasks.createdAt, new Date(fromDate)));
    }
    
    if (toDate) {
      conditions.push(lte(tasks.createdAt, new Date(toDate)));
    }
    
    if (searchTerm) {
      conditions.push(
        or(
          like(tasks.title, `%${searchTerm}%`),
          like(tasks.description, `%${searchTerm}%`)
        )
      );
    }
    
    // Apply filters if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting
    if (sortBy in tasks) {
      const sortColumn = tasks[sortBy as keyof typeof tasks];
      if (sortOrder === 'asc') {
        query = query.orderBy(asc(sortColumn));
      } else {
        query = query.orderBy(desc(sortColumn));
      }
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute query
    const result = await query;
    
    // Get total count for pagination
    const countQuery = db.select({ count: db.fn.count() }).from(tasks);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;
    
    return NextResponse.json({
      tasks: result,
      pagination: {
        total: Number(count),
        limit,
        offset,
        hasMore: offset + limit < Number(count)
      }
    });
  } catch (error) {
    console.error('Error fetching automation tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation tasks' },
      { status: 500 }
    );
  }
} 