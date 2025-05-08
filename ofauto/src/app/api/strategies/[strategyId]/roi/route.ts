import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getStrategyService } from "@/lib/ai-strategy";

export async function GET(
  req: Request,
  { params }: { params: { strategyId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const strategyService = getStrategyService();
    const roi = await strategyService.getStrategyROI(params.strategyId);

    return NextResponse.json({ roi });
  } catch (error) {
    console.error("[STRATEGY_ROI_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 