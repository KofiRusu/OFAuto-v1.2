import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for client creation
const clientSchema = z.object({
  name: z.string().min(1).max(100),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
});

// GET handler for fetching clients
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Fetch clients for this user
    const clients = await prisma.client.findMany({
      where: {
        userId: user.id,
      },
      include: {
        platforms: true,
        _count: {
          select: {
            platforms: true,
            metrics: true,
            financials: true,
          },
        },
      },
    });
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST handler for creating a client
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Parse request body
    const body = await req.json();
    
    // Validate body against schema
    const validationResult = clientSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 });
    }
    
    const { name, contactName, email } = validationResult.data;
    
    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        contactName,
        email,
        userId: user.id,
      },
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "CLIENT_CREATED",
        entityType: "CLIENT",
        entityId: client.id,
        userId: user.id,
        details: { name, email },
      },
    });
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 