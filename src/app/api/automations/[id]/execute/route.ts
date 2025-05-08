import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automations } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/middlewares/authenticateRequest';
import { emitEvent } from '@/lib/websocket/events';
import { OrchestrationEngine, ManualTrigger } from '@/lib/orchestration/OrchestrationEngine';

// POST /api/automations/:id/execute - Execute an automation manually
export async function POST(
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
    
    // Check if automation is active
    if (!automation.isActive) {
      return NextResponse.json(
        { error: 'Cannot execute inactive automation' },
        { status: 400 }
      );
    }
    
    // Initialize orchestration engine
    const orchestrationEngine = new OrchestrationEngine();
    
    // Convert automation actions to manual triggers
    const triggers: ManualTrigger[] = automation.actions.map(action => ({
      type: action.type,
      platform: action.platform,
      params: action.params,
      priority: action.priority || 'medium',
      scheduledTime: action.scheduledTime ? new Date(action.scheduledTime) : undefined
    }));
    
    // Execute each trigger and collect task IDs
    const taskIds: string[] = [];
    for (const trigger of triggers) {
      const taskId = await orchestrationEngine.handleManualTrigger(trigger);
      taskIds.push(taskId);
    }
    
    // Update automation last triggered time
    await db
      .update(automations)
      .set({
        lastTriggeredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(automations.id, id));
    
    // Emit real-time event
    emitEvent('automation_executed', { 
      automationId: id, 
      taskIds,
      executedAt: new Date().toISOString() 
    });
    
    return NextResponse.json({
      message: 'Automation execution initiated',
      taskIds,
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing automation:', error);
    return NextResponse.json(
      { error: 'Failed to execute automation' },
      { status: 500 }
    );
  }
} 