import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getExecutionService } from "@/lib/execution-agent/execution-service";
import { TaskPayload } from "@/lib/execution-agent/types";
import { OnlyFansAdapter } from "@/lib/execution-agent/adapters/onlyfans/onlyfans-adapter";
import { prisma } from "@/lib/prisma";
import { CredentialService } from "@/lib/execution-agent/credential-service";

// Register the OnlyFans adapter with the execution service
// Use the same instance from the main automation endpoint
const executionService = getExecutionService();
// Check if adapter is already registered to avoid duplicate registration
if (!executionService.getPlatformAdapter("ONLYFANS")) {
  const onlyfansAdapter = new OnlyFansAdapter();
  executionService.registerPlatformAdapter(onlyfansAdapter);
}

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
      recipients,
      mediaUrl,
      price,
    } = await req.json();

    // Validate required fields
    if (!platformId) {
      return new NextResponse("Missing platformId", { status: 400 });
    }

    if (!content) {
      return new NextResponse("Missing content", { status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new NextResponse("Missing recipients (must be an array of usernames)", { status: 400 });
    }

    // Check if the platform exists and belongs to the user
    const platform = await prisma.platform.findFirst({
      where: {
        id: platformId,
        platformType: "ONLYFANS",
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
      taskType: "SEND_DM",
      content,
      recipients,
      mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      pricingData: price ? { newPrice: price } : undefined,
    };

    // Get credentials from secure storage
    const credentialService = CredentialService.getInstance();
    const credentials = await credentialService.getCredentials(platformId);
    
    // Check if we have the required credentials
    const adapter = executionService.getPlatformAdapter("ONLYFANS");
    if (!adapter) {
      return new NextResponse("OnlyFans adapter not registered", { status: 500 });
    }
    
    const requiredCredentials = (adapter as OnlyFansAdapter).getCredentialRequirements();
    const missingCredentials = requiredCredentials.filter(cred => !credentials[cred]);
    
    if (missingCredentials.length > 0) {
      return new NextResponse(
        `Missing required OnlyFans credentials: ${missingCredentials.join(", ")}. Please configure them first.`,
        { status: 400 }
      );
    }

    // Initialize the adapter if not already initialized
    if (!adapter.isInitialized()) {
      const initialized = await adapter.initialize({
        platformId,
        clientId: platform.clientId,
        credentials,
      });

      if (!initialized) {
        return new NextResponse("Failed to initialize OnlyFans adapter", { status: 500 });
      }
    }

    // Execute the task
    const result = await executionService.executeTask(task);

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error("[ONLYFANS_DM_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 