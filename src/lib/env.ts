import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required environment variables on startup
 * Provides type safety for environment variables throughout the app
 */
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production', 'staging']),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis cache
  REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Server
  PORT: z.coerce.number().optional().default(3000),
  HOST: z.string().optional().default('0.0.0.0'),
  FRONTEND_URL: z.string().url().optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  
  // API Keys and External Services
  OPENAI_API_KEY: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
  ELASTICSEARCH_URL: z.string().url().optional(),
  DD_API_KEY: z.string().optional(),
  DD_HOSTNAME: z.string().optional(),
  
  // AWS Configuration
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional().default('ofauto-media'),
  S3_BUCKET_NAME: z.string().optional().default('ofauto-documents'),
  
  // Pusher Configuration
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional().default('us2'),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional().default('us2'),
  
  // Google Integration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  
  // Patreon Integration
  PATREON_CLIENT_ID: z.string().optional(),
  PATREON_CLIENT_SECRET: z.string().optional(),
  PATREON_REDIRECT_URI: z.string().url().optional(),
  PATREON_WEBHOOK_SECRET: z.string().optional(),
  
  // Ko-fi Integration
  KOFI_WEBHOOK_TOKEN: z.string().optional(),
  
  // LLM Configuration
  LLM_PROVIDER: z.string().optional().default('openai'),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional().default('gpt-4'),
  
  // Proxy Configuration
  USE_BRIGHTDATA: z.coerce.boolean().optional().default(false),
  USE_OPENVPN: z.coerce.boolean().optional().default(false),
  BRIGHTDATA_HOST: z.string().optional().default('brd.superproxy.io'),
  BRIGHTDATA_PORT: z.coerce.number().optional().default(22225),
  BRIGHTDATA_USERNAME: z.string().optional(),
  BRIGHTDATA_PASSWORD: z.string().optional(),
  MANUAL_PROXIES: z.string().optional(),
  
  // Media Processing
  UPLOAD_DIR: z.string().optional().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().optional().default(104857600), // 100MB
  CHUNK_SIZE: z.coerce.number().optional().default(1048576), // 1MB
  MEDIA_WORKER_CONCURRENCY: z.coerce.number().optional().default(2),
  
  // Feature Flags
  ENABLE_EXPERIMENTAL_FEATURES: z.coerce.boolean().optional().default(false),
  ENABLE_ANALYTICS: z.coerce.boolean().optional().default(true),
  NEXT_PUBLIC_ENABLE_NEW_DASHBOARD: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_BETA_FEATURES: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_AI_SUGGESTIONS: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_CONTENT_CALENDAR: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_ANALYTICS_DASHBOARD: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_ADVANCED_TARGETING: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_BULK_MESSAGING: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_GOOGLE_DRIVE: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_CALENDAR_UI: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_UNIFIED_MESSAGING: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_AI_CHATBOTS: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_METRICS_AGGREGATOR: z.coerce.boolean().optional().default(false),
  NEXT_PUBLIC_ENABLE_VOICE_API: z.coerce.boolean().optional().default(false),
  
  // LaunchDarkly
  NEXT_PUBLIC_LAUNCHDARKLY_USER_KEY: z.string().optional().default('anonymous'),
  NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).optional().default('info'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional().default('http://localhost:4318/v1/traces'),
  
  // WebSocket
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional().default('http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
}); 