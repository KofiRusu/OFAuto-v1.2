import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs';

// Rate limit configurations
const RATE_LIMITS = {
  // Queue endpoints: 5 req/sec per user
  '/api/queue': {
    limit: 5,
    window: 1000, // 1 second in ms
  },
  // Message endpoints: 10 req/min per user (per follower ID if provided)
  '/api/messages': {
    limit: 10,
    window: 60 * 1000, // 1 minute in ms
  },
  // Post scheduling: 5 req/min per user
  '/api/posts/schedule': {
    limit: 5,
    window: 60 * 1000, // 1 minute in ms
  },
  // Alert endpoints: 2 writes/sec per user
  '/api/alerts': {
    limit: 2,
    window: 1000, // 1 second in ms
  },
  // Default settings for all other endpoints: 60 req/min per user
  'default': {
    limit: 60,
    window: 60 * 1000, // 1 minute in ms
  }
};

// In-memory storage for rate limiting
// In production, use Redis or similar for distributed rate limiting
const rateLimitStore = new Map<string, { count: number, resetAt: number }>();

/**
 * Clean up expired rate limit data
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupRateLimits, 60 * 1000);

/**
 * Get rate limit configuration for a path
 */
function getRateLimitConfig(path: string) {
  // Find the most specific configuration first
  const exactMatch = Object.keys(RATE_LIMITS).find(prefix => path === prefix && prefix !== 'default');
  if (exactMatch) {
    return RATE_LIMITS[exactMatch as keyof typeof RATE_LIMITS];
  }
  
  // Find the longest matching prefix
  const matchingPrefix = Object.keys(RATE_LIMITS)
    .filter(prefix => prefix !== 'default' && path.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
    
  if (matchingPrefix) {
    return RATE_LIMITS[matchingPrefix as keyof typeof RATE_LIMITS];
  }
  
  // Fall back to default
  return RATE_LIMITS.default;
}

/**
 * Rate limiting middleware function
 * 
 * @param req The Next.js request object
 * @param userId The Clerk user ID (or null if not authenticated)
 * @returns NextResponse if rate limited, otherwise undefined
 */
export function rateLimit(req: NextRequest, userId: string | null) {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Skip rate limiting for non-API routes
  if (!path.startsWith('/api/')) {
    return undefined;
  }
  
  // Use user ID from auth if available, otherwise fallback to IP
  const identifier = userId || req.ip || 'anonymous';
  
  // Construct the rate limit key
  let rateLimitKey = `${identifier}:${path}`;
  // Special handling for /api/messages to rate limit per follower if ID provided
  if (path.startsWith('/api/messages') && url.searchParams.has('followerId')) {
    const followerId = url.searchParams.get('followerId');
    rateLimitKey = `${identifier}:${path}:${followerId}`;
  }
  
  // Get rate limit config for this path
  const config = getRateLimitConfig(path);
  
  // Check and update rate limit store
  const now = Date.now();
  const record = rateLimitStore.get(rateLimitKey);
  
  if (record) {
    // Reset count if window has expired
    if (record.resetAt < now) {
      rateLimitStore.set(rateLimitKey, { count: 1, resetAt: now + config.window });
      // Allow request
    } 
    // Increment count if within limit
    else if (record.count < config.limit) {
      rateLimitStore.set(rateLimitKey, { ...record, count: record.count + 1 });
      // Allow request
    } 
    // Rate limit exceeded
    else {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' }, 
        { 
          status: 429, 
          headers: {
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetAt).toISOString(),
          }
        }
      );
    }
  } 
  // First request in this window for this key
  else {
    rateLimitStore.set(rateLimitKey, { count: 1, resetAt: now + config.window });
    // Allow request
  }
  
  // Request is allowed, continue processing
  return undefined;
}

/**
 * Apply rate limiting to a specific API route handler
 * 
 * @param handler The API route handler
 * @returns A wrapped handler with rate limiting
 */
export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest) => {
    // Apply rate limit
    const rateLimitResponse = rateLimit(req, req.headers.get('x-user-id'));
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Continue to handler
    return handler(req);
  };
} 