import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";

// GET /api/marketing/follower-interactions - Get follower interactions
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
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    // Find user ID in database
    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Build query to get platforms accessible to this user
    const platformsQuery: any = {
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    };

    // Add clientId filter if provided
    if (clientId) {
      platformsQuery.where.clientId = clientId;
    }

    // Add specific platformId filter if provided
    if (platformId) {
      platformsQuery.where.id = platformId;
    }

    // Get platforms
    const platforms = await prisma.platform.findMany(platformsQuery);
    
    if (platforms.length === 0) {
      return NextResponse.json([]);
    }

    // Get platform IDs
    const platformIds = platforms.map((p) => p.id);

    // Get follower interactions
    const interactions = await prisma.followerInteraction.findMany({
      where: {
        platformAccountId: {
          in: platformIds,
        },
      },
      orderBy: {
        messageSentAt: "desc",
      },
      take: limit,
    });

    // Get messages for these interactions
    // This is a placeholder - in a real implementation, we'd have the message text stored
    // in the FollowerInteraction table or we'd join with a Messages table
    const interactionsWithMessages = interactions.map(interaction => ({
      ...interaction,
      messageText: "Thanks for following! We're excited to connect with you."
    }));

    return NextResponse.json(interactionsWithMessages);
  } catch (error) {
    console.error("[FOLLOWER_INTERACTIONS_GET]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 