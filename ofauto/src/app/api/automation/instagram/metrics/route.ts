import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getExecutionService } from "@/lib/execution-agent/execution-service";
import { TaskPayload } from "@/lib/execution-agent/types";
import { InstagramAdapter } from "@/lib/execution-agent/adapters/instagram/instagram-adapter";
import { prisma } from "@/lib/prisma";
import { CredentialService } from "@/lib/execution-agent/credential-service";

// Register the Instagram adapter with the execution service
// Use the same instance from the main automation endpoint
const executionService = getExecutionService();
// Check if adapter is already registered to avoid duplicate registration
if (!executionService.getPlatformAdapter("INSTAGRAM")) {
  const instagramAdapter = new InstagramAdapter();
  executionService.registerPlatformAdapter(instagramAdapter);
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const platformId = searchParams.get("platformId");

    if (!platformId) {
      return new NextResponse("Missing platformId parameter", { status: 400 });
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

    // Create a task payload for fetching metrics
    const task: TaskPayload = {
      platformId,
      clientId: platform.clientId,
      taskType: "FETCH_METRICS",
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

    // Execute the metrics fetch task
    const result = await executionService.executeTask(task);

    // If successful, also store metrics in our database for analytics
    if (result.success && result.metadata) {
      try {
        const metricsData = result.metadata;
        
        // Store in EngagementMetric model for historical tracking
        await prisma.engagementMetric.create({
          data: {
            clientId: platform.clientId,
            platformId: platform.id,
            date: new Date(),
            followers: metricsData.followers || 0,
            followersGain: metricsData.followersChange || 0,
            likes: 0, // Not directly available from the API
            comments: 0, // Not directly available from the API
            shares: 0, // Not applicable for Instagram
            views: metricsData.impressions || 0,
            messages: 0, // Not available from the API
          }
        });
      } catch (error) {
        console.error("Error storing Instagram metrics:", error);
        // Continue despite storage error - we still want to return the metrics
      }
    }

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error("[INSTAGRAM_METRICS_GET]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 