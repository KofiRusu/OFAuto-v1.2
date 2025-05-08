import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getExecutionService } from "@/lib/execution-agent/execution-service";
import { TaskPayload } from "@/lib/execution-agent/types";
import { InstagramAdapter } from "@/lib/execution-agent/adapters/instagram/instagram-adapter";
import { prisma } from "@/lib/prisma";
import { CredentialService } from "@/lib/execution-agent/credential-service";

// Register the Instagram adapter with the execution service
// This is done outside the handler to ensure it only happens once
const executionService = getExecutionService();
const instagramAdapter = new InstagramAdapter();
executionService.registerPlatformAdapter(instagramAdapter);

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
      mediaUrl,
      scheduledFor,
    } = await req.json();

    // Validate required fields
    if (!platformId) {
      return new NextResponse("Missing platformId", { status: 400 });
    }

    if (!content) {
      return new NextResponse("Missing content (caption)", { status: 400 });
    }

    if (!mediaUrl) {
      return new NextResponse("Missing mediaUrl (Instagram requires an image or video)", { status: 400 });
    }

    // Check if the platform exists and belongs to the user
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        platformType: "INSTAGRAM",
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

    // Determine appropriate task type based on whether a schedule date is provided
    const taskType = scheduledFor ? "SCHEDULE_POST" : "POST_CONTENT";

    // Create a task payload
    const task: TaskPayload = {
      platformId,
      clientId: platform.clientId,
      taskType,
      content,
      mediaUrls: [mediaUrl],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    };

    // Get credentials from secure storage
    const credentialService = CredentialService.getInstance();
    const credentials = await credentialService.getCredentials(platformId);
    
    // Check if we have the required credentials
    if (!credentials.accessToken || !credentials.instagramBusinessAccountId) {
      return new NextResponse("Missing required Instagram credentials. Please configure them first.", { status: 400 });
    }

    // Initialize the adapter if not already initialized
    const adapter = executionService.getPlatformAdapter("INSTAGRAM");
    if (adapter && !adapter.isInitialized()) {
      const initialized = await adapter.initialize({
        platformId,
        clientId: platform.clientId,
        credentials,
      });

      if (!initialized) {
        return new NextResponse("Failed to initialize Instagram adapter", { status: 500 });
      }
    }

    // Execute the task
    const result = await executionService.executeTask(task);

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error("[INSTAGRAM_POST_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 