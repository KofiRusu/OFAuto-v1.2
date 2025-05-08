import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";

// GET /api/chatbot/personas - Get all personas for current user
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query params
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    const platformId = url.searchParams.get("platformId");

    // Find user ID in database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Build query
    const query: any = {
      where: { userId: user.id },
    };

    // Add clientId filter if provided
    if (clientId) {
      query.where.clientId = clientId;
    }

    // Add platformId filter if provided
    if (platformId) {
      query.where.platformId = platformId;
    }

    // Get personas
    const personas = await prisma.chatbotPersona.findMany(query);

    return NextResponse.json(personas);
  } catch (error) {
    console.error("[CHATBOT_PERSONAS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST /api/chatbot/personas - Create a new persona
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get request data
    const data = await req.json();
    const { name, description, toneKeywords, examples, clientId, platformId, isDefault } = data;

    // Validate required fields
    if (!name || !Array.isArray(toneKeywords) || toneKeywords.length === 0) {
      return new NextResponse("Missing required fields: name, toneKeywords", { status: 400 });
    }

    // Find user ID in database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Create persona
    const persona = await prisma.chatbotPersona.create({
      data: {
        userId: user.id,
        name,
        description,
        toneKeywords,
        examples: Array.isArray(examples) ? examples : [],
        clientId,
        platformId,
        isDefault: !!isDefault,
      },
    });

    // If this is set as default, unset any other defaults
    if (isDefault) {
      await prisma.chatbotPersona.updateMany({
        where: {
          userId: user.id,
          id: { not: persona.id },
          clientId: clientId || null,
          platformId: platformId || null,
        },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error("[CHATBOT_PERSONAS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/chatbot/personas/:id - Update a persona
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get ID from URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    // Get request data
    const data = await req.json();
    const { name, description, toneKeywords, examples, clientId, platformId, isDefault } = data;

    // Find user ID in database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find persona and verify ownership
    const existingPersona = await prisma.chatbotPersona.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingPersona) {
      return new NextResponse("Persona not found or unauthorized", { status: 404 });
    }

    // Update persona
    const persona = await prisma.chatbotPersona.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        toneKeywords: Array.isArray(toneKeywords) ? toneKeywords : undefined,
        examples: Array.isArray(examples) ? examples : undefined,
        clientId: clientId ?? undefined,
        platformId: platformId ?? undefined,
        isDefault: isDefault ?? undefined,
      },
    });

    // If this is set as default, unset any other defaults
    if (isDefault) {
      await prisma.chatbotPersona.updateMany({
        where: {
          userId: user.id,
          id: { not: persona.id },
          clientId: clientId || null,
          platformId: platformId || null,
        },
        data: { isDefault: false },
      });
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error("[CHATBOT_PERSONAS_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/chatbot/personas/:id - Delete a persona
export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get ID from URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    // Find user ID in database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Find persona and verify ownership
    const existingPersona = await prisma.chatbotPersona.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingPersona) {
      return new NextResponse("Persona not found or unauthorized", { status: 404 });
    }

    // Delete persona
    await prisma.chatbotPersona.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CHATBOT_PERSONAS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 