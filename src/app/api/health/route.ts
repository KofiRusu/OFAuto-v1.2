import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/telemetry/logger';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('health-api');

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  return tracer.startActiveSpan('health.check', async (span) => {
    try {
      // Check database connection
      const dbStatus = await checkDatabase();
      
      // Get system status
      const memoryUsage = process.memoryUsage();
      
      // Create health response
      const healthData = {
        status: dbStatus.isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        },
        database: dbStatus,
      };
      
      // Log health check
      logger.info('Health check executed', { health: healthData });
      
      // Set span attributes
      span.setAttribute('health.status', healthData.status);
      span.setAttribute('database.status', dbStatus.status);
      
      // End span
      span.end();
      
      // Return health data
      return NextResponse.json(healthData, {
        status: dbStatus.isHealthy ? 200 : 503,
      });
    } catch (error) {
      // Log error
      logger.error('Health check failed', { error });
      
      // Record error in span
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setAttribute('health.status', 'error');
      
      // End span
      span.end();
      
      // Return error response
      return NextResponse.json(
        {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Check database connection
 */
async function checkDatabase() {
  try {
    // Attempt a simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      isHealthy: true,
      status: 'connected',
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: 'disconnected',
      message: error instanceof Error ? error.message : String(error),
    };
  }
} 