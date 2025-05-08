import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { analyzePersonaFeedback } from "@/lib/ai/prompt-engine/feedback-trainer";

// GET /api/chatbot/feedback/analysis - Get feedback analysis for a specific persona
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query params
    const url = new URL(req.url);
    const personaId = url.searchParams.get("personaId");

    if (!personaId) {
      return new NextResponse("Missing personaId parameter", { status: 400 });
    }

    // Find user ID in database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify the persona exists and belongs to the user
    const persona = await prisma.chatbotPersona.findFirst({
      where: {
        id: personaId,
        userId: user.id,
      },
    });

    if (!persona) {
      return new NextResponse("Persona not found or unauthorized", { status: 404 });
    }

    // Get feedback analysis
    const analysis = await analyzePersonaFeedback(personaId);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[CHATBOT_FEEDBACK_ANALYSIS]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 