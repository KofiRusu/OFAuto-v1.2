import { readFileSync } from 'fs';
import { join } from 'path';
import { envSchema } from '../src/lib/env';

function validateEnvExample() {
  try {
    // Read the .env.example file
    const envExamplePath = join(process.cwd(), '.env.example');
    const envExampleContent = readFileSync(envExamplePath, 'utf-8');

    // Extract all environment variables from .env.example
    const envExampleVars = new Set(
      envExampleContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.split('=')[0].trim())
    );

    // Get all variables from the schema
    const schemaVars = new Set(Object.keys(envSchema.shape));

    // Check for missing variables
    const missingInExample = [...schemaVars].filter(varName => !envExampleVars.has(varName));
    const extraInExample = [...envExampleVars].filter(varName => !schemaVars.has(varName));

    if (missingInExample.length > 0) {
      console.error('❌ Missing variables in .env.example:', missingInExample);
      process.exit(1);
    }

    if (extraInExample.length > 0) {
      console.error('❌ Extra variables in .env.example:', extraInExample);
      process.exit(1);
    }

    console.log('✅ .env.example is in sync with the schema');
  } catch (error) {
    console.error('❌ Error validating .env.example:', error);
    process.exit(1);
  }
}

validateEnvExample(); 