import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { SuccessTracker } from "@/lib/ai-strategy/success-tracker";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    
    if (!type) {
      return new NextResponse("Strategy type is required", { status: 400 });
    }

    const successTracker = SuccessTracker.getInstance();
    const metrics = await successTracker.getAggregateMetrics(type as any);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[SUCCESS_STORY_METRICS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 