import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs';
import { cookies } from 'next/headers';

// Demo user settings (must match seed script)
const DEMO_USER_ID = 'demo-user-001';
const DEMO_CLERK_ID = 'user_2NVZjAQZWzlR6EjZW8R6mLvZ5KO';

/**
 * GET handler for the demo login endpoint
 * Creates a temporary session for the demo user
 */
export async function GET() {
  const isDemoMode = process.env.DEMO_MODE === 'true';
  
  // Only allow demo login in demo mode
  if (!isDemoMode) {
    return NextResponse.json({ error: 'Demo mode is not enabled' }, { status: 403 });
  }
  
  try {
    // In a production environment, you would use Clerk's API to create a real demo session
    // For the demo implementation, we'll redirect to the dashboard with a cookie
    const cookieStore = cookies();
    
    // Set a custom demo cookie (in a real implementation you'd use Clerk's session)
    cookieStore.set('demo_mode_active', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Failed to create demo session' }, { status: 500 });
  }
}

/**
 * In a production app, you would implement Clerk's createSession or similar
 * to create a real authenticated session for the demo user.
 * 
 * For the purpose of this demo, we're using a simpler approach with cookies.
 */ 