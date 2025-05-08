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

// Schema for persona creation
const createPersonaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  toneKeywords: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  clientId: z.string().optional(),
  platformId: z.string().optional(),
});

// GET /api/personas - Get all personas for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    const personas = await prisma.chatbotPersona.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return successResponse(personas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return serverErrorResponse();
  }
}

// POST /api/personas - Create a new persona
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    const json = await req.json();
    const result = createPersonaSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { name, description, toneKeywords, examples, isDefault, clientId, platformId } = result.data;
    
    // If this persona is set as default, unset any existing default
    if (isDefault) {
      await prisma.chatbotPersona.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    const persona = await prisma.chatbotPersona.create({
      data: {
        userId: user.id,
        name,
        description,
        toneKeywords,
        examples,
        isDefault,
        clientId,
        platformId,
      },
    });
    
    return createdResponse(persona);
  } catch (error) {
    console.error('Error creating persona:', error);
    return serverErrorResponse();
  }
} 