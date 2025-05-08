import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getStrategyService } from "@/lib/ai-strategy";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { strategyIds } = await req.json();
    if (!Array.isArray(strategyIds) || strategyIds.length < 2) {
      return new NextResponse("Invalid request: strategyIds must be an array with at least 2 items", { status: 400 });
    }

    const strategyService = getStrategyService();
    const strategies = await Promise.all(
      strategyIds.map(id => strategyService.getStrategy(id))
    );

    // Calculate comparison metrics
    const metrics = {
      roi: strategies.reduce((acc, s) => acc + strategyService.getStrategyROI(s.id), 0) / strategies.length,
      complexity: strategies.reduce((acc, s) => acc + s.recommendations.reduce((sum, r) => 
        sum + (r.implementationDifficulty === "HIGH" ? 3 : r.implementationDifficulty === "MEDIUM" ? 2 : 1), 0) / s.recommendations.length, 0) / strategies.length,
      expectedImpact: strategies.reduce((acc, s) => acc + s.recommendations.reduce((sum, r) => 
        sum + (r.expectedImpact === "HIGH" ? 3 : r.expectedImpact === "MEDIUM" ? 2 : 1), 0) / s.recommendations.length, 0) / strategies.length,
      implementationTime: strategies.reduce((acc, s) => acc + s.recommendations.reduce((sum, r) => 
        sum + (r.estimatedTime || 30), 0) / s.recommendations.length, 0) / strategies.length
    };

    // Create comparison record
    const comparison = {
      id: uuidv4(),
      clientId: strategies[0].clientId,
      strategies: strategyIds,
      metrics,
      createdAt: new Date(),
      notes: `Comparison of ${strategies.length} strategies`
    };

    // Save comparison to database
    await strategyService.saveComparison(comparison);

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("[STRATEGY_COMPARE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 