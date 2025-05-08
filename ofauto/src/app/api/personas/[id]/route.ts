import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  notFoundResponse,
  unauthorizedResponse,
  serverErrorResponse,
  forbiddenResponse,
} from '@/lib/api-response';

// Schema for persona updates
const updatePersonaSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  toneKeywords: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  clientId: z.string().optional().nullable(),
  platformId: z.string().optional().nullable(),
});

// GET /api/personas/[id] - Get a specific persona
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    const persona = await prisma.chatbotPersona.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!persona) {
      return notFoundResponse('Persona not found');
    }
    
    // Check if user has access to this persona
    if (persona.userId !== user.id) {
      return forbiddenResponse();
    }
    
    return successResponse(persona);
  } catch (error) {
    console.error('Error fetching persona:', error);
    return serverErrorResponse();
  }
}

// PUT /api/personas/[id] - Update a persona
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Check if persona exists and belongs to user
    const existingPersona = await prisma.chatbotPersona.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingPersona) {
      return notFoundResponse('Persona not found');
    }
    
    if (existingPersona.userId !== user.id) {
      return forbiddenResponse();
    }
    
    const json = await req.json();
    const result = updatePersonaSchema.safeParse(json);
    
    if (!result.success) {
      return serverErrorResponse(result.error.message);
    }
    
    const { isDefault, ...otherData } = result.data;
    
    // If setting as default, unset any existing default
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
    
    const updatedPersona = await prisma.chatbotPersona.update({
      where: {
        id: params.id,
      },
      data: {
        ...otherData,
        isDefault: isDefault ?? existingPersona.isDefault,
      },
    });
    
    return successResponse(updatedPersona);
  } catch (error) {
    console.error('Error updating persona:', error);
    return serverErrorResponse();
  }
}

// DELETE /api/personas/[id] - Delete a persona
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Check if persona exists and belongs to user
    const existingPersona = await prisma.chatbotPersona.findUnique({
      where: {
        id: params.id,
      },
    });
    
    if (!existingPersona) {
      return notFoundResponse('Persona not found');
    }
    
    if (existingPersona.userId !== user.id) {
      return forbiddenResponse();
    }
    
    // Delete the persona
    await prisma.chatbotPersona.delete({
      where: {
        id: params.id,
      },
    });
    
    return successResponse({ id: params.id }, 'Persona deleted successfully');
  } catch (error) {
    console.error('Error deleting persona:', error);
    return serverErrorResponse();
  }
} 