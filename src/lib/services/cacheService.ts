import Redis from 'ioredis';
import { logger } from '@/lib/telemetry/logger';

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

/**
 * Generic cache utility for tRPC procedures
 * @param key Cache key
 * @param fetchFn Function to fetch data if cache miss
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
export async function cache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300 // 5 minutes default TTL
): Promise<T> {
  try {
    // Try to get from cache
    const cachedData = await redisClient.get(key);
    
    if (cachedData) {
      logger.debug('Cache hit', { key });
      return JSON.parse(cachedData) as T;
    }
    
    // Cache miss, fetch fresh data
    logger.debug('Cache miss', { key });
    const freshData = await fetchFn();
    
    // Store in cache
    await redisClient.set(
      key,
      JSON.stringify(freshData),
      'EX',
      ttl
    );
    
    return freshData;
  } catch (error) {
    logger.error('Cache operation failed', { 
      key, 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Fall back to direct fetch on cache error
    return fetchFn();
  }
}

/**
 * Clear cache for a specific key
 * @param key Cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redisClient.del(key);
    logger.debug('Cache invalidated', { key });
  } catch (error) {
    logger.error('Cache invalidation failed', { 
      key, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Clear cache keys by pattern
 * @param pattern Pattern to match keys (e.g., "user:*")
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug('Pattern cache invalidated', { pattern, keysCount: keys.length });
    }
  } catch (error) {
    logger.error('Pattern cache invalidation failed', { 
      pattern, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
} 