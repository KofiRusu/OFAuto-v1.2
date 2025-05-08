// Export all telemetry utils
export * from './opentelemetry';
export * from './logger';

// Import for side effects
import { initializeOpenTelemetry } from './opentelemetry';
import { logger } from './logger';

// Initialize OpenTelemetry if not in development mode
// In production, this should be initialized when the server starts
if (process.env.NODE_ENV === 'production') {
  try {
    initializeOpenTelemetry();
    logger.info('Telemetry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize telemetry:', error);
  }
} 