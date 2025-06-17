import { envSchema } from './env';

export const env = (() => {
  try {
    const parsed = envSchema.parse(process.env);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Environment: ${parsed.NODE_ENV}`);
      console.log(`Server running on port ${parsed.PORT}`);
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
    return parsed;
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables. Check server logs for more details.');
  }
})(); 