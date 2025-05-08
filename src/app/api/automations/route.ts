import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { automations } from '@/shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { validateRequest } from '@/lib/middlewares/validateRequest';
import { authenticateRequest } from '@/lib/middlewares/authenticateRequest';
import { emitEvent } from '@/lib/websocket/events';
import { TriggerType } from '@/lib/orchestration/triggerEngine';

// Validation schema for automation creation/update
const AutomationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  clientId: z.string().uuid(),
  triggerType: z.enum([
    TriggerType.SUBSCRIPTION_DIP,
    TriggerType.ROI_THRESHOLD,
    TriggerType.CAMPAIGN_UNDERPERFORMANCE,
    TriggerType.CONTENT_PERFORMANCE,
    TriggerType.EXPERIMENT_CONCLUSION
  ]),
  conditions: z.record(z.any()),
  actions: z.array(z.object({
    type: z.string(),
    platform: z.string(),
    params: z.record(z.any()),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    scheduledTime: z.string().datetime().optional()
  })),
  isActive: z.boolean().default(true),
});

// GET /api/automations - Get all automations with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const triggerType = url.searchParams.get('triggerType') as TriggerType | null;
    const isActive = url.searchParams.get('isActive');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = db.select().from(automations);
    
    // Apply filters
    if (clientId) {
      query = query.where(eq(automations.clientId, clientId));
    }
    
    if (triggerType) {
      query = query.where(eq(automations.triggerType, triggerType));
    }
    
    if (isActive !== null) {
      query = query.where(eq(automations.isActive, isActive === 'true'));
    }
    
    // Apply sorting
    if (sortBy in automations) {
      const sortColumn = automations[sortBy as keyof typeof automations];
      if (sortOrder === 'asc') {
        query = query.orderBy(asc(sortColumn));
      } else {
        query = query.orderBy(desc(sortColumn));
      }
    }
    
    // Execute query
    const result = await query;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automations' },
      { status: 500 }
    );
  }
}

// POST /api/automations - Create a new automation
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // Validate request body
    const validationResult = await validateRequest(request, AutomationSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // Insert automation into database
    const [automation] = await db.insert(automations).values({
      name: data.name,
      description: data.description || '',
      clientId: data.clientId,
      triggerType: data.triggerType,
      conditions: data.conditions,
      actions: data.actions,
      isActive: data.isActive,
    }).returning();
    
    // Emit real-time event
    emitEvent('automation_created', { automation });
    
    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    );
  }
} 