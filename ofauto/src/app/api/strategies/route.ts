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

// Schema for creating a strategy
const createStrategySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  strategyType: z.string(),
  platformId: z.string().optional(),
  clientId: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

// GET /api/strategies - Get all strategies for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const strategyType = url.searchParams.get('type');
    const platformId = url.searchParams.get('platformId');
    const clientId = url.searchParams.get('clientId');
    
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
        strategies: [],
        total: 0,
      });
    }
    
    // Build the query
    const where: any = {
      clientId: { in: clientIds },
    };
    
    if (strategyType) {
      where.strategyType = strategyType;
    }
    
    if (platformId) {
      where.platformId = platformId;
    }
    
    if (clientId && clientIds.includes(clientId)) {
      where.clientId = clientId;
    }
    
    // Find success stories/strategies
    const strategies = await prisma.successStory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        // Include related data if needed
      },
    });
    
    return successResponse({
      strategies,
      total: strategies.length,
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return serverErrorResponse();
  }
}

// POST /api/strategies - Create a new strategy
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Parse and validate the request body
    const json = await req.json();
    const result = createStrategySchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { title, description, strategyType, platformId, clientId, settings } = result.data;
    
    // If clientId is provided, ensure it belongs to the user
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: user.id,
        },
      });
      
      if (!client) {
        return unauthorizedResponse('Client not found or access denied');
      }
    } else {
      // Get the first client for this user
      const client = await prisma.client.findFirst({
        where: {
          userId: user.id,
        },
      });
      
      if (!client) {
        return serverErrorResponse('You must have at least one client to create a strategy');
      }
    }
    
    // If platformId is provided, ensure it belongs to the user
    if (platformId) {
      const platform = await prisma.platform.findFirst({
        where: {
          id: platformId,
          userId: user.id,
        },
      });
      
      if (!platform) {
        return unauthorizedResponse('Platform not found or access denied');
      }
    }
    
    // Create the strategy (as a success story for now)
    const strategy = await prisma.successStory.create({
      data: {
        title,
        description: description || '',
        strategyType,
        clientId: clientId || '',
        strategyId: '', // This would be generated
        metrics: settings || {},
        beforeAfterImages: [],
        featured: false,
      },
    });
    
    return createdResponse(strategy);
  } catch (error) {
    console.error('Error creating strategy:', error);
    return serverErrorResponse();
  }
} 