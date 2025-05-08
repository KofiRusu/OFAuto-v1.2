import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { getStrategyService } from "@/lib/ai-strategy";
import { ReportService } from "@/lib/ai-strategy/report-service";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { strategyId, type } = await req.json();
    if (!strategyId) {
      return new NextResponse("Strategy ID is required", { status: 400 });
    }

    const strategyService = getStrategyService();
    const reportService = ReportService.getInstance();

    let pdfBytes: Uint8Array;
    if (type === "comparison") {
      const comparison = await strategyService.getComparison(strategyId);
      if (!comparison) {
        return new NextResponse("Comparison not found", { status: 404 });
      }
      pdfBytes = await reportService.generateComparisonReport(comparison);
    } else {
      const strategy = await strategyService.getStrategy(strategyId);
      if (!strategy) {
        return new NextResponse("Strategy not found", { status: 404 });
      }
      pdfBytes = await reportService.generateStrategyReport(strategy);
    }

    // Create response with PDF
    const response = new NextResponse(pdfBytes);
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="strategy-report-${strategyId}.pdf"`
    );

    return response;
  } catch (error) {
    console.error("[STRATEGY_REPORT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 