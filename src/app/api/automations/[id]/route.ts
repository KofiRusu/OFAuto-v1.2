import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { automations } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { validateRequest } from '@/lib/middlewares/validateRequest';
import { authenticateRequest } from '@/lib/middlewares/authenticateRequest';
import { emitEvent } from '@/lib/websocket/events';
import { TriggerType } from '@/lib/orchestration/triggerEngine';

// Validation schema for automation updates
const AutomationUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  triggerType: z.enum([
    TriggerType.SUBSCRIPTION_DIP,
    TriggerType.ROI_THRESHOLD,
    TriggerType.CAMPAIGN_UNDERPERFORMANCE,
    TriggerType.CONTENT_PERFORMANCE,
    TriggerType.EXPERIMENT_CONCLUSION
  ]).optional(),
  conditions: z.record(z.any()).optional(),
  actions: z.array(z.object({
    type: z.string(),
    platform: z.string(),
    params: z.record(z.any()),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    scheduledTime: z.string().datetime().optional()
  })).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/automations/:id - Get a specific automation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const id = params.id;
    
    // Fetch automation by ID
    const automation = await db.query.automations.findFirst({
      where: eq(automations.id, id)
    });
    
    if (!automation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(automation);
  } catch (error) {
    console.error('Error fetching automation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch automation' },
      { status: 500 }
    );
  }
}

// PUT /api/automations/:id - Update an existing automation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const id = params.id;
    
    // Validate request body
    const validationResult = await validateRequest(request, AutomationUpdateSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Check if automation exists
    const existingAutomation = await db.query.automations.findFirst({
      where: eq(automations.id, id)
    });
    
    if (!existingAutomation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }
    
    // Update automation
    const [updatedAutomation] = await db
      .update(automations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(automations.id, id))
      .returning();
    
    // Emit real-time event
    emitEvent('automation_updated', { automation: updatedAutomation });
    
    return NextResponse.json(updatedAutomation);
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json(
      { error: 'Failed to update automation' },
      { status: 500 }
    );
  }
}

// DELETE /api/automations/:id - Delete an automation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const id = params.id;
    
    // Check if automation exists
    const existingAutomation = await db.query.automations.findFirst({
      where: eq(automations.id, id)
    });
    
    if (!existingAutomation) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }
    
    // Delete automation
    await db.delete(automations).where(eq(automations.id, id));
    
    // Emit real-time event
    emitEvent('automation_deleted', { automationId: id });
    
    return NextResponse.json(
      { message: 'Automation deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json(
      { error: 'Failed to delete automation' },
      { status: 500 }
    );
  }
} 