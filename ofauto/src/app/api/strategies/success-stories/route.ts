import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { SuccessTracker } from "@/lib/ai-strategy/success-tracker";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { strategyId, title, description, metrics, testimonial, beforeAfterImages, featured } = await req.json();
    
    if (!strategyId || !title || !description || !metrics) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const successTracker = SuccessTracker.getInstance();
    
    const successStory = await successTracker.createSuccessStory(strategyId, {
      title,
      description,
      metrics,
      testimonial,
      beforeAfterImages,
      featured
    });

    return NextResponse.json(successStory);
  } catch (error) {
    console.error("[SUCCESS_STORY_POST]", error);
    return new NextResponse(error instanceof Error ? error.message : "Internal error", { 
      status: error instanceof Error && error.message.includes("not found") ? 404 : 500 
    });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const clientId = searchParams.get("clientId");
    const featured = searchParams.has("featured");

    const successTracker = SuccessTracker.getInstance();
    
    let successStories;
    
    if (featured) {
      successStories = await successTracker.getFeaturedSuccessStories(type as any);
    } else if (type) {
      successStories = await successTracker.getSuccessStoriesByType(type as any, clientId || undefined);
    } else if (clientId) {
      successStories = await successTracker.getClientSuccessStories(clientId);
    } else {
      return new NextResponse("Missing required query parameters", { status: 400 });
    }

    return NextResponse.json(successStories);
  } catch (error) {
    console.error("[SUCCESS_STORY_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 