import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { envSchema } from '../src/lib/env';
import { spawnSync } from 'child_process';
import { z } from 'zod';

function generateEnvExampleContent() {
  const schema = envSchema.shape;
  let content = '# Environment Variables Example\n\n';

  const categories = {
    'Node Environment': ['NODE_ENV'],
    'Database': ['DATABASE_URL'],
    'Redis Cache': ['REDIS_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    'Server Configuration': ['PORT', 'HOST', 'FRONTEND_URL'],
    'Authentication': ['JWT_SECRET', 'SESSION_SECRET'],
    'API Keys and External Services': ['OPENAI_API_KEY', 'SENTRY_DSN', 'ELASTICSEARCH_URL', 'DD_API_KEY', 'DD_HOSTNAME'],
    'AWS Configuration': ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'S3_BUCKET_NAME'],
    'Pusher Configuration': ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER', 'NEXT_PUBLIC_PUSHER_KEY', 'NEXT_PUBLIC_PUSHER_CLUSTER'],
    'Google Integration': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
    'Patreon Integration': ['PATREON_CLIENT_ID', 'PATREON_CLIENT_SECRET', 'PATREON_REDIRECT_URI', 'PATREON_WEBHOOK_SECRET'],
    'Ko-fi Integration': ['KOFI_WEBHOOK_TOKEN'],
    'LLM Configuration': ['LLM_PROVIDER', 'LLM_API_KEY', 'LLM_MODEL'],
    'Proxy Configuration': ['USE_BRIGHTDATA', 'USE_OPENVPN', 'BRIGHTDATA_HOST', 'BRIGHTDATA_PORT', 'BRIGHTDATA_USERNAME', 'BRIGHTDATA_PASSWORD', 'MANUAL_PROXIES'],
    'Media Processing': ['UPLOAD_DIR', 'MAX_FILE_SIZE', 'CHUNK_SIZE', 'MEDIA_WORKER_CONCURRENCY'],
    'Feature Flags': Object.keys(schema).filter(key => key.startsWith('ENABLE_') || key.startsWith('NEXT_PUBLIC_ENABLE_')),
    'LaunchDarkly': ['NEXT_PUBLIC_LAUNCHDARKLY_USER_KEY', 'NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID'],
    'Logging': ['LOG_LEVEL', 'OTEL_EXPORTER_OTLP_ENDPOINT'],
    'WebSocket': ['NEXT_PUBLIC_SOCKET_URL', 'NEXT_PUBLIC_APP_URL']
  };

  for (const [category, variables] of Object.entries(categories)) {
    content += `# ${category}\n`;
    for (const key of variables) {
      const field = schema[key];
      if (!field) continue;
      let defaultValue = '';
      let comment = '';
      if (field instanceof z.ZodDefault) {
        const defaultVal = field._def.defaultValue();
        defaultValue = typeof defaultVal === 'string' ? defaultVal : JSON.stringify(defaultVal);
      }
      if (field instanceof z.ZodEnum) {
        comment = `# ${field._def.values.join(' | ')}`;
      }
      if (key === 'MAX_FILE_SIZE') {
        comment = '# 100MB';
      } else if (key === 'CHUNK_SIZE') {
        comment = '# 1MB';
      }
      const line = `${key}=${defaultValue}${comment ? ' ' + comment : ''}`;
      content += line + '\n';
    }
    content += '\n';
  }
  return content;
}

function compareEnvExample() {
  const generatedPath = join(process.cwd(), '.env.example.generated');
  const committedPath = join(process.cwd(), '.env.example');

  // Generate the content and write to .env.example.generated
  const generatedContent = generateEnvExampleContent();
  writeFileSync(generatedPath, generatedContent);

  // Read both files
  const committedContent = readFileSync(committedPath, 'utf-8');

  // Compare
  if (generatedContent.trim() === committedContent.trim()) {
    console.log('✅ .env.example is in sync with the schema');
    unlinkSync(generatedPath);
    process.exit(0);
  } else {
    console.error('❌ .env.example is NOT in sync with the schema! Showing diff:');
    // Use system diff if available
    const diff = spawnSync('diff', ['-u', committedPath, generatedPath], { encoding: 'utf-8' });
    console.error(diff.stdout || diff.stderr);
    // Clean up
    unlinkSync(generatedPath);
    process.exit(1);
  }
}

compareEnvExample(); 