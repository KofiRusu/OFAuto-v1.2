import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getStrategyService } from "@/lib/ai-strategy";
import { ImplementationService } from "@/lib/ai-strategy/implementation-service";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { strategyId } = await req.json();
    if (!strategyId) {
      return new NextResponse("Strategy ID is required", { status: 400 });
    }

    const strategyService = getStrategyService();
    const implementationService = ImplementationService.getInstance();

    // Get strategy
    const strategy = await strategyService.getStrategy(strategyId);
    if (!strategy) {
      return new NextResponse("Strategy not found", { status: 404 });
    }

    // Evaluate if strategy can be auto-implemented
    const evaluation = await implementationService.evaluateAutoImplement(strategy);
    
    if (!evaluation.canAutoImplement) {
      return NextResponse.json({
        success: false,
        reason: evaluation.reason,
        trustScore: evaluation.trustScore,
        roi: evaluation.roi
      });
    }

    // Auto-implement strategy
    await implementationService.autoImplementStrategy(strategy);

    return NextResponse.json({
      success: true,
      message: "Strategy auto-implementation started",
      trustScore: evaluation.trustScore,
      roi: evaluation.roi
    });
  } catch (error) {
    console.error("[STRATEGY_AUTO_IMPLEMENT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 