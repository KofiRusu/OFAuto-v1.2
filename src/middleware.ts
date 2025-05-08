import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware, clerkClient, getAuth } from '@clerk/nextjs/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'

/**
 * Feature flag constants
 * These flags are accessed from environmental variables and passed into response headers
 * so they can be accessed client-side.
 */
const FEATURE_FLAGS = {
  ENABLE_NEW_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_NEW_DASHBOARD === 'true',
  ENABLE_BETA_FEATURES: process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true',
  ENABLE_AI_SUGGESTIONS: process.env.NEXT_PUBLIC_ENABLE_AI_SUGGESTIONS === 'true',
  ENABLE_CONTENT_CALENDAR: process.env.NEXT_PUBLIC_ENABLE_CONTENT_CALENDAR === 'true',
  ENABLE_ANALYTICS_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS_DASHBOARD === 'true',
  ENABLE_ADVANCED_TARGETING: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_TARGETING === 'true',
  ENABLE_BULK_MESSAGING: process.env.NEXT_PUBLIC_ENABLE_BULK_MESSAGING === 'true',
  // Phase 10 feature flags
  ENABLE_GOOGLE_DRIVE: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_DRIVE === 'true',
  ENABLE_CALENDAR_UI: process.env.NEXT_PUBLIC_ENABLE_CALENDAR_UI === 'true',
  ENABLE_UNIFIED_MESSAGING: process.env.NEXT_PUBLIC_ENABLE_UNIFIED_MESSAGING === 'true',
  ENABLE_AI_CHATBOTS: process.env.NEXT_PUBLIC_ENABLE_AI_CHATBOTS === 'true',
  ENABLE_METRICS_AGGREGATOR: process.env.NEXT_PUBLIC_ENABLE_METRICS_AGGREGATOR === 'true',
  ENABLE_VOICE_API: process.env.NEXT_PUBLIC_ENABLE_VOICE_API === 'true',
}

/**
 * Rate limiting setup using Upstash Redis
 * This is only initialized if the required Upstash credentials are provided
 */
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  
  // Create a rate limiter that allows 10 requests per 10 seconds
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
  })
}

/**
 * Route protection configuration
 * publicRoutes: Routes that don't require authentication
 * authorizedRoutes: Routes that require specific roles or permissions
 */
const publicRoutes = [
  '/',
  '/api/health',
  '/api/webhook(.*)',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/verify(.*)',
  '/terms',
  '/privacy',
  '/demo(.*)',
  '/api/public(.*)',
]

// Routes that require specific roles/permissions
const authorizedRoutes = {
  admin: [
    '/dashboard/admin(.*)',
    '/dashboard/settings/organization(.*)',
    '/api/admin(.*)',
  ],
  manager: [
    '/dashboard/reports(.*)',
    '/dashboard/team(.*)',
    '/dashboard/analytics/unified(.*)',
    '/dashboard/metrics(.*)',
    '/dashboard/admin/chatbot-automation(.*)',
    '/dashboard/admin/activity(.*)',
    '/dashboard/admin/financial-monitor(.*)',
    '/api/reports(.*)',
    '/api/trpc/metrics(.*)',
    '/api/trpc/chatbotAutomation(.*)',
    '/api/trpc/activityMonitor(.*)',
    '/api/trpc/financialMonitor(.*)',
  ],
  model: [
    '/dashboard/media/drive(.*)',
    '/dashboard/chatbot/settings(.*)',
    '/api/trpc/drive(.*)',
    '/api/trpc/persona(.*)',
  ],
}

/**
 * Clerk Auth Middleware
 * Handles authentication, authorization, rate limiting, and feature flag passing
 */
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes,
  
  /**
   * Function executed before authentication check
   * Handles rate limiting for API routes
   */
  async beforeAuth(req) {
    // Apply rate limiting to API routes
    if (req.nextUrl.pathname.startsWith('/api/') && redis && ratelimit) {
      // Use IP address as identifier for rate limiting
      const ip = req.ip ?? '127.0.0.1'
      const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_middleware_${ip}`)
      
      // If rate limit exceeded, return 429 Too Many Requests
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests', limit, reset },
          { 
            status: 429, 
            headers: { 
              'X-RateLimit-Limit': limit.toString(), 
              'X-RateLimit-Remaining': remaining.toString(), 
              'X-RateLimit-Reset': reset.toString() 
            } 
          }
        )
      }
    }
    
    return NextResponse.next()
  },
  
  /**
   * Function executed after authentication check
   * Handles route protection, role-based access, and feature flag passing
   */
  async afterAuth(auth, req, evt) {
    // Extract auth data
    const { userId, sessionId, isPublicRoute } = auth
    const url = req.nextUrl
    
    // If trying to access a protected route without authentication
    if (!isPublicRoute && !sessionId) {
      // Redirect to login page with a return URL
      const returnUrl = encodeURIComponent(url.pathname + url.search)
      const redirectUrl = new URL(`/login?return_to=${returnUrl}`, req.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Create response for later modification
    const response = NextResponse.next()
    
    // Role-based access control for protected routes
    if (userId && isProtectedByRole(url.pathname)) {
      try {
        // Get user data from database
        const user = await getUserFromDatabase(userId)
        
        if (!user) {
          // If user not found, redirect to login
          return NextResponse.redirect(new URL('/login', req.url))
        }
        
        // Add user role to response headers
        response.headers.set('x-user-role', user.role)
        
        // Check if user has permission to access the route
        if (!hasPermission(url.pathname, user.role)) {
          // Redirect to appropriate page based on role
          const redirectPath = 
            user.role === UserRole.USER ? '/dashboard' : 
            user.role === UserRole.MODEL ? '/dashboard/content' : 
            user.role === UserRole.MANAGER ? '/dashboard/team' : 
            '/dashboard'
          return NextResponse.redirect(new URL(redirectPath, req.url))
        }
      } catch (error) {
        console.error('Error fetching user data in middleware:', error)
        // In case of errors, fail secure by redirecting
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
    
    // Add feature flags to headers for client-side access
    for (const [key, value] of Object.entries(FEATURE_FLAGS)) {
      response.headers.set(`x-feature-${key.toLowerCase()}`, String(value))
    }
    
    // Add user ID for tracking/debugging
    if (userId) {
      response.headers.set('x-user-id', userId)
    }
    
    return response
  },
})

/**
 * Get user data from database using Clerk ID
 */
async function getUserFromDatabase(userId: string) {
  try {
    // Get Clerk user data
    const clerkUser = await clerkClient.users.getUser(userId)
    
    // First try to get user from database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    })
    
    if (!user) {
      // If no user found, fallback to Clerk metadata
      const role = clerkUser.publicMetadata.role as UserRole || UserRole.USER
      return { id: userId, role }
    }
    
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

/**
 * Check if a path is protected by role-based access control
 */
function isProtectedByRole(path: string): boolean {
  // Check if path matches any role-protected routes
  return Object.values(authorizedRoutes).flat().some(route => {
    const routeRegex = new RegExp(`^${route.replace('(.*)', '.*')}$`)
    return routeRegex.test(path)
  })
}

/**
 * Check if a user role has permission to access a path
 */
function hasPermission(path: string, role: UserRole): boolean {
  // Admins can access everything
  if (role === UserRole.ADMIN) return true
  
  // Get permitted routes based on role
  let permittedRoutes: string[] = []
  
  if (role === UserRole.MANAGER) {
    permittedRoutes = [
      ...authorizedRoutes.manager,
    ]
  } else if (role === UserRole.MODEL) {
    permittedRoutes = [
      ...authorizedRoutes.model,
    ]
  }
  
  // Check if path matches any permitted routes
  return permittedRoutes.some(route => {
    const routeRegex = new RegExp(`^${route.replace('(.*)', '.*')}$`)
    return routeRegex.test(path)
  })
}

// Configure the middleware to match specific paths
export const config = {
  matcher: [
    // Match all paths except static files, images, and specific API routes
    '/((?!_next/static|_next/image|favicon.ico|public/|api/health).*)',
  ],
} 