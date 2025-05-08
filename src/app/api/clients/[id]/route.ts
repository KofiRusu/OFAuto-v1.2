import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { insertClientSchema } from '@/shared/schema';
import { z } from 'zod';

// Get a single client by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, id),
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
    
    if (!client) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { message: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

// Update a client
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Validate request body
    const validatedData = insertClientSchema.partial().parse(body);
    
    // Check if client exists
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.id, id)
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Update client
    const [updatedClient] = await db.update(clients)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(clients.id, id))
      .returning();
    
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    
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
      { message: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// Delete a client
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if client exists
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.id, id)
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }
    
    // Delete client
    await db.delete(clients).where(eq(clients.id, id));
    
    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { message: 'Failed to delete client' },
      { status: 500 }
    );
  }
} 