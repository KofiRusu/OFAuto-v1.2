import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { processFeedback } from "@/lib/ai/prompt-engine/feedback-trainer";

// POST /api/chatbot/feedback - Submit feedback for a message
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get request data
    const data = await req.json();
    const { 
      personaId, 
      messageId, 
      messageText, 
      feedback, 
      comment, 
      source = "manual" 
    } = data;

    // Validate required fields
    if (!personaId || !messageId || !messageText || !feedback) {
      return new NextResponse(
        "Missing required fields: personaId, messageId, messageText, feedback", 
        { status: 400 }
      );
    }

    // Validate feedback value
    if (!["positive", "negative", "neutral"].includes(feedback)) {
      return new NextResponse(
        "Feedback must be one of: positive, negative, neutral", 
        { status: 400 }
      );
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

    // Create feedback record
    const feedbackRecord = await prisma.chatbotMessageFeedback.create({
      data: {
        userId: user.id,
        personaId,
        messageId,
        messageText,
        feedback,
        comment,
        source,
      },
    });

    // Process the feedback to learn from it
    const processingResult = await processFeedback(feedbackRecord);

    return NextResponse.json({
      success: true,
      feedback: feedbackRecord,
      processingResult,
    });
  } catch (error) {
    console.error("[CHATBOT_FEEDBACK_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

// GET /api/chatbot/feedback - Get feedback for a specific persona
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query params
    const url = new URL(req.url);
    const personaId = url.searchParams.get("personaId");
    const messageId = url.searchParams.get("messageId");

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

    // Build query
    const query: any = {
      where: {
        personaId,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    // Add messageId filter if provided
    if (messageId) {
      query.where.messageId = messageId;
    }

    // Get feedback records
    const feedbackRecords = await prisma.chatbotMessageFeedback.findMany(query);

    return NextResponse.json(feedbackRecords);
  } catch (error) {
    console.error("[CHATBOT_FEEDBACK_GET]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

// GET /api/chatbot/feedback/analysis - Get feedback analysis for a specific persona
export async function analysis(req: Request) {
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

    // Get all feedback for this persona
    const feedbackRecords = await prisma.chatbotMessageFeedback.findMany({
      where: {
        personaId,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const positiveCount = feedbackRecords.filter((f) => f.feedback === "positive").length;
    const negativeCount = feedbackRecords.filter((f) => f.feedback === "negative").length;
    const neutralCount = feedbackRecords.filter((f) => f.feedback === "neutral").length;

    // Calculate positive percentage
    const totalCount = feedbackRecords.length;
    const positivePercentage = totalCount > 0 
      ? Math.round((positiveCount / totalCount) * 100) 
      : 0;

    // Get recent samples
    const recentPositive = feedbackRecords
      .filter((f) => f.feedback === "positive")
      .slice(0, 5);

    const recentNegative = feedbackRecords
      .filter((f) => f.feedback === "negative")
      .slice(0, 5);

    return NextResponse.json({
      personaId,
      stats: {
        totalCount,
        positiveCount,
        negativeCount,
        neutralCount,
        positivePercentage,
      },
      samples: {
        positive: recentPositive,
        negative: recentNegative,
      },
    });
  } catch (error) {
    console.error("[CHATBOT_FEEDBACK_ANALYSIS]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 