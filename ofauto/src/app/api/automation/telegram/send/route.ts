import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getExecutionService } from "@/lib/execution-agent/execution-service";
import { TaskPayload } from "@/lib/execution-agent/types";
import { TelegramAdapter } from "@/lib/execution-agent/adapters/telegram/telegram-bot";
import { prisma } from "@/lib/prisma";

// Register the Telegram adapter with the execution service
// This is done outside the handler to ensure it only happens once
const executionService = getExecutionService();
const telegramAdapter = new TelegramAdapter();
executionService.registerPlatformAdapter(telegramAdapter);

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the request body
    const {
      platformId,
      content,
      mediaUrls,
      chatIds,
    } = await req.json();

    // Validate required fields
    if (!platformId) {
      return new NextResponse("Missing platformId", { status: 400 });
    }

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return new NextResponse("Missing content or media URLs", { status: 400 });
    }

    if (!chatIds || chatIds.length === 0) {
      return new NextResponse("Missing chatIds", { status: 400 });
    }

    // Check if the platform exists and belongs to the user
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        platformType: "TELEGRAM",
        user: {
          clerkId: userId,
        },
      },
      include: {
        client: true,
      },
    });

    if (!platform) {
      return new NextResponse("Platform not found or unauthorized", { status: 404 });
    }

    // Create a task payload
    const task: TaskPayload = {
      platformId,
      clientId: platform.clientId,
      taskType: "SEND_DM", // or POST_CONTENT, depending on the use case
      content,
      mediaUrls,
      recipients: chatIds,
    };

    // If adapter isn't initialized, do it now
    const adapter = executionService.getPlatformAdapter("TELEGRAM");
    if (adapter && !adapter.isInitialized()) {
      // Get credentials from platform record
      const credentials = {
        botToken: platform.accessToken,
      };

      const initialized = await adapter.initialize({
        platformId,
        clientId: platform.clientId,
        credentials,
      });

      if (!initialized) {
        return new NextResponse("Failed to initialize Telegram adapter", { status: 500 });
      }
    }

    // Execute the task
    const result = await executionService.executeTask(task);

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error("[TELEGRAM_SEND_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 