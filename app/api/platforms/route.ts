import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for platform creation
const platformSchema = z.object({
  type: z.enum(["ONLYFANS", "FANSLY", "INSTAGRAM", "TWITTER", "KOFI", "PATREON", "GUMROAD"]),
  name: z.string().min(1).max(100),
  clientId: z.string().optional(),
  username: z.string().optional(),
  connectionDetails: z.record(z.any()).optional(),
});

// GET handler for fetching platforms
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
    
    // Get query parameters
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    
    // Build query
    const query: any = {
      where: {
        userId: user.id,
      },
      include: {
        client: true,
      },
    };
    
    // Add client filter if provided
    if (clientId) {
      query.where.clientId = clientId;
    }
    
    // Fetch platforms
    const platforms = await prisma.platform.findMany(query);
    
    return NextResponse.json(platforms);
  } catch (error) {
    console.error("Error fetching platforms:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST handler for creating a platform
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
    const validationResult = platformSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.format() }, { status: 400 });
    }
    
    const { type, name, clientId, username, connectionDetails } = validationResult.data;
    
    // If clientId is provided, verify client belongs to user
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          userId: user.id,
        },
      });
      
      if (!client) {
        return NextResponse.json({ error: "Client not found or not authorized" }, { status: 404 });
      }
    }
    
    // Create platform
    const platform = await prisma.platform.create({
      data: {
        type,
        name,
        userId: user.id,
        clientId,
        username,
        connectionDetails,
      },
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        action: "PLATFORM_CREATED",
        entityType: "PLATFORM",
        entityId: platform.id,
        userId: user.id,
        details: { platformType: type, name },
      },
    });
    
    return NextResponse.json(platform, { status: 201 });
  } catch (error) {
    console.error("Error creating platform:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 