import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required environment variables on startup
 * Provides type safety for environment variables throughout the app
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis cache
  REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
  
  // Server
  PORT: z.coerce.number().optional().default(3000),
  HOST: z.string().optional().default('0.0.0.0'),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  
  // API keys
  OPENAI_API_KEY: z.string().min(1),
  
  // External services
  SENTRY_DSN: z.string().url().optional(),
  ELASTICSEARCH_URL: z.string().url().optional(),
  
  // Feature flags
  ENABLE_EXPERIMENTAL_FEATURES: z.coerce.boolean().optional().default(false),
  ENABLE_ANALYTICS: z.coerce.boolean().optional().default(true),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).optional().default('info'),
});

/**
 * Parse and validate environment variables
 * This will throw an error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables. Check server logs for more details.');
  }
}

// Export validated environment variables
export const env = validateEnv();

// Log startup information
if (process.env.NODE_ENV !== 'test') {
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Server running on port ${env.PORT}`);
  
  // Check for potential issues or unused variables
  const definedEnvVars = Object.keys(process.env);
  const schemaKeys = Object.keys(envSchema.shape);
  
  const undocumentedVars = definedEnvVars.filter(key => 
    !schemaKeys.includes(key) && 
    !key.startsWith('_') && 
    !key.startsWith('npm_')
  );
  
  if (undocumentedVars.length > 0) {
    console.warn('⚠️  Undocumented environment variables detected:', undocumentedVars);
    console.warn('Consider adding these to the environment schema if they are required.');
  }
} 