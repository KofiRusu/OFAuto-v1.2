import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getExecutionService } from "@/lib/execution-agent/execution-service";
import { prisma } from "@/lib/prisma";
import { TaskPayload, PlatformType } from "@/lib/execution-agent/types";
import { TelegramAdapter } from "@/lib/execution-agent/adapters/telegram/telegram-bot";

// Register all adapters with the execution service
// This is done outside the handler to ensure it only happens once
const executionService = getExecutionService();

// Register Telegram adapter
const telegramAdapter = new TelegramAdapter();
executionService.registerPlatformAdapter(telegramAdapter);

// Register additional adapters here as they are implemented
// const instagramAdapter = new InstagramAdapter();
// executionService.registerPlatformAdapter(instagramAdapter);

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the request body - expect a TaskPayload
    const taskPayload = await req.json();

    if (!taskPayload.platformId || !taskPayload.clientId || !taskPayload.taskType) {
      return new NextResponse("Missing required fields: platformId, clientId, taskType", { status: 400 });
    }

    // Check if the platform exists and belongs to the user
    const platform = await prisma.platform.findFirst({
      where: {
        id: taskPayload.platformId,
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

    // Ensure client ID matches
    if (platform.clientId !== taskPayload.clientId) {
      return new NextResponse("Platform does not belong to the specified client", { status: 403 });
    }

    // Get the appropriate adapter
    const platformType = platform.platformType.toUpperCase() as PlatformType;
    const adapter = executionService.getPlatformAdapter(platformType);

    if (!adapter) {
      return new NextResponse(`No adapter registered for platform type ${platformType}`, { status: 400 });
    }

    // Initialize the adapter if needed
    if (!adapter.isInitialized()) {
      // Extract credentials from the platform record
      const credentials: Record<string, string> = {};
      
      // Common credential fields
      if (platform.accessToken) credentials.accessToken = platform.accessToken;
      if (platform.refreshToken) credentials.refreshToken = platform.refreshToken;
      
      // Platform-specific credential mapping
      if (platformType === "TELEGRAM" && platform.accessToken) {
        credentials.botToken = platform.accessToken;
      }
      
      const initialized = await adapter.initialize({
        platformId: platform.id,
        clientId: platform.clientId,
        credentials,
      });

      if (!initialized) {
        return new NextResponse(`Failed to initialize ${platformType} adapter`, { status: 500 });
      }
    }

    // Execute the task
    const result = await executionService.executeTask(taskPayload as TaskPayload);

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AUTOMATION_EXECUTE_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const platformId = searchParams.get("platformId");
    const taskType = searchParams.get("taskType");

    if (!clientId) {
      return new NextResponse("Missing clientId parameter", { status: 400 });
    }

    // Verify user has access to this client
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        user: {
          clerkId: userId,
        },
      },
    });

    if (!client) {
      return new NextResponse("Client not found or unauthorized", { status: 404 });
    }

    // Fetch task history
    const tasks = await executionService.getTaskHistory(
      clientId,
      platformId || undefined,
      taskType as any || undefined
    );

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[AUTOMATION_EXECUTE_GET]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 