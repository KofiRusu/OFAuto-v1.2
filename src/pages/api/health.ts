import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db/prisma';

/**
 * Health check endpoint for the API
 * Used by monitoring services and container orchestration systems
 * Checks database connectivity and returns overall service health
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connectivity with a lightweight query
    await prisma.$queryRaw`SELECT 1`;

    // Return healthy status
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check failed:', error);

    // Return unhealthy status with details
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    });
  }
} 