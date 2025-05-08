import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/telemetry/logger';

// Determine appropriate connection limits based on environment
const getConnectionConfig = () => {
  const environment = process.env.NODE_ENV;
  
  // Connection pool settings based on environment
  if (environment === 'production') {
    return {
      connection_limit: 25, // Higher limit for production
      pool_timeout: 30,     // 30 seconds timeout
      connection_timeout: 60000, // 60 seconds connection timeout
    };
  } else if (environment === 'staging') {
    return {
      connection_limit: 15, // Medium limit for staging
      pool_timeout: 20,
      connection_timeout: 30000,
    };
  } else {
    return {
      connection_limit: 5,  // Lower limit for development
      pool_timeout: 10,
      connection_timeout: 15000,
    };
  }
};

// PrismaClient initialization with connection pool configuration
const prismaClientSingleton = () => {
  const connectionConfig = getConnectionConfig();
  
  logger.info('Initializing Prisma client with connection pool', connectionConfig);
  
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration
    connectionLimit: connectionConfig.connection_limit,
    // @ts-ignore - These are valid but may not be recognized by TypeScript
    pool_timeout: connectionConfig.pool_timeout,
    connection_timeout: connectionConfig.connection_timeout,
  });
};

// Next.js 13 singleton pattern for PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Log slow queries for performance monitoring
prisma.$on('query', (e: any) => {
  // Only log slow queries (over 100ms)
  if (e.duration >= 100) {
    logger.warn('Slow database query detected', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  }
});

// Setup distributed tracing for database queries
// This would integrate with OpenTelemetry in a production environment
prisma.$use(async (params, next) => {
  const start = Date.now();
  
  // Execute the query
  const result = await next(params);
  
  // Calculate the duration
  const duration = Date.now() - start;
  
  // Log long-running database operations for further analysis
  if (duration > 1000) {
    logger.warn('Long-running database operation', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`,
    });
  }
  
  return result;
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 