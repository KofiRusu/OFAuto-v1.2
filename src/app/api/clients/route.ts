import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";
import { db } from '@/lib/db';
import { clients } from '@/shared/schema';
import { insertClientSchema } from '@/shared/schema';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the requester has the right permission to create clients
    const requester = await prisma.user.findUnique({
      where: { id: clerkUserId as string }
    });
    
    if (!requester || (requester.role !== UserRole.ADMIN && requester.role !== UserRole.MANAGER)) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = insertClientSchema.parse(body);
    
    // Insert client into database
    const [newClient] = await db.insert(clients)
      .values(validatedData)
      .returning();
    
    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    
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
      { message: 'Failed to create client' }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get user ID from authentication
    // This would typically come from middleware or auth context
    // For now, we'll just fetch all clients
    
    const allClients = await db.query.clients.findMany({
      orderBy: (clients, { desc }) => [desc(clients.updatedAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    return NextResponse.json(allClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { message: 'Failed to fetch clients' }, 
      { status: 500 }
    );
  }
} 