import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  createdResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';

// Since we don't have an explicit Alerts table in the schema, we'll simulate it with ExecutionTask
// A real implementation would use a dedicated Alerts table

// Schema for creating an alert
const createAlertSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  platformId: z.string().optional(),
  clientId: z.string(),
  condition: z.string(), // e.g., "follower_count_decrease", "revenue_drop", etc.
  threshold: z.number().optional(),
  enabled: z.boolean().default(true),
});

// GET /api/alerts - Get alerts for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // For now, we'll simulate alerts using the ExecutionTask table with a specific taskType
    // In a real implementation, you'd have a dedicated Alerts table
    
    // Get all clients for this user
    const clients = await prisma.client.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });
    
    const clientIds = clients.map(c => c.id);
    
    if (clientIds.length === 0) {
      return successResponse({
        alerts: [],
        history: [],
      });
    }
    
    // Simulate alerts (in a real implementation, you'd query your Alerts table)
    // For now, we'll return mock alerts based on client IDs
    const alerts = clientIds.map(clientId => ({
      id: `alert-${clientId}-1`,
      name: 'Follower Count Alert',
      description: 'Alert when follower count decreases by more than 5%',
      clientId,
      condition: 'follower_count_decrease',
      threshold: 5,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    // Also simulate alert history using ExecutionTask
    const alertHistory = await prisma.executionTask.findMany({
      where: {
        clientId: { in: clientIds },
        taskType: 'ALERT_TRIGGERED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    
    return successResponse({
      alerts,
      history: alertHistory,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return serverErrorResponse();
  }
}

// POST /api/alerts - Create a new alert
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse and validate request body
    const json = await req.json();
    const result = createAlertSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { name, description, platformId, clientId, condition, threshold, enabled } = result.data;
    
    // Ensure client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
    });
    
    if (!client) {
      return unauthorizedResponse('Client not found or access denied');
    }
    
    // For now, we'll simulate alert creation by creating an ExecutionTask
    // In a real implementation, you'd create a record in your Alerts table
    
    const alert = {
      id: `alert-${clientId}-${Date.now()}`,
      name,
      description: description || '',
      clientId,
      platformId,
      condition,
      threshold,
      enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Also create a task to represent this alert setup
    await prisma.executionTask.create({
      data: {
        clientId,
        platformId: platformId || '', // Use empty string if not provided
        taskType: 'ALERT_SETUP',
        status: 'COMPLETED',
        payload: alert,
        result: {
          success: true,
          message: 'Alert created successfully',
        },
      },
    });
    
    return createdResponse(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    return serverErrorResponse();
  }
} 