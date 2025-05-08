import { TRPCError } from '@trpc/server';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { MiddlewareFunction } from '@trpc/server/dist/core/middleware';

// CSRF token cookie name
const CSRF_COOKIE_NAME = 'ofauto-csrf-token';
// Header name for CSRF token
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Get the current CSRF token or generate a new one
 */
export function getCsrfToken(): string {
  const cookieStore = cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  
  if (!token) {
    token = generateCsrfToken();
    // In a real implementation, we'd set the cookie here, but since cookies() is read-only,
    // we'd need to handle this in middleware or API routes
  }
  
  return token;
}

/**
 * Validate the CSRF token
 * @param requestToken The token from the request header
 * @param cookieToken The token from the cookie
 */
export function validateCsrfToken(requestToken: string, cookieToken: string): boolean {
  if (!requestToken || !cookieToken) {
    return false;
  }
  
  return requestToken === cookieToken;
}

/**
 * CSRF protection middleware for tRPC
 */
export function csrf(): MiddlewareFunction<any, any> {
  return async ({ ctx, next }) => {
    // Skip CSRF check for non-mutation procedures (GET requests)
    if (ctx.req?.method?.toUpperCase() === 'GET') {
      return next();
    }
    
    // Get the token from request
    const requestToken = ctx.req?.headers?.[CSRF_HEADER_NAME] as string | undefined;
    
    // Get the token from cookie
    const cookieStore = cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    
    // Validate token
    if (!validateCsrfToken(requestToken as string, cookieToken as string)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Invalid or missing CSRF token',
      });
    }
    
    return next();
  };
}

/**
 * React hook to get CSRF token for forms
 * This would be used in client components to add the token to forms
 */
export function useCsrfToken() {
  // In a real implementation, this would fetch the token from an API endpoint
  // For this example, we'll just return a placeholder
  return { csrfToken: 'placeholder-token' };
}

/**
 * Next.js middleware to set CSRF token cookie
 * This should be added to the Next.js middleware stack
 */
export async function setCsrfTokenCookie(req: Request, res: Response) {
  const cookieStore = cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  
  if (!token) {
    token = generateCsrfToken();
    // In a production environment, set secure and httpOnly flags
    res.headers.set('Set-Cookie', `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  }
  
  return token;
} 