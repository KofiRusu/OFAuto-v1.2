import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Return healthy status with system information
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    
    // Return unhealthy status
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
} 